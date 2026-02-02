import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * Rate limiting configuration per action type
 */
export const RATE_LIMITS: Record<string, { maxActions: number; windowMs: number }> = {
    // Process creation: 10 per hour
    "process.create": { maxActions: 10, windowMs: 60 * 60 * 1000 },

    // Notification creation: 50 per hour
    "notification.create": { maxActions: 50, windowMs: 60 * 60 * 1000 },

    // Event creation: 20 per hour
    "event.create": { maxActions: 20, windowMs: 60 * 60 * 1000 },

    // Default fallback
    "default": { maxActions: 100, windowMs: 60 * 60 * 1000 },
};

/**
 * Check if an action is rate limited for a user.
 * Returns true if action is allowed, false if rate limited.
 *
 * @param ctx - Mutation context
 * @param userId - User ID to check
 * @param action - Action type (e.g., "process.create")
 * @returns Object with `allowed` boolean and `remaining` count
 */
export async function checkRateLimit(
    ctx: MutationCtx,
    userId: Id<"users">,
    action: string
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const config = RATE_LIMITS[action] || RATE_LIMITS["default"];
    const now = Date.now();

    // Find existing rate limit record
    const existing = await ctx.db
        .query("rate_limits")
        .withIndex("by_user_action", (q) =>
            q.eq("userId", userId).eq("action", action)
        )
        .unique();

    if (!existing) {
        // No record exists, create one
        await ctx.db.insert("rate_limits", {
            userId,
            action,
            count: 1,
            windowStart: now,
        });

        return {
            allowed: true,
            remaining: config.maxActions - 1,
            resetAt: now + config.windowMs,
        };
    }

    // Check if window has expired
    const windowExpired = now - existing.windowStart >= config.windowMs;

    if (windowExpired) {
        // Reset the window
        await ctx.db.patch(existing._id, {
            count: 1,
            windowStart: now,
        });

        return {
            allowed: true,
            remaining: config.maxActions - 1,
            resetAt: now + config.windowMs,
        };
    }

    // Window still active, check count
    if (existing.count >= config.maxActions) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: existing.windowStart + config.windowMs,
        };
    }

    // Increment count
    await ctx.db.patch(existing._id, {
        count: existing.count + 1,
    });

    return {
        allowed: true,
        remaining: config.maxActions - existing.count - 1,
        resetAt: existing.windowStart + config.windowMs,
    };
}

/**
 * Require rate limit check - throws if rate limited
 *
 * @param ctx - Mutation context
 * @param userId - User ID to check
 * @param action - Action type
 * @throws Error if rate limited
 */
export async function requireRateLimit(
    ctx: MutationCtx,
    userId: Id<"users">,
    action: string
): Promise<void> {
    const result = await checkRateLimit(ctx, userId, action);

    if (!result.allowed) {
        const resetIn = Math.ceil((result.resetAt - Date.now()) / 1000 / 60);
        throw new Error(
            `Rate limit exceeded for ${action}. Try again in ${resetIn} minutes.`
        );
    }
}

/**
 * Get current rate limit status for a user and action
 *
 * @param ctx - Mutation context (or query context with db access)
 * @param userId - User ID
 * @param action - Action type
 * @returns Rate limit status
 */
export async function getRateLimitStatus(
    ctx: { db: MutationCtx["db"] },
    userId: Id<"users">,
    action: string
): Promise<{ count: number; maxActions: number; windowStart: number; resetAt: number }> {
    const config = RATE_LIMITS[action] || RATE_LIMITS["default"];

    const existing = await ctx.db
        .query("rate_limits")
        .withIndex("by_user_action", (q) =>
            q.eq("userId", userId).eq("action", action)
        )
        .unique();

    if (!existing) {
        return {
            count: 0,
            maxActions: config.maxActions,
            windowStart: Date.now(),
            resetAt: Date.now() + config.windowMs,
        };
    }

    const now = Date.now();
    const windowExpired = now - existing.windowStart >= config.windowMs;

    if (windowExpired) {
        return {
            count: 0,
            maxActions: config.maxActions,
            windowStart: now,
            resetAt: now + config.windowMs,
        };
    }

    return {
        count: existing.count,
        maxActions: config.maxActions,
        windowStart: existing.windowStart,
        resetAt: existing.windowStart + config.windowMs,
    };
}
