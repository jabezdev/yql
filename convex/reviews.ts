import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { ensureReviewer } from "./auth";

export const submitReview = mutation({
    args: {
        applicationId: v.id("applications"),
        score: v.number(),
        notes: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ensureReviewer(ctx);
        await ctx.db.insert("reviews", {
            applicationId: args.applicationId,
            reviewerId: user._id,
            generalScore: args.score,
            generalNotes: args.notes,
            createdAt: Date.now(),
        });
    },
});
