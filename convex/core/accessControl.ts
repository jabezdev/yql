/**
 * Unified Access Control Service
 * 
 * Centralized access control for the entire application.
 * Consolidates HR_STATUS, SYSTEM_ROLES, and special_roles checks.
 * 
 * Use this instead of scattered inline role checks.
 */

import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { getViewer } from "./auth";
import {
    HR_STATUSES,
    SYSTEM_ROLES,
    hasMinimumRole,
    isBlockedStatus,
    isStaffRole,
    getRoleLevel,
    type SystemRole,
    type HRStatus,
} from "./constants";

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
    | "roles"
    | "dashboards"
    | "stages"
    | "blocks"
    | "audit_logs"
    | "notifications";

export type Action = "read" | "create" | "update" | "delete" | "approve" | "start";

export type Scope = "own" | "department" | "all";

export interface AccessCheckResult {
    allowed: boolean;
    user: Doc<"users"> | null;
    reason?: string;
}

export interface AccessCheckOptions {
    resource?: Resource;
    action?: Action;
    scope?: Scope;
    targetUserId?: Id<"users">;
    targetDepartmentId?: Id<"departments">;
    minimumRole?: SystemRole;
    allowedRoles?: SystemRole[];
    requireActive?: boolean; // Require HR_STATUS = active
}

// ============================================
// PERMISSION DEFINITIONS
// ============================================

/**
 * Default permissions per system role.
 * These are the baseline permissions; resource-specific config (like program.accessControl) can override.
 */
export const DEFAULT_PERMISSIONS: Record<SystemRole, { resource: Resource; actions: Action[]; scope: Scope }[]> = {
    guest: [],
    member: [
        { resource: "files", actions: ["read", "create"], scope: "own" },
        { resource: "processes", actions: ["read", "create", "update"], scope: "own" },
        { resource: "users", actions: ["read"], scope: "own" },
    ],
    manager: [
        { resource: "files", actions: ["read", "create"], scope: "own" },
        { resource: "processes", actions: ["read", "update", "approve"], scope: "department" },
        { resource: "users", actions: ["read"], scope: "department" },
        { resource: "reviews", actions: ["read", "create"], scope: "department" },
    ],
    lead: [
        { resource: "files", actions: ["read", "create"], scope: "all" },
        { resource: "processes", actions: ["read", "update", "approve"], scope: "department" },
        { resource: "users", actions: ["read", "update"], scope: "department" },
        { resource: "reviews", actions: ["read", "create", "update"], scope: "department" },
        { resource: "programs", actions: ["read"], scope: "all" },
    ],
    admin: [], // Admin bypasses all checks
};

// ============================================
// CORE ACCESS CHECKS
// ============================================

/**
 * Pre-flight check: Is this user allowed to access the system at all?
 * Checks HR_STATUS for blocked users.
 */
export async function checkUserStatus(
    ctx: QueryCtx | MutationCtx
): Promise<AccessCheckResult> {
    const user = await getViewer(ctx);

    if (!user) {
        return { allowed: false, user: null, reason: "Not authenticated" };
    }

    // Check if user is blocked
    const hrStatus = user.profile?.status;
    if (isBlockedStatus(hrStatus)) {
        return {
            allowed: false,
            user,
            reason: "Access denied: Your account has been blocked"
        };
    }

    return { allowed: true, user };
}

/**
 * Main access check function.
 * Checks authentication, HR status, role level, and resource permissions.
 */
export async function checkAccess(
    ctx: QueryCtx | MutationCtx,
    options: AccessCheckOptions = {}
): Promise<AccessCheckResult> {
    // 1. Pre-flight: auth and status check
    const statusCheck = await checkUserStatus(ctx);
    if (!statusCheck.allowed) {
        return statusCheck;
    }
    const user = statusCheck.user!;

    // 2. Check HR status if active is required
    if (options.requireActive) {
        const hrStatus = user.profile?.status;
        if (hrStatus !== HR_STATUSES.ACTIVE) {
            return {
                allowed: false,
                user,
                reason: `Access denied: Requires active status (current: ${hrStatus || 'unknown'})`
            };
        }
    }

    const roleSlug = user.systemRole || SYSTEM_ROLES.GUEST;

    // 3. Admin bypass
    if (roleSlug === SYSTEM_ROLES.ADMIN) {
        return { allowed: true, user };
    }

    // 4. Check minimum role (hierarchy-based)
    if (options.minimumRole) {
        if (!hasMinimumRole(roleSlug, options.minimumRole)) {
            return {
                allowed: false,
                user,
                reason: `Access denied: Requires at least ${options.minimumRole} role`
            };
        }
    }

    // 5. Check allowed roles (exact match, any of)
    if (options.allowedRoles && options.allowedRoles.length > 0) {
        if (!options.allowedRoles.includes(roleSlug as SystemRole)) {
            return {
                allowed: false,
                user,
                reason: `Access denied: Role ${roleSlug} not in allowed list`
            };
        }
    }

    // 6. Check resource-level permissions
    if (options.resource && options.action) {
        const permissions = DEFAULT_PERMISSIONS[roleSlug as SystemRole] || [];
        const matchingPerm = permissions.find(
            p => p.resource === options.resource && p.actions.includes(options.action!)
        );

        if (!matchingPerm) {
            return {
                allowed: false,
                user,
                reason: `Role '${roleSlug}' cannot '${options.action}' on '${options.resource}'`
            };
        }

        // Check scope
        const scope = matchingPerm.scope;
        if (scope === "own" && options.targetUserId && options.targetUserId !== user._id) {
            return {
                allowed: false,
                user,
                reason: "Access denied: Can only access your own resources"
            };
        }

        if (scope === "department" && options.targetDepartmentId) {
            const userDepts = getUserDepartmentIds(user);
            if (!userDepts.includes(options.targetDepartmentId)) {
                return {
                    allowed: false,
                    user,
                    reason: "Access denied: Resource belongs to a different department"
                };
            }
        }
    }

    return { allowed: true, user };
}

/**
 * Convenience wrapper that throws if access is denied.
 */
export async function requireAccess(
    ctx: QueryCtx | MutationCtx,
    options: AccessCheckOptions = {}
): Promise<Doc<"users">> {
    const result = await checkAccess(ctx, options);

    if (!result.allowed) {
        throw new Error(`Unauthorized: ${result.reason}`);
    }

    return result.user!;
}

/**
 * Quick check for staff-level access (manager+).
 */
export async function requireStaffAccess(
    ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
    return requireAccess(ctx, { minimumRole: SYSTEM_ROLES.MANAGER });
}

/**
 * Quick check for admin access.
 */
export async function requireAdminAccess(
    ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
    return requireAccess(ctx, { minimumRole: SYSTEM_ROLES.ADMIN });
}

// ============================================
// SPECIAL ROLES
// ============================================

/**
 * Check if a user has a specific special role.
 */
export async function hasSpecialRole(
    ctx: QueryCtx | MutationCtx,
    user: Doc<"users">,
    roleSlug: string
): Promise<boolean> {
    if (!user.specialRoleIds || user.specialRoleIds.length === 0) {
        return false;
    }

    const roles = await Promise.all(
        user.specialRoleIds.map(id => ctx.db.get(id))
    );

    return roles.some(role => role?.slug === roleSlug);
}

/**
 * Get all special role slugs for a user.
 */
export async function getUserSpecialRoles(
    ctx: QueryCtx | MutationCtx,
    user: Doc<"users">
): Promise<string[]> {
    if (!user.specialRoleIds || user.specialRoleIds.length === 0) {
        return [];
    }

    const roles = await Promise.all(
        user.specialRoleIds.map(id => ctx.db.get(id))
    );

    return roles
        .filter((role): role is NonNullable<typeof role> => role !== null)
        .map(role => role.slug);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract department IDs from user's profile positions.
 */
export function getUserDepartmentIds(user: Doc<"users">): Id<"departments">[] {
    if (!user.profile?.positions) return [];

    return user.profile.positions
        .filter((p) => p.departmentId)
        .map((p) => p.departmentId!);
}

/**
 * Check if user belongs to a specific department.
 */
export function isInDepartment(user: Doc<"users">, departmentId: Id<"departments">): boolean {
    return getUserDepartmentIds(user).includes(departmentId);
}

/**
 * Get user's HR status.
 */
export function getUserHRStatus(user: Doc<"users">): HRStatus {
    return (user.profile?.status as HRStatus) || HR_STATUSES.CANDIDATE;
}

/**
 * Check if user is the owner of a resource.
 */
export function isResourceOwner(user: Doc<"users">, ownerId: Id<"users">): boolean {
    return user._id === ownerId;
}

// Re-export commonly used functions from constants for convenience
export { hasMinimumRole, isBlockedStatus, isStaffRole, getRoleLevel };
