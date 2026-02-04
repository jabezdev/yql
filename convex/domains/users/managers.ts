import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { getViewer, ensureAdmin } from "../../core/auth";
import { createAuditLog } from "../../core/auditLog";
import type { Id } from "../../_generated/dataModel";

// ============================================
// CONSTANTS
// ============================================

export const MANAGER_CONTEXTS = [
    "direct",       // Primary reporting line
    "project",      // Project-based reporting
    "dotted_line",  // Secondary/advisory relationship
    "loa_approver", // Approves leave of absence requests
] as const;

export type ManagerContext = typeof MANAGER_CONTEXTS[number];

// ============================================
// QUERIES
// ============================================

/**
 * Get all managers for a user (optionally filtered by context)
 */
export const getManagers = query({
    args: {
        userId: v.id("users"),
        context: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        // Users can see their own managers; officers+ can see anyone's
        const canView = viewer._id === args.userId || ['admin', 'manager', 'lead', 'officer'].includes(viewer.systemRole || "");
        if (!canView) throw new Error("Unauthorized");

        let assignments = await ctx.db
            .query("manager_assignments")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) => q.neq(q.field("isDeleted"), true))
            .collect();

        if (args.context) {
            assignments = assignments.filter((a) => a.context === args.context);
        }

        // Enrich with manager info
        const enriched = await Promise.all(
            assignments.map(async (a) => {
                const manager = await ctx.db.get(a.managerId);
                return {
                    ...a,
                    managerName: manager?.name ?? "Unknown",
                    managerEmail: manager?.email ?? "",
                };
            })
        );

        return enriched;
    },
});

/**
 * Get direct reports for a manager (optionally filtered by context)
 */
export const getDirectReports = query({
    args: {
        managerId: v.optional(v.id("users")), // If not provided, uses current user
        context: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        const managerId = args.managerId ?? viewer._id;

        // Users can see their own reports; officers+ can see anyone's
        const canView = viewer._id === managerId || ['admin', 'manager', 'lead', 'officer'].includes(viewer.systemRole || "");
        if (!canView) throw new Error("Unauthorized");

        let assignments = await ctx.db
            .query("manager_assignments")
            .withIndex("by_manager", (q) => q.eq("managerId", managerId))
            .filter((q) => q.neq(q.field("isDeleted"), true))
            .collect();

        if (args.context) {
            assignments = assignments.filter((a) => a.context === args.context);
        }

        // Enrich with user info
        const enriched = await Promise.all(
            assignments.map(async (a) => {
                const user = await ctx.db.get(a.userId);
                return {
                    ...a,
                    userName: user?.name ?? "Unknown",
                    userEmail: user?.email ?? "",
                    userStatus: user?.profile?.status ?? "unknown",
                };
            })
        );

        return enriched;
    },
});

/**
 * Get LOA approvers for a user
 */
export const getLOAApprovers = query({
    args: { userId: v.optional(v.id("users")) },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        const userId = args.userId ?? viewer._id;

        // Get LOA approvers first, fallback to direct managers
        let approvers = await ctx.db
            .query("manager_assignments")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("context"), "loa_approver"),
                    q.neq(q.field("isDeleted"), true)
                )
            )
            .collect();

        if (approvers.length === 0) {
            // Fallback to primary direct manager
            approvers = await ctx.db
                .query("manager_assignments")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .filter((q) =>
                    q.and(
                        q.eq(q.field("context"), "direct"),
                        q.eq(q.field("isPrimary"), true),
                        q.neq(q.field("isDeleted"), true)
                    )
                )
                .collect();
        }

        // Enrich with manager info
        return await Promise.all(
            approvers.map(async (a) => {
                const manager = await ctx.db.get(a.managerId);
                return {
                    ...a,
                    managerName: manager?.name ?? "Unknown",
                    managerEmail: manager?.email ?? "",
                };
            })
        );
    },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Assign a manager to a user (Admin/Officer only)
 */
export const assignManager = mutation({
    args: {
        userId: v.id("users"),
        managerId: v.id("users"),
        context: v.string(),
        departmentId: v.optional(v.id("departments")),
        isPrimary: v.optional(v.boolean()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        // Validate users exist
        const user = await ctx.db.get(args.userId);
        const manager = await ctx.db.get(args.managerId);
        if (!user || user.isDeleted) throw new Error("User not found");
        if (!manager || manager.isDeleted) throw new Error("Manager not found");

        // Validate context
        if (!MANAGER_CONTEXTS.includes(args.context as ManagerContext)) {
            throw new Error(`Invalid context. Must be one of: ${MANAGER_CONTEXTS.join(", ")}`);
        }

        // Prevent self-assignment
        if (args.userId === args.managerId) {
            throw new Error("Cannot assign user as their own manager");
        }

        // Check for existing assignment in same context
        const existing = await ctx.db
            .query("manager_assignments")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("managerId"), args.managerId),
                    q.eq(q.field("context"), args.context),
                    q.neq(q.field("isDeleted"), true)
                )
            )
            .first();

        if (existing) {
            throw new Error("This manager assignment already exists");
        }

        // If marking as primary, unset other primaries in same context
        if (args.isPrimary) {
            const otherPrimaries = await ctx.db
                .query("manager_assignments")
                .withIndex("by_user", (q) => q.eq("userId", args.userId))
                .filter((q) =>
                    q.and(
                        q.eq(q.field("context"), args.context),
                        q.eq(q.field("isPrimary"), true),
                        q.neq(q.field("isDeleted"), true)
                    )
                )
                .collect();

            for (const other of otherPrimaries) {
                await ctx.db.patch(other._id, { isPrimary: false });
            }
        }

        const assignmentId = await ctx.db.insert("manager_assignments", {
            userId: args.userId,
            managerId: args.managerId,
            context: args.context,
            departmentId: args.departmentId,
            isPrimary: args.isPrimary ?? false,
            startDate: args.startDate,
            endDate: args.endDate,
        });

        // Audit log
        await createAuditLog(ctx, {
            userId: admin._id,
            action: "manager.assign",
            entityType: "manager_assignments",
            entityId: assignmentId,
            changes: {
                after: {
                    userId: args.userId,
                    managerId: args.managerId,
                    context: args.context,
                },
            },
        });

        return assignmentId;
    },
});

/**
 * Update a manager assignment
 */
export const updateAssignment = mutation({
    args: {
        assignmentId: v.id("manager_assignments"),
        isPrimary: v.optional(v.boolean()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        const assignment = await ctx.db.get(args.assignmentId);
        if (!assignment || assignment.isDeleted) {
            throw new Error("Assignment not found");
        }

        const updates: Record<string, unknown> = {};

        if (args.isPrimary !== undefined) {
            // If marking as primary, unset others
            if (args.isPrimary) {
                const otherPrimaries = await ctx.db
                    .query("manager_assignments")
                    .withIndex("by_user", (q) => q.eq("userId", assignment.userId))
                    .filter((q) =>
                        q.and(
                            q.eq(q.field("context"), assignment.context),
                            q.eq(q.field("isPrimary"), true),
                            q.neq(q.field("_id"), args.assignmentId),
                            q.neq(q.field("isDeleted"), true)
                        )
                    )
                    .collect();

                for (const other of otherPrimaries) {
                    await ctx.db.patch(other._id, { isPrimary: false });
                }
            }
            updates.isPrimary = args.isPrimary;
        }

        if (args.endDate !== undefined) {
            updates.endDate = args.endDate;
        }

        await ctx.db.patch(args.assignmentId, updates);

        // Audit log
        await createAuditLog(ctx, {
            userId: admin._id,
            action: "manager.update",
            entityType: "manager_assignments",
            entityId: args.assignmentId,
            changes: { before: assignment, after: updates },
        });
    },
});

/**
 * Remove a manager assignment (soft delete)
 */
export const removeAssignment = mutation({
    args: { assignmentId: v.id("manager_assignments") },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        const assignment = await ctx.db.get(args.assignmentId);
        if (!assignment || assignment.isDeleted) {
            throw new Error("Assignment not found");
        }

        await ctx.db.patch(args.assignmentId, {
            isDeleted: true,
            deletedAt: Date.now(),
        });

        // Audit log
        await createAuditLog(ctx, {
            userId: admin._id,
            action: "manager.remove",
            entityType: "manager_assignments",
            entityId: args.assignmentId,
            changes: { before: assignment },
        });
    },
});

/**
 * Bulk assign managers (for initial setup or department restructuring)
 */
export const bulkAssignManagers = mutation({
    args: {
        assignments: v.array(v.object({
            userId: v.id("users"),
            managerId: v.id("users"),
            context: v.string(),
            isPrimary: v.optional(v.boolean()),
        })),
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        const results: { userId: Id<"users">; managerId: Id<"users">; success: boolean; error?: string }[] = [];

        for (const assignment of args.assignments) {
            try {
                // Skip self-assignments
                if (assignment.userId === assignment.managerId) {
                    results.push({
                        userId: assignment.userId,
                        managerId: assignment.managerId,
                        success: false,
                        error: "Self-assignment not allowed",
                    });
                    continue;
                }

                // Check if already exists
                const existing = await ctx.db
                    .query("manager_assignments")
                    .withIndex("by_user", (q) => q.eq("userId", assignment.userId))
                    .filter((q) =>
                        q.and(
                            q.eq(q.field("managerId"), assignment.managerId),
                            q.eq(q.field("context"), assignment.context),
                            q.neq(q.field("isDeleted"), true)
                        )
                    )
                    .first();

                if (existing) {
                    results.push({
                        userId: assignment.userId,
                        managerId: assignment.managerId,
                        success: false,
                        error: "Already exists",
                    });
                    continue;
                }

                await ctx.db.insert("manager_assignments", {
                    userId: assignment.userId,
                    managerId: assignment.managerId,
                    context: assignment.context,
                    isPrimary: assignment.isPrimary ?? false,
                });

                results.push({
                    userId: assignment.userId,
                    managerId: assignment.managerId,
                    success: true,
                });
            } catch (e) {
                results.push({
                    userId: assignment.userId,
                    managerId: assignment.managerId,
                    success: false,
                    error: e instanceof Error ? e.message : "Unknown error",
                });
            }
        }

        // Audit log for bulk operation
        await createAuditLog(ctx, {
            userId: admin._id,
            action: "manager.bulk_assign",
            entityType: "manager_assignments",
            entityId: "bulk",
            metadata: {
                total: args.assignments.length,
                successful: results.filter((r) => r.success).length,
            },
        });

        return results;
    },
});
