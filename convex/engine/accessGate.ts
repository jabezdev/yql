import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getViewer } from "../core/auth";
import { createAuditLog } from "../core/auditLog";

// Rate limiting constants
const MAX_ATTEMPTS_PER_HOUR = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Validates an access gate passcode server-side.
 * Never exposes the actual passcode to the client.
 * Includes rate limiting and audit logging for security.
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

        const now = Date.now();
        const actionKey = `access_gate.attempt.${args.blockId}`;

        // 1. Check Rate Limit
        const rateLimit = await ctx.db
            .query("rate_limits")
            .withIndex("by_user_action", (q) => q.eq("userId", user._id).eq("action", actionKey))
            .first();

        if (rateLimit) {
            // Reset if window passed
            if (now - rateLimit.windowStart > RATE_LIMIT_WINDOW_MS) {
                await ctx.db.patch(rateLimit._id, {
                    count: 0,
                    windowStart: now,
                });
            } else if (rateLimit.count >= MAX_ATTEMPTS_PER_HOUR) {
                throw new Error(`Too many attempts. Please try again in 1 hour.`);
            }
        }

        const block = await ctx.db.get(args.blockId);
        if (!block) {
            return { success: false, error: "Block not found" };
        }

        const correctPasscode = block.config?.passcode;
        if (!correctPasscode) {
            // No passcode configured = always unlocked
            return { success: true };
        }

        // Timing-safe comparison to prevent timing attacks
        // Both strings are compared character by character with constant time
        const isValid = timingSafeEqual(args.passcode, correctPasscode);

        if (!isValid) {
            // 2. Increment Rate Limit Counter
            if (rateLimit) {
                // Determine if we need to reset window (though logic above handles expiry check, 
                // we only patch here if valid window. If expired, logic above would have reset it, 
                // but checking again safely handles edge cases).
                // Actually, if we are here, we are either within window & under limit, OR window expired and we just reset it above?
                // Wait, if window expired above, we patched it to 0. So here we just increment.

                // Re-fetch or stick to simple increment? 
                // Since we patched it above, we can just increment.
                // However, let's keep it robust:
                // If it was expired, we reset above. So now we are fresh.

                await ctx.db.patch(rateLimit._id, {
                    count: (rateLimit.windowStart + RATE_LIMIT_WINDOW_MS < now ? 0 : rateLimit.count) + 1,
                    windowStart: rateLimit.windowStart + RATE_LIMIT_WINDOW_MS < now ? now : rateLimit.windowStart
                });
            } else {
                await ctx.db.insert("rate_limits", {
                    userId: user._id,
                    action: actionKey,
                    count: 1,
                    windowStart: now,
                });
            }

            // 3. Log Audit
            await createAuditLog(ctx, {
                userId: user._id,
                action: "access_gate.failed_attempt",
                entityType: "block_instances",
                entityId: args.blockId,
                metadata: {
                    attemptedAt: now,
                }
            });
        }

        return { success: isValid };
    },
});

/**
 * Timing-safe string comparison to prevent timing attacks.
 * Always compares the full length of both strings.
 */
function timingSafeEqual(a: string, b: string): boolean {
    // Ensure we always compare the same number of characters
    const maxLength = Math.max(a.length, b.length);
    let result = a.length === b.length ? 0 : 1;

    for (let i = 0; i < maxLength; i++) {
        const charA = a.charCodeAt(i) || 0;
        const charB = b.charCodeAt(i) || 0;
        result |= charA ^ charB;
    }

    return result === 0;
}

