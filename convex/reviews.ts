import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { ensureReviewer } from "./auth";

export const submitReview = mutation({
    args: {
        token: v.string(),
        applicationId: v.id("applications"),
        // reviewerId removed, derived from token
        score: v.number(),
        notes: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ensureReviewer(ctx, args.token);
        await ctx.db.insert("reviews", {
            applicationId: args.applicationId,
            reviewerId: user._id, // FORCE use authenticated user
            score: args.score,
            notes: args.notes,
            createdAt: Date.now(),
        });

        // Also update application scores (optional, but good for quick access)
        // For now, we just store the review.
    },
});
