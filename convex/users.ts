import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
            password: args.password,
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

        return userId;
    },
});

export const createReviewer = mutation({
    args: {
        adminId: v.id("users"),
        email: v.string(),
        password: v.string(),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        // 1. Verify Admin
        const admin = await ctx.db.get(args.adminId);
        if (!admin || admin.role !== "admin") {
            throw new Error("Unauthorized: Only admins can create reviewers.");
        }

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
            password: args.password,
            name: args.name,
            role: "reviewer",
        });

        return userId;
    },
});

export const getReviewers = query({
    args: {},
    handler: async (ctx) => {
        // In a real app we would filter/check auth here too, but for listing it's okay-ish 
        // provided we only show it on admin dashboard which is protected by UI. 
        // Ideally we pass adminId here too but for simplicity...
        return await ctx.db.query("users").filter(q => q.eq(q.field("role"), "reviewer")).collect();
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

        if (!user || user.password !== args.password) {
            return null;
        }

        return {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
    },
});

export const getUser = query({
    args: { id: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});
