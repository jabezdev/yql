/**
 * Process Access Control Module
 * 
 * Centralized functions for checking process access based on:
 * - Role-based permissions from programs.accessControl
 * - Department scoping
 * - Stage visibility
 */

import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { getViewer } from "../core/auth";

// ============================================
// TYPES
// ============================================

export type ProcessAction = "view" | "start" | "approve" | "comment" | "edit";

export interface AccessMask {
    canView: boolean;
    canStart: boolean;
    canApprove: boolean;
    canComment: boolean;
    canEdit: boolean;
}

export interface AccessControlEntry {
    roleSlug: string;
    departmentScope?: string; // "own" | "all" | specific deptId
    actions: string[];
    stageVisibility?: string[];
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Get department IDs that a user belongs to from their profile positions
 */
function getUserDepartmentIds(user: Doc<"users">): Id<"departments">[] {
    if (!user.profile?.positions) return [];
    return user.profile.positions
        .filter(p => p.departmentId)
        .map(p => p.departmentId!);
}

/**
 * Check if a user can perform a specific action on a process.
 * 
 * @param ctx - Convex context
 * @param user - The user attempting the action
 * @param process - The process being accessed
 * @param action - The action being attempted
 * @returns boolean indicating if action is allowed
 */
export async function canAccessProcess(
    ctx: QueryCtx | MutationCtx,
    user: Doc<"users">,
    process: Doc<"processes">,
    action: ProcessAction
): Promise<boolean> {
    const isOwner = process.userId === user._id;
    const isAdmin = user.systemRole === 'admin';
    const roleSlug = user.systemRole || "guest";

    // Admin always has access
    if (isAdmin) return true;

    // Owner can always view and edit their own
    if (isOwner && (action === "view" || action === "edit")) return true;

    // No program = no additional restrictions
    if (!process.programId) return isOwner;

    const program = await ctx.db.get(process.programId);
    if (!program) return isOwner;

    // Check accessControl
    if (program.accessControl) {
        const roleConfig = program.accessControl.find(
            (ac: AccessControlEntry) => ac.roleSlug === roleSlug
        );

        if (!roleConfig) {
            // No config for this role - fallback to viewConfig or deny
            if (program.viewConfig?.[roleSlug]?.visible === false) {
                return false;
            }
            // If no explicit config, allow only owners
            return isOwner;
        }

        // Check if action is in allowed actions
        if (!roleConfig.actions.includes(action)) {
            return false;
        }

        // Check department scope if applicable
        if (roleConfig.departmentScope && roleConfig.departmentScope !== "all") {
            const userDepartments = getUserDepartmentIds(user);

            if (roleConfig.departmentScope === "own") {
                // Check if process belongs to user's department
                // For now, check if process owner is in same department
                const processOwner = await ctx.db.get(process.userId);
                if (processOwner) {
                    const ownerDepartments = getUserDepartmentIds(processOwner);
                    const hasOverlap = userDepartments.some(d =>
                        ownerDepartments.includes(d)
                    );
                    if (!hasOverlap) return false;
                }
            } else {
                // Specific department ID
                if (!userDepartments.includes(roleConfig.departmentScope as Id<"departments">)) {
                    return false;
                }
            }
        }

        return true;
    }

    // Fallback to legacy viewConfig
    if (program.viewConfig?.[roleSlug]) {
        const roleConfig = program.viewConfig[roleSlug];
        if (roleConfig.visible === false) return false;
        if (roleConfig.actions?.includes(action)) return true;
    }

    // Default: owners can view/edit, others based on clearance
    if (isOwner) return action === "view" || action === "edit";
    // Default: owners can view/edit, others if officer+
    if (isOwner) return action === "view" || action === "edit";
    return ['admin', 'manager', 'lead', 'officer'].includes(roleSlug);
}

/**
 * Get the full access mask for a user on a process.
 * Returns all allowed actions.
 */
export async function getProcessAccessMask(
    ctx: QueryCtx | MutationCtx,
    user: Doc<"users">,
    process: Doc<"processes">
): Promise<AccessMask> {
    const [canView, canStart, canApprove, canComment, canEdit] = await Promise.all([
        canAccessProcess(ctx, user, process, "view"),
        canAccessProcess(ctx, user, process, "start"),
        canAccessProcess(ctx, user, process, "approve"),
        canAccessProcess(ctx, user, process, "comment"),
        canAccessProcess(ctx, user, process, "edit"),
    ]);

    return { canView, canStart, canApprove, canComment, canEdit };
}

/**
 * Check if the current viewer can access a process.
 * Convenience wrapper that fetches the viewer automatically.
 */
export async function requireProcessAccess(
    ctx: QueryCtx | MutationCtx,
    process: Doc<"processes">,
    action: ProcessAction
): Promise<Doc<"users">> {
    const user = await getViewer(ctx);
    if (!user) {
        throw new Error("Unauthorized: Not authenticated");
    }

    const allowed = await canAccessProcess(ctx, user, process, action);
    if (!allowed) {
        throw new Error(`Unauthorized: Cannot ${action} this process`);
    }

    return user;
}

/**
 * Get visible stages for a user on a specific program.
 * Returns stage IDs that the user's role can see.
 */
export async function getVisibleStageIds(
    _ctx: QueryCtx | MutationCtx,
    user: Doc<"users">,
    program: Doc<"programs">
): Promise<string[] | null> {
    const roleSlug = user.systemRole || "guest";
    const isAdmin = user.systemRole === 'admin';

    // Admin sees all stages
    if (isAdmin) return null; // null means "all"

    // Check accessControl for stageVisibility
    if (program.accessControl) {
        const roleConfig = program.accessControl.find(
            (ac: AccessControlEntry) => ac.roleSlug === roleSlug
        );

        if (roleConfig?.stageVisibility) {
            return roleConfig.stageVisibility;
        }
    }

    // Default: all stages visible
    return null;
}
