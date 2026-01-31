
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

    // 2. Fallback: Check by email (For invitations/migrations)
    // Note: Clerk provides verified emails. We trust them.
    if (identity.email) {
        const userByEmail = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        // If found, this user was pre-created (e.g. by admin) or from legacy system.
        // We should ideally return it. The 'store' mutation will link it later.
        return userByEmail;
    }

    return null;
}

export async function ensureAdmin(ctx: QueryCtx | MutationCtx) {
    const user = await getViewer(ctx);
    if (!user || user.role !== "admin") {
        throw new Error("Forbidden: Admin access only");
    }
    return user;
}

export async function ensureReviewer(ctx: QueryCtx | MutationCtx) {
    const user = await getViewer(ctx);
    if (!user || (user.role !== "admin" && user.role !== "reviewer")) {
        throw new Error("Forbidden: Reviewer access only");
    }
    return user;
}

// Deprecated/No-op functions for compatibility if necessary, or just remove.
// Removed hashPassword, verifyPassword, createSession
