import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { ensureAdmin, getViewer } from "./auth";
import { createAuditLog } from "./auditLog";
import { isStaffRole } from "./accessControl";

/**
 * Assign a manager to a user (Manual Matrix Management)
 */
export const assignManager = mutation({
    args: {
        userId: v.id("users"),
        managerId: v.id("users"),
        context: v.string(), // "direct", "project", "dotted_line"
        departmentId: v.optional(v.id("departments")),
        isPrimary: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);
        if (!admin) throw new Error("Unauthorized");

        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const manager = await ctx.db.get(args.managerId);
        if (!manager) throw new Error("Manager not found");

        // Check for existing assignment in this context
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
            // Update if needed, or just return
            if (existing.isPrimary !== args.isPrimary || existing.departmentId !== args.departmentId) {
                await ctx.db.patch(existing._id, {
                    isPrimary: args.isPrimary ?? existing.isPrimary,
                    departmentId: args.departmentId ?? existing.departmentId,
                });
            }
            return existing._id;
        }

        const assignmentId = await ctx.db.insert("manager_assignments", {
            userId: args.userId,
            managerId: args.managerId,
            context: args.context,
            departmentId: args.departmentId,
            isPrimary: args.isPrimary ?? false,
            startDate: Date.now(),
        });

        await createAuditLog(ctx, {
            userId: admin._id,
            action: "matrix.assign_manager",
            entityType: "manager_assignments",
            entityId: assignmentId,
            changes: { after: args },
            metadata: { managerName: manager.name, userName: user.name }
        });

        return assignmentId;
    },
});

/**
 * Remove a manager assignment
 */
export const removeManager = mutation({
    args: {
        assignmentId: v.id("manager_assignments"),
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);
        if (!admin) throw new Error("Unauthorized");

        const assignment = await ctx.db.get(args.assignmentId);
        if (!assignment) throw new Error("Assignment not found");

        await ctx.db.patch(args.assignmentId, {
            isDeleted: true,
            deletedAt: Date.now(),
        });

        await createAuditLog(ctx, {
            userId: admin._id,
            action: "matrix.remove_manager",
            entityType: "manager_assignments",
            entityId: args.assignmentId,
            changes: { before: assignment },
        });
    },
});

/**
 * Get manager for a user (Admin/Manager view)
 */
export const getUserManagers = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");
        // Allow user to see their own, or staff to see others
        const canView = viewer._id === args.userId || isStaffRole(viewer.systemRole);
        if (!canView) throw new Error("Unauthorized");

        const assignments = await ctx.db
            .query("manager_assignments")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) => q.neq(q.field("isDeleted"), true))
            .collect();

        const enriched = await Promise.all(assignments.map(async (a) => {
            const manager = await ctx.db.get(a.managerId);
            return {
                ...a,
                managerName: manager?.name,
                managerEmail: manager?.email,
            };
        }));

        return enriched;
    },
});

/**
 * Get my team (Direct Reports)
 */
export const getMyTeam = query({
    args: {},
    handler: async (ctx) => {
        const viewer = await getViewer(ctx);
        if (!viewer) return [];

        const assignments = await ctx.db
            .query("manager_assignments")
            .withIndex("by_manager", (q) => q.eq("managerId", viewer._id))
            .filter((q) => q.neq(q.field("isDeleted"), true))
            .collect();

        const enriched = await Promise.all(assignments.map(async (a) => {
            const user = await ctx.db.get(a.userId);
            return {
                ...a,
                userName: user?.name,
                userEmail: user?.email,
                userStatus: user?.profile?.status,
            };
        }));

        return enriched;
    },
});
