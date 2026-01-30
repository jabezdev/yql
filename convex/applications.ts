import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getApplication = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("applications")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();
    },
});

export const getAllApplications = query({
    args: {},
    handler: async (ctx) => {
        // In a real app, you might want to join with users table to get names
        // For now, we'll fetch applications
        return await ctx.db.query("applications").collect();
    },
});

export const updateStage = mutation({
    args: {
        applicationId: v.id("applications"),
        stage: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.applicationId, {
            currentStageId: args.stage,
            updatedAt: Date.now(),
        });
    },
});

export const updateStatus = mutation({
    args: {
        applicationId: v.id("applications"),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.applicationId, {
            status: args.status,
            updatedAt: Date.now(),
        });
    },
});

export const updateApplicationData = mutation({
    args: {
        applicationId: v.id("applications"),
        stageData: v.optional(v.any()), // Renamed from formData to match schema
    },
    handler: async (ctx, args) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const patch: any = { updatedAt: Date.now() };
        if (args.stageData) patch.stageData = args.stageData;

        await ctx.db.patch(args.applicationId, patch);
    }
})
