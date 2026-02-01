/**
 * Centralized Authorization Module
 * 
 * This module provides a unified permission checking system that works
 * with the database-driven roles table. It enforces both resource-level
 * permissions and scope-based access control.
 */

import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { getViewer } from "../auth";

// ============================================
// TYPES
// ============================================

export type Resource =
    | "users"
    | "processes"
    | "programs"
    | "departments"
    | "events"
    | "reviews"
    | "files"
    | "roles";

export type Action = "read" | "create" | "update" | "delete";

export type Scope = "own" | "department" | "all";

export interface AuthorizationResult {
    allowed: boolean;
    user: Doc<"users"> | null;
    reason?: string;
}

export interface PermissionGrant {
    resource: string;
    actions: string[];
    scope?: string;
}

// ============================================
// CORE AUTHORIZATION
// ============================================

/**
 * Main authorization function. Checks if the current user has permission
 * to perform an action on a resource.
 * 
 * @param ctx - Convex context (query or mutation)
 * @param resource - The resource type being accessed
 * @param action - The action being performed
 * @param targetEntityId - Optional ID of the specific entity being accessed
 * @param targetUserId - Optional user ID who owns the target entity (for "own" scope)
 * @param targetDepartmentId - Optional department ID for scope checking
 */
export async function authorize(
    ctx: QueryCtx | MutationCtx,
    resource: Resource,
    action: Action,
    options?: {
        targetEntityId?: Id<any>;
        targetUserId?: Id<"users">;
        targetDepartmentId?: Id<"departments">;
    }
): Promise<AuthorizationResult> {
    const user = await getViewer(ctx);

    if (!user) {
        return { allowed: false, user: null, reason: "Not authenticated" };
    }

    // System admin bypass - clearance level 5 has full access
    if ((user.clearanceLevel ?? 0) >= 5) {
        return { allowed: true, user };
    }

    // Fetch role configuration from database
    const roleSlug = user.systemRole || "guest";
    const roleConfig = await ctx.db
        .query("roles")
        .withIndex("by_slug", (q: { eq: (field: "slug", value: string) => any }) => q.eq("slug", roleSlug))
        .first();

    if (!roleConfig) {
        // Fall back to admin hardcode check for bootstrap
        if (roleSlug === "admin") {
            return { allowed: true, user };
        }
        return { allowed: false, user, reason: `Role '${roleSlug}' not found in database` };
    }

    // Check permissions array
    const permissions = roleConfig.permissions || [];
    const matchingPermission = permissions.find(
        (p: PermissionGrant) => p.resource === resource && p.actions.includes(action)
    );

    if (!matchingPermission) {
        return {
            allowed: false,
            user,
            reason: `Role '${roleSlug}' does not have '${action}' permission on '${resource}'`
        };
    }

    // Enforce scope if specified
    const scope = (matchingPermission.scope || "all") as Scope;

    if (scope === "all") {
        return { allowed: true, user };
    }

    if (scope === "own") {
        // Must be accessing own resource
        if (options?.targetUserId && options.targetUserId !== user._id) {
            return {
                allowed: false,
                user,
                reason: "Access denied: You can only access your own resources"
            };
        }
        return { allowed: true, user };
    }

    if (scope === "department") {
        // Check department membership
        const userDepartmentIds = getUserDepartmentIds(user);

        if (options?.targetDepartmentId) {
            if (!userDepartmentIds.includes(options.targetDepartmentId)) {
                return {
                    allowed: false,
                    user,
                    reason: "Access denied: Resource belongs to a different department"
                };
            }
        }
        // If no specific department check needed, allow (caller should provide context)
        return { allowed: true, user };
    }

    return { allowed: false, user, reason: "Unknown scope type" };
}

/**
 * Convenience function that throws if authorization fails.
 * Use this in mutations/queries where you want to fail fast.
 */
export async function requireAuthorization(
    ctx: QueryCtx | MutationCtx,
    resource: Resource,
    action: Action,
    options?: {
        targetEntityId?: Id<any>;
        targetUserId?: Id<"users">;
        targetDepartmentId?: Id<"departments">;
    }
): Promise<Doc<"users">> {
    const result = await authorize(ctx, resource, action, options);

    if (!result.allowed) {
        throw new Error(`Unauthorized: ${result.reason}`);
    }

    return result.user!;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract department IDs from user's profile positions
 */
function getUserDepartmentIds(user: Doc<"users">): Id<"departments">[] {
    if (!user.profile?.positions) return [];

    return user.profile.positions
        .filter((p: { departmentId?: Id<"departments"> }) => p.departmentId)
        .map((p: { departmentId?: Id<"departments"> }) => p.departmentId!);
}

/**
 * Check if user has access to a specific department.
 */
export async function hasAccessToDepartment(
    ctx: QueryCtx | MutationCtx,
    departmentId: Id<"departments">
): Promise<boolean> {
    const user = await getViewer(ctx);
    if (!user) return false;

    // Admin has access to all departments
    if ((user.clearanceLevel ?? 0) >= 4) return true;

    // Check if user belongs to this department
    const userDepartmentIds = getUserDepartmentIds(user);
    return userDepartmentIds.includes(departmentId);
}

/**
 * Check if user can access their own resources only
 */
export async function isOwnerOrAdmin(
    ctx: QueryCtx | MutationCtx,
    ownerId: Id<"users">
): Promise<{ allowed: boolean; user: Doc<"users"> | null }> {
    const user = await getViewer(ctx);
    if (!user) return { allowed: false, user: null };

    const isOwner = user._id === ownerId;
    const isAdmin = (user.clearanceLevel ?? 0) >= 4;

    return { allowed: isOwner || isAdmin, user };
}

/**
 * Quick clearance level check
 */
export async function hasMinimumClearance(
    ctx: QueryCtx | MutationCtx,
    minLevel: number
): Promise<boolean> {
    const user = await getViewer(ctx);
    if (!user) return false;
    return (user.clearanceLevel ?? 0) >= minLevel;
}

// ============================================
// CLEARANCE LEVEL CONSTANTS
// ============================================

export const CLEARANCE = {
    GUEST: 0,
    PROBATION: 1,
    MEMBER: 2,
    OFFICER: 3,
    ADMIN: 4,
    SYSTEM_OWNER: 5,
} as const;
