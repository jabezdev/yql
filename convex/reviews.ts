import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const submitReview = mutation({
    args: {
        applicationId: v.id("applications"),
        reviewerId: v.id("users"),
        score: v.number(),
        notes: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("reviews", {
            applicationId: args.applicationId,
            reviewerId: args.reviewerId,
            score: args.score,
            notes: args.notes,
            createdAt: Date.now(),
        });

        // Also update application scores (optional, but good for quick access)
        // For now, we just store the review.
    },
});
