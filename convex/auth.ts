
import type { QueryCtx, MutationCtx } from "./_generated/server";

export async function getViewer(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        return null;
    }

    // 1. Check by tokenIdentifier (Exact match)
    const user = await ctx.db
        .query("users")
        .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .first();

    if (user) return user;

    // Check by email (migration/linking)
    if (identity.email) {
        const userByEmail = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();
        return userByEmail;
    }

    return null;
}

/**
 * Ensures user has Admin access (Tier 4+).
 */
export async function ensureAdmin(ctx: QueryCtx | MutationCtx) {
    const user = await getViewer(ctx);

    // New Schema Check
    if (!user || (user.clearanceLevel ?? 0) < 4) {
        throw new Error("Forbidden: Admin access only (Tier 4+)");
    }
    return user;
}

/**
 * Ensures user has Reviewer/Officer access (Tier 3+).
 */
export async function ensureReviewer(ctx: QueryCtx | MutationCtx) {
    const user = await getViewer(ctx);

    // New Schema Check
    if (!user || (user.clearanceLevel ?? 0) < 3) {
        throw new Error("Forbidden: Officer access only (Tier 3+)");
    }
    return user;
}

// Deprecated/No-op functions for compatibility if necessary, or just remove.
// Removed hashPassword, verifyPassword, createSession
