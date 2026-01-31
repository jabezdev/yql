import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getViewer } from "./auth";

/**
 * Validates an access gate passcode server-side.
 * Never exposes the actual passcode to the client.
 */
export const validatePasscode = mutation({
    args: {
        blockId: v.id("block_instances"),
        passcode: v.string(),
    },
    handler: async (ctx, args) => {
        // Require authentication
        const user = await getViewer(ctx);
        if (!user) {
            throw new Error("Unauthorized");
        }

        const block = await ctx.db.get(args.blockId);
        if (!block) {
            return { success: false, error: "Block not found" };
        }

        // Check passcode (case-sensitive)
        const correctPasscode = block.config?.passcode;
        if (!correctPasscode) {
            // No passcode configured = always unlocked
            return { success: true };
        }

        const isValid = args.passcode === correctPasscode;
        return { success: isValid };
    },
});
