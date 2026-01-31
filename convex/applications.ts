
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getViewer, ensureAdmin, ensureReviewer } from "./auth";

/**
 * Gets a single application.
 * - If userId is provided, checks if caller is Admin/Reviewer OR the user themselves.
 * - If userId is NOT provided, returns the caller's application.
 */
export const getApplication = query({
    args: {
        userId: v.optional(v.id("users"))
    },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

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
        cohortId: v.optional(v.id("cohorts"))
    },
    handler: async (ctx, args) => {
        await ensureReviewer(ctx);

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
        applicationId: v.id("applications"),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
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
        applicationId: v.id("applications"),
        stageId: v.string(),
        data: v.any(), // Validated against schema below
    },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        const application = await ctx.db.get(args.applicationId);

        if (!application) throw new Error("Application not found");
        if (application.userId !== user._id && user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const cohort = await ctx.db.get(application.cohortId!);
        if (!cohort) throw new Error("Cohort not found");

        // 1. Validate Current Stage & Fetch Pipeline
        let currentStageConfig;
        let pipeline: any[] = [];

        if (cohort.stageIds && cohort.stageIds.length > 0) {
            // New Schema: Fetch stages from DB
            // We need the full list to determine "next stage"
            // Optimization: We could just fetch the current and next if we knew the order, 
            // but stageIds gives us the order.
            pipeline = (await Promise.all(cohort.stageIds.map((id: any) => ctx.db.get(id)))).filter(Boolean);

            currentStageConfig = pipeline.find(p => p._id === application.currentStageId || p.originalStageId === application.currentStageId);
        } else {
            // Fallback to legacy pipeline
            pipeline = cohort.pipeline || [];
            currentStageConfig = pipeline.find((p: any) => p.id === application.currentStageId);
        }

        if (!currentStageConfig) throw new Error("Invalid stage configuration");

        // Allow both ID match (new) and string ID match (legacy/migrated)
        const isMatch = args.stageId === currentStageConfig._id || args.stageId === currentStageConfig.id || args.stageId === currentStageConfig.originalStageId;

        if (!isMatch) {
            throw new Error(`Stage mismatch. You are trying to submit to ${args.stageId} but app is at ${application.currentStageId}`);
        }

        // 2. Validate Data (Basic Required Check)
        // If formConfig exists (in config object or root depending on schema version)
        const formConfig = currentStageConfig.config?.formConfig || currentStageConfig.formConfig;

        if (formConfig) {
            for (const field of formConfig) {
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
        const currentIndex = pipeline.findIndex(p => p._id === currentStageConfig._id || p.id === currentStageConfig.id);
        const nextStage = pipeline[currentIndex + 1];

        const updates: any = {
            stageData: newStageData,
            updatedAt: Date.now(),
        };

        if (nextStage) {
            // Use _id for new stages, id for legacy
            updates.currentStageId = nextStage._id || nextStage.id;
        } else {
            // End of pipeline
        }

        await ctx.db.patch(application._id, updates);
    }
});

/**
 * Manually update stage (Admin Only override).
 */
export const updateStage = mutation({
    args: {
        applicationId: v.id("applications"),
        stage: v.string(),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
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
        applicationId: v.id("applications"),
        stageData: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        const app = await ctx.db.get(args.applicationId);
        if (!app) throw new Error("Not found");

        if (app.userId !== user._id && user.role !== "admin") throw new Error("Unauthorized");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const patch: any = { updatedAt: Date.now() };
        if (args.stageData) patch.stageData = args.stageData;

        await ctx.db.patch(args.applicationId, patch);
    }
})
