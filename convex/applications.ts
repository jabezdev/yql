import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authenticate, ensureAdmin, ensureReviewer } from "./auth";

/**
 * Gets a single application.
 * - If userId is provided, checks if caller is Admin/Reviewer OR the user themselves.
 * - If userId is NOT provided, returns the caller's application.
 */
export const getApplication = query({
    args: {
        token: v.string(),
        userId: v.optional(v.id("users"))
    },
    handler: async (ctx, args) => {
        const user = await authenticate(ctx, args.token);

        let targetUserId = user._id;
        if (args.userId) {
            if (args.userId !== user._id && user.role !== "admin" && user.role !== "reviewer") {
                throw new Error("Unauthorized");
            }
            targetUserId = args.userId;
        }

        return await ctx.db
            .query("applications")
            .withIndex("by_user", (q) => q.eq("userId", targetUserId))
            .first();
    },
});

/**
 * Gets all applications (Reviewers/Admins only).
 */
export const getAllApplications = query({
    args: {
        token: v.string(),
        cohortId: v.optional(v.id("cohorts"))
    },
    handler: async (ctx, args) => {
        await ensureReviewer(ctx, args.token);

        if (args.cohortId) {
            return await ctx.db
                .query("applications")
                .withIndex("by_cohort", q => q.eq("cohortId", args.cohortId))
                .collect();
        }
        return await ctx.db.query("applications").collect();
    },
});

/**
 * Updates just status (Admin only).
 */
export const updateStatus = mutation({
    args: {
        token: v.string(),
        applicationId: v.id("applications"),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx, args.token);
        await ctx.db.patch(args.applicationId, {
            status: args.status,
            updatedAt: Date.now(),
        });
    },
});

/**
 * Safely submit data for the CURRENT stage and advance if applicable.
 */
export const submitStage = mutation({
    args: {
        token: v.string(),
        applicationId: v.id("applications"),
        stageId: v.string(),
        data: v.any(), // Validated against schema below
    },
    handler: async (ctx, args) => {
        const user = await authenticate(ctx, args.token);
        const application = await ctx.db.get(args.applicationId);

        if (!application) throw new Error("Application not found");
        if (application.userId !== user._id && user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const cohort = await ctx.db.get(application.cohortId!);
        if (!cohort) throw new Error("Cohort not found");

        // 1. Validate Current Stage
        const currentStageConfig = cohort.pipeline.find(p => p.id === application.currentStageId);
        if (!currentStageConfig) throw new Error("Invalid stage configuration");

        if (args.stageId !== currentStageConfig.id) {
            throw new Error("Stage mismatch. You are trying to submit to a different stage.");
        }

        // 2. Validate Data (Basic Required Check)
        // If formConfig exists, check required fields
        if (currentStageConfig.formConfig) {
            for (const field of currentStageConfig.formConfig) {
                if (field.required && (args.data[field.id] === undefined || args.data[field.id] === "")) {
                    throw new Error(`Field ${field.label} is required.`);
                }
            }
        }

        // 3. Save Data
        const newStageData = {
            ...application.stageData,
            [args.stageId]: args.data
        };

        // 4. Calculate Next Stage
        const currentIndex = cohort.pipeline.findIndex(p => p.id === args.stageId);
        const nextStage = cohort.pipeline[currentIndex + 1];

        const updates: any = {
            stageData: newStageData,
            updatedAt: Date.now(),
        };

        if (nextStage) {
            updates.currentStageId = nextStage.id;
        } else {
            // End of pipeline? Maybe mark as completed?
            // "completed" type stage is usually the last one, so we stay there?
            // If current stage is 'completed', we shouldn't be submitting.
            if (currentStageConfig.type !== 'completed') {
                // If no next stage, maybe we are done?
            }
        }

        await ctx.db.patch(application._id, updates);
    }
});

/**
 * Manually update stage (Admin Only override).
 */
export const updateStage = mutation({
    args: {
        token: v.string(),
        applicationId: v.id("applications"),
        stage: v.string(),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx, args.token);
        await ctx.db.patch(args.applicationId, {
            currentStageId: args.stage,
            updatedAt: Date.now(),
        });
    },
});

/**
 * Manually update data (Admin/Owner - but prefer submitStage for flow).
 */
export const updateApplicationData = mutation({
    args: {
        token: v.string(),
        applicationId: v.id("applications"),
        stageData: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const user = await authenticate(ctx, args.token);
        const app = await ctx.db.get(args.applicationId);
        if (!app) throw new Error("Not found");

        if (app.userId !== user._id && user.role !== "admin") throw new Error("Unauthorized");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const patch: any = { updatedAt: Date.now() };
        if (args.stageData) patch.stageData = args.stageData;

        await ctx.db.patch(args.applicationId, patch);
    }
})
