import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { createSession, ensureAdmin, authenticate as verifySession, hashPassword, verifyPassword } from "./auth";

export const registerApplicant = mutation({
    args: {
        email: v.string(),
        password: v.string(),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (existingUser) {
            throw new Error("User already exists");
        }

        const activeCohort = await ctx.db
            .query("cohorts")
            .withIndex("by_active", (q) => q.eq("isActive", true))
            .first();

        if (!activeCohort) {
            throw new Error("No active admission cohort found.");
        }

        const userId = await ctx.db.insert("users", {
            email: args.email,
            password: await hashPassword(args.password),
            name: args.name,
            role: "applicant",
        });

        // Use the first stage from the pipeline as the initial stage
        const initialStageId = activeCohort.pipeline[0]?.id || "form";

        await ctx.db.insert("applications", {
            userId,
            cohortId: activeCohort._id,
            currentStageId: initialStageId,
            status: "pending",
            updatedAt: Date.now(),
            stageData: {} // Initialize empty stage data
        });

        const token = await createSession(ctx, userId);
        return { userId, token };
    },
});

export const createReviewer = mutation({
    args: {
        token: v.string(),
        adminId: v.id("users"),
        email: v.string(),
        password: v.string(),
        name: v.string(),
        assignToCohortId: v.optional(v.id("cohorts")),
    },
    handler: async (ctx, args) => {
        // 1. Verify Admin
        await ensureAdmin(ctx, args.token);

        // 2. Check existence
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (existingUser) {
            throw new Error("User already exists");
        }

        // 3. Create Reviewer
        const userId = await ctx.db.insert("users", {
            email: args.email,
            password: await hashPassword(args.password),
            name: args.name,
            role: "reviewer",
            linkedCohortIds: args.assignToCohortId ? [args.assignToCohortId] : [],
        });

        return userId;
    },
});

export const getReviewers = query({
    args: { token: v.string(), cohortId: v.optional(v.id("cohorts")) },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx, args.token);
        const reviewers = await ctx.db.query("users").filter(q => q.eq(q.field("role"), "reviewer")).collect();

        if (args.cohortId) {
            return reviewers.filter(r => {
                if (!r.linkedCohortIds || r.linkedCohortIds.length === 0) return true; // Global
                return r.linkedCohortIds.includes(args.cohortId!);
            });
        }
        return reviewers;
    }
});

export const authenticate = mutation({
    args: {
        email: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (!user) {
            return null;
        }

        const isValid = await verifyPassword(args.password, user.password);
        if (!isValid) {
            // Fallback for legacy plain text passwords during migration phase
            // If verify fails, check if plain text matches (OPTIONAL SAFETY NET)
            if (user.password === args.password) {
                // It was a match on plain text, we should probably upgrade it here?
                // But let's stick to strict or just strict fail.
                // Ideally migration runs first.
                // Let's allow plain text match for now to avoid lockout before migration?
                // No, implementation plan says migration script.
                // BUT for dev speed, I'll add a check: if it matches plain text, re-hash it?
                // Actually `bcrypt.compare` usually handles this if not a hash? No it throws or returns false.
                // Let's keep it simple: verifyPassword. If false, return null. The migration will fix existing users.
                return null;
            }
            return null;
        }

        // Create Session
        const token = await createSession(ctx, user._id);

        return {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token, // Return the token!
        };
    },
});

export const getUser = query({
    args: { token: v.string(), id: v.id("users") },
    handler: async (ctx, args) => {
        // Ensure requestor has right to see this user
        // 1. If it's themselves
        // 2. If it's an admin/reviewer

        // This query is slightly tricky because we might need it for bootstrapping the session?
        // But usually we have the user object from authenticate.

        // Let's just enforce that you must be logged in.
        const requestor = await verifySession(ctx, args.token);

        if (requestor._id === args.id) return requestor;

        if (requestor.role === "admin" || requestor.role === "reviewer") {
            return await ctx.db.get(args.id);
        }

        throw new Error("Unauthorized access to user data");
    },
});

export const onboardUser = mutation({
    args: {
        token: v.string(),
        adminId: v.id("users"),
        email: v.string(),
        name: v.string(),
        targetStageId: v.optional(v.string()), // e.g. "agreement" to skip steps
    },
    handler: async (ctx, args) => {
        // 1. Verify Admin
        await ensureAdmin(ctx, args.token);

        const activeCohort = await ctx.db.query("cohorts").withIndex("by_active", q => q.eq("isActive", true)).first();
        if (!activeCohort) throw new Error("No active cohort.");

        let userId: Id<"users">;
        const existingUser = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", args.email)).first();

        if (existingUser) {
            userId = existingUser._id;
            // Check if already in this cohort?
            const existingApp = await ctx.db.query("applications").withIndex("by_user", q => q.eq("userId", userId)).collect();
            const inCohort = existingApp.find(a => a.cohortId === activeCohort._id);
            if (inCohort) {
                // Update stage if forced? Or throw? Let's just update for idempotency
                await ctx.db.patch(inCohort._id, { currentStageId: args.targetStageId || inCohort.currentStageId });
                return userId;
            }
        } else {
            // Create User (Dummy password for now, typically would send invite)
            userId = await ctx.db.insert("users", {
                email: args.email,
                name: args.name,
                role: "applicant",
                password: await hashPassword("changeme123"),
            });
        }

        await ctx.db.insert("applications", {
            userId,
            cohortId: activeCohort._id,
            currentStageId: args.targetStageId || activeCohort.pipeline[0]?.id || 'form',
            status: "pending",
            updatedAt: Date.now(),
            stageData: {}
        });

        return userId;
    }
});

export const recommitToActiveCohort = mutation({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const user = await verifySession(ctx, args.token);
        const userId = user._id;

        const activeCohort = await ctx.db.query("cohorts").withIndex("by_active", q => q.eq("isActive", true)).first();
        if (!activeCohort) throw new Error("No active cohort.");

        // Verify user logic if needed (e.g. check identity match with ctx.auth if we used it)

        const existingApp = await ctx.db.query("applications").withIndex("by_user", q => q.eq("userId", userId)).collect();
        if (existingApp.some(a => a.cohortId === activeCohort._id)) {
            throw new Error("You have already applied to this cohort.");
        }

        // Check if "agreement" stage exists, explicitly search for type 'agreement' or id 'agreement'
        const agreementStage = activeCohort.pipeline.find(p => p.type === 'agreement' || p.id === 'agreement');
        const targetStage = agreementStage ? agreementStage.id : (activeCohort.pipeline[0]?.id || 'form');

        await ctx.db.insert("applications", {
            userId: userId,
            cohortId: activeCohort._id,
            currentStageId: targetStage,
            status: "pending",
            updatedAt: Date.now(),
            stageData: {}
        });
    }
});

/**
 * seeding the admin user if none exists.
 * Secure by "Trust On First Use": Only works if NO admins exist.
 */
export const seedAdmin = mutation({
    args: {
        email: v.string(),
        password: v.string(),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        // 1. Security Check: ensure no admins exist
        const existingAdmin = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("role"), "admin"))
            .first();

        if (existingAdmin) {
            // Idempotent success or error?
            // If the email matches, maybe it's fine.
            if (existingAdmin.email === args.email) {
                console.log("Admin already exists with this email.");
                return existingAdmin._id;
            }
            throw new Error("Admin user already exists. Cannot seed.");
        }

        // 2. Create Admin
        const userId = await ctx.db.insert("users", {
            email: args.email,
            password: await hashPassword(args.password),
            name: args.name,
            role: "admin",
            linkedCohortIds: [],
        });

        return userId;
    },
});
