
import type { QueryCtx, MutationCtx } from "../_generated/server";
import { isAdmin, isStaffRole } from "./constants";

// ============================================
// CORE AUTH
// ============================================

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

/** Ensures user has Admin access. */
export async function ensureAdmin(ctx: QueryCtx | MutationCtx) {
    const user = await getViewer(ctx);
    if (!user) {
        throw new Error("Unauthenticated");
    }

    if (isAdmin(user.systemRole)) return user;

    if (user.systemRole) {
        // For now, strict check:
        return isAdmin(user.systemRole) ? user : null;
    }

    throw new Error("Forbidden: Admin access required");
}

/** Ensures user has Staff/Officer access. */
export async function ensureReviewer(ctx: QueryCtx | MutationCtx) {
    const user = await getViewer(ctx);
    if (!user) {
        throw new Error("Unauthenticated");
    }

    // Admins always have access
    if (isAdmin(user.systemRole)) return user;

    if (user.systemRole) {
        // Staff/Reviewer access = Manager or above
        if (isStaffRole(user.systemRole)) {
            return user;
        }
    }

    throw new Error("Forbidden: Staff access required");
}


