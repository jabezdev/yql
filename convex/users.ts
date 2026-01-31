
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getViewer, ensureAdmin } from "./auth";

/**
 * Syncs the Clerk user to the Convex users table.
 * Should be called on app load.
 */
export const storeUser = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called storeUser without authentication present");
        }

        // Check by tokenIdentifier
        const user = await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (user !== null) {
            // Update metadata if needed
            if (user.name !== identity.name || user.email !== identity.email) {
                await ctx.db.patch(user._id, { name: identity.name!, email: identity.email! });
            }
            return user._id;
        }

        // Check by email (migration/linking)
        const userByEmail = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (userByEmail !== null) {
            // Link account
            await ctx.db.patch(userByEmail._id, { tokenIdentifier: identity.tokenIdentifier });
            return userByEmail._id;
        }

        // New User -> Create as Applicant
        const activeCohort = await ctx.db
            .query("cohorts")
            .withIndex("by_active", (q) => q.eq("isActive", true))
            .first();

        // Create the user record
        const userId = await ctx.db.insert("users", {
            name: identity.name!,
            email: identity.email!,
            tokenIdentifier: identity.tokenIdentifier,
            role: "applicant",
        });

        // If there is an active cohort, start an application
        if (activeCohort) {
            let initialStageId = "form";

            if (activeCohort.stageIds && activeCohort.stageIds.length > 0) {
                // Use first stage ID
                initialStageId = activeCohort.stageIds[0];
            } else if (activeCohort.pipeline && activeCohort.pipeline.length > 0) {
                initialStageId = activeCohort.pipeline[0]?.id || "form";
            }
            await ctx.db.insert("applications", {
                userId,
                cohortId: activeCohort._id,
                currentStageId: initialStageId,
                status: "pending",
                updatedAt: Date.now(),
                stageData: {}
            });
        }

        return userId;
    },
});

export const createReviewer = mutation({
    args: {
        email: v.string(),
        name: v.string(),
        assignToCohortId: v.optional(v.id("cohorts")),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (existingUser) {
            throw new Error("User already exists");
        }

        const userId = await ctx.db.insert("users", {
            email: args.email,
            name: args.name,
            role: "reviewer",
            linkedCohortIds: args.assignToCohortId ? [args.assignToCohortId] : [],
        });

        return userId;
    },
});

export const getReviewers = query({
    args: { cohortId: v.optional(v.id("cohorts")) },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        const reviewers = await ctx.db.query("users").filter(q => q.eq(q.field("role"), "reviewer")).collect();

        if (args.cohortId) {
            return reviewers.filter(r => {
                if (!r.linkedCohortIds || r.linkedCohortIds.length === 0) return true;
                return r.linkedCohortIds.includes(args.cohortId!);
            });
        }
        return reviewers;
    }
});

export const getUser = query({
    args: { id: v.id("users") },
    handler: async (ctx, args) => {
        const requestor = await getViewer(ctx);
        if (!requestor) throw new Error("Unauthorized");

        if (requestor._id === args.id) return requestor;

        if (requestor.role === "admin" || requestor.role === "reviewer") {
            return await ctx.db.get(args.id);
        }

        throw new Error("Unauthorized access to user data");
    }
});

// Used by RoleDispatcher and other components to get current user
export const getMe = query({
    args: {},
    handler: async (ctx) => {
        return await getViewer(ctx);
    },
});

export const seedAdmin = mutation({
    args: {
        email: v.string(),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const existingAdmin = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("role"), "admin"))
            .first();

        if (existingAdmin) {
            if (existingAdmin.email === args.email) {
                return existingAdmin._id;
            }
            throw new Error("Admin user already exists. Cannot seed.");
        }

        const userId = await ctx.db.insert("users", {
            email: args.email,
            name: args.name,
            role: "admin",
            linkedCohortIds: [],
        });

        return userId;
    },
});

/**
 * Manually import a user and start them at a specific stage.
 * Useful for fast-tracking or migration.
 */
export const onboardUser = mutation({
    args: {
        email: v.string(),
        name: v.string(),
        targetStageId: v.string(),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        let userId;
        const existingUser = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", args.email)).first();

        if (existingUser) {
            userId = existingUser._id;
        } else {
            userId = await ctx.db.insert("users", {
                email: args.email,
                name: args.name,
                role: "applicant",
            });
        }

        const activeCohort = await ctx.db.query("cohorts").withIndex("by_active", q => q.eq("isActive", true)).first();
        if (!activeCohort) throw new Error("No active cohort found");

        // Check if application exists
        const existingApp = await ctx.db.query("applications").withIndex("by_user", q => q.eq("userId", userId)).first();
        if (existingApp) {
            // Update existing application
            await ctx.db.patch(existingApp._id, {
                cohortId: activeCohort._id,
                currentStageId: args.targetStageId,
                updatedAt: Date.now()
            });
        } else {
            // Create new application
            await ctx.db.insert("applications", {
                userId,
                cohortId: activeCohort._id,
                currentStageId: args.targetStageId,
                status: "pending",
                updatedAt: Date.now(),
                stageData: {}
            });
        }

        return userId;
    }
});

/**
 * Recommits a user to the active cohort.
 * If they have an old application, it might be archived or ignored, creating a new one or updating.
 * Simplified here to just update/ensure application for active cohort.
 */
export const recommitToActiveCohort = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        const activeCohort = await ctx.db.query("cohorts").withIndex("by_active", q => q.eq("isActive", true)).first();
        if (!activeCohort) throw new Error("No active cohort");

        const existingApp = await ctx.db.query("applications").withIndex("by_user", q => q.eq("userId", user._id)).first();

        let initialStageId = "form";
        if (activeCohort.stageIds && activeCohort.stageIds.length > 0) {
            initialStageId = activeCohort.stageIds[0];
        } else if (activeCohort.pipeline && activeCohort.pipeline.length > 0) {
            initialStageId = activeCohort.pipeline[0]?.id || "form";
        }

        if (existingApp) {
            // If existing app is for same cohort, do nothing? Or reset?
            // If different cohort, maybe update it? Or creates new logic (schema only supports one app per user currently due to by_user index unique? No, index isn't unique, but logic implies one.)
            // Let's assume one active application.
            if (existingApp.cohortId !== activeCohort._id) {
                await ctx.db.patch(existingApp._id, {
                    cohortId: activeCohort._id,
                    currentStageId: initialStageId,
                    status: "pending",
                    updatedAt: Date.now()
                });
            }
        } else {
            await ctx.db.insert("applications", {
                userId: user._id,
                cohortId: activeCohort._id,
                currentStageId: initialStageId,
                status: "pending",
                updatedAt: Date.now(),
                stageData: {}
            });
        }
    }
});
