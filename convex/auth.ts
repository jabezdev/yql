
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
 * Ensures user has Admin access.
 * Checks for 'system.manage_configuration' permission or 'admin' role slug.
 */
export async function ensureAdmin(ctx: QueryCtx | MutationCtx) {
    const user = await getViewer(ctx);
    if (!user) {
        throw new Error("Unauthenticated");
    }

    if (user.systemRole === 'admin') return user;

    // Fallback: Check specific permission if not explicitly admin slug
    // We need to fetch the role to check permissions
    if (user.systemRole) {
        const role = await ctx.db
            .query("roles")
            .withIndex("by_slug", q => q.eq("slug", user.systemRole!))
            .first();

        if (role && role.uiPermissions.includes("system.manage_configuration")) {
            return user;
        }
    }

    throw new Error("Forbidden: Admin access required");
}

/**
 * Ensures user has Staff/Officer access.
 * Checks for 'dashboard.view_member_portal' which implies basic staff/member access.
 */
export async function ensureReviewer(ctx: QueryCtx | MutationCtx) {
    const user = await getViewer(ctx);
    if (!user) {
        throw new Error("Unauthenticated");
    }

    // Admins always have access
    if (user.systemRole === 'admin') return user;

    if (user.systemRole) {
        const role = await ctx.db
            .query("roles")
            .withIndex("by_slug", q => q.eq("slug", user.systemRole!))
            .first();

        // Check for basic staff permission (e.g. viewing programs or member portal)
        // Adjust this permission based on what defines a "Reviewer/Officer" in your system
        if (role && (
            role.uiPermissions.includes("dashboard.view_programs") ||
            role.uiPermissions.includes("dashboard.view_member_portal")
        )) {
            return user;
        }
    }

    throw new Error("Forbidden: Staff access required");
}

// Deprecated/No-op functions for compatibility if necessary, or just remove.
// Removed hashPassword, verifyPassword, createSession
