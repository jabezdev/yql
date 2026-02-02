import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getViewer, ensureAdmin, ensureReviewer } from "./auth";
import { createAuditLog } from "./auditLog";

// ============================================
// CONSTANTS
// ============================================

export const GOAL_STATUSES = [
    "in_progress",
    "completed",
    "cancelled",
] as const;

export type GoalStatus = typeof GOAL_STATUSES[number];

// ============================================
// QUERIES
// ============================================

/**
 * Get my goals (optionally filtered by cycle)
 */
export const getMyGoals = query({
    args: {
        cycleId: v.optional(v.id("review_cycles")),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        let goals = await ctx.db
            .query("goals")
            .withIndex("by_user", (q) => q.eq("userId", viewer._id))
            .filter((q) => q.neq(q.field("isDeleted"), true))
            .collect();

        if (args.cycleId) {
            goals = goals.filter((g) => g.cycleId === args.cycleId);
        }

        if (args.status) {
            goals = goals.filter((g) => g.status === args.status);
        }

        // Sort by due date (nulls last)
        goals.sort((a, b) => {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate - b.dueDate;
        });

        return goals;
    },
});

/**
 * Get a user's goals (for managers viewing direct reports)
 */
export const getUserGoals = query({
    args: {
        userId: v.id("users"),
        cycleId: v.optional(v.id("review_cycles")),
    },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        // Can view own goals or if manager/officer
        const isOwn = viewer._id === args.userId;
        const isOfficer = ['admin', 'manager', 'lead', 'officer'].includes(viewer.systemRole || "");

        // Check if viewer is manager of this user
        let isManager = false;
        if (!isOwn && !isOfficer) {
            const assignment = await ctx.db
                .query("manager_assignments")
                .withIndex("by_manager", (q) => q.eq("managerId", viewer._id))
                .filter((q) =>
                    q.and(
                        q.eq(q.field("userId"), args.userId),
                        q.neq(q.field("isDeleted"), true)
                    )
                )
                .first();
            isManager = !!assignment;
        }

        if (!isOwn && !isOfficer && !isManager) {
            throw new Error("Unauthorized to view this user's goals");
        }

        let goals = await ctx.db
            .query("goals")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) => q.neq(q.field("isDeleted"), true))
            .collect();

        if (args.cycleId) {
            goals = goals.filter((g) => g.cycleId === args.cycleId);
        }

        return goals;
    },
});

/**
 * Get team goals (for managers)
 */
export const getTeamGoals = query({
    args: { cycleId: v.optional(v.id("review_cycles")) },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        // Get direct reports
        const directReports = await ctx.db
            .query("manager_assignments")
            .withIndex("by_manager", (q) => q.eq("managerId", viewer._id))
            .filter((q) =>
                q.and(
                    q.eq(q.field("context"), "direct"),
                    q.neq(q.field("isDeleted"), true)
                )
            )
            .collect();

        const reportIds = directReports.map((r) => r.userId);

        if (reportIds.length === 0) {
            return [];
        }

        // Get goals for all direct reports
        const teamGoals = await Promise.all(
            reportIds.map(async (userId) => {
                const user = await ctx.db.get(userId);

                let goals = await ctx.db
                    .query("goals")
                    .withIndex("by_user", (q) => q.eq("userId", userId))
                    .filter((q) => q.neq(q.field("isDeleted"), true))
                    .collect();

                if (args.cycleId) {
                    goals = goals.filter((g) => g.cycleId === args.cycleId);
                }

                return {
                    userId,
                    userName: user?.name ?? "Unknown",
                    goals,
                    summary: {
                        total: goals.length,
                        completed: goals.filter((g) => g.status === "completed").length,
                        inProgress: goals.filter((g) => g.status === "in_progress").length,
                        averageProgress: goals.length > 0
                            ? Math.round(goals.reduce((sum, g) => sum + (g.progress ?? 0), 0) / goals.length)
                            : 0,
                    },
                };
            })
        );

        return teamGoals;
    },
});

/**
 * Get goal statistics for a cycle (admin view)
 */
export const getCycleGoalStats = query({
    args: { cycleId: v.id("review_cycles") },
    handler: async (ctx, args) => {
        await ensureReviewer(ctx);
        await getViewer(ctx);

        const goals = await ctx.db
            .query("goals")
            .withIndex("by_cycle", (q) => q.eq("cycleId", args.cycleId))
            .filter((q) => q.neq(q.field("isDeleted"), true))
            .collect();

        const statusCounts: Record<string, number> = {
            in_progress: 0,
            completed: 0,
            cancelled: 0,
        };

        for (const goal of goals) {
            statusCounts[goal.status] = (statusCounts[goal.status] || 0) + 1;
        }

        const usersWithGoals = new Set(goals.map((g) => g.userId));

        return {
            totalGoals: goals.length,
            byStatus: statusCounts,
            usersWithGoals: usersWithGoals.size,
            averageProgress: goals.length > 0
                ? Math.round(goals.reduce((sum, g) => sum + (g.progress ?? 0), 0) / goals.length)
                : 0,
        };
    },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new goal
 */
export const createGoal = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        cycleId: v.optional(v.id("review_cycles")),
        dueDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        // Require at least member level
        if (viewer.systemRole === 'guest' || viewer.systemRole === 'candidate') {
            throw new Error("Member status required to create goals");
        }

        const now = Date.now();

        const goalId = await ctx.db.insert("goals", {
            userId: viewer._id,
            cycleId: args.cycleId,
            title: args.title,
            description: args.description,
            status: "in_progress",
            progress: 0,
            dueDate: args.dueDate,
            createdAt: now,
            updatedAt: now,
        });

        await createAuditLog(ctx, {
            userId: viewer._id,
            action: "goal.create",
            entityType: "goals",
            entityId: goalId,
            changes: { after: args },
        });

        return goalId;
    },
});

/**
 * Update a goal
 */
export const updateGoal = mutation({
    args: {
        goalId: v.id("goals"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        status: v.optional(v.string()),
        progress: v.optional(v.number()),
        dueDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        const goal = await ctx.db.get(args.goalId);
        if (!goal || goal.isDeleted) throw new Error("Goal not found");

        // Check if viewer is manager of this user
        let isManager = false;
        if (goal.userId !== viewer._id && viewer.systemRole !== 'admin') {
            const assignment = await ctx.db
                .query("manager_assignments")
                .withIndex("by_manager", (q) => q.eq("managerId", viewer._id))
                .filter((q) =>
                    q.and(
                        q.eq(q.field("userId"), goal.userId),
                        q.neq(q.field("isDeleted"), true)
                    )
                )
                .first();

            const now = Date.now();
            isManager = !!assignment &&
                (!assignment.startDate || assignment.startDate <= now) &&
                (!assignment.endDate || assignment.endDate >= now);

            if (!isManager) {
                throw new Error("Unauthorized to update this goal");
            }
        }

        // Validate status
        if (args.status && !GOAL_STATUSES.includes(args.status as GoalStatus)) {
            throw new Error(`Invalid status. Must be: ${GOAL_STATUSES.join(", ")}`);
        }

        // Validate progress
        if (args.progress !== undefined && (args.progress < 0 || args.progress > 100)) {
            throw new Error("Progress must be between 0 and 100");
        }

        const { goalId, ...updates } = args;
        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([, v]) => v !== undefined)
        );

        await ctx.db.patch(args.goalId, {
            ...filteredUpdates,
            updatedAt: Date.now(),
        });

        await createAuditLog(ctx, {
            userId: viewer._id,
            action: "goal.update",
            entityType: "goals",
            entityId: args.goalId,
            changes: { before: goal, after: filteredUpdates },
        });
    },
});

/**
 * Mark goal as completed
 */
export const completeGoal = mutation({
    args: { goalId: v.id("goals") },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        const goal = await ctx.db.get(args.goalId);
        if (!goal || goal.isDeleted) throw new Error("Goal not found");

        if (goal.userId !== viewer._id && viewer.systemRole !== 'admin') {
            const assignment = await ctx.db
                .query("manager_assignments")
                .withIndex("by_manager", (q) => q.eq("managerId", viewer._id))
                .filter((q) =>
                    q.and(
                        q.eq(q.field("userId"), goal.userId),
                        q.neq(q.field("isDeleted"), true)
                    )
                )
                .first();

            const now = Date.now();
            const isValid = !!assignment &&
                (!assignment.startDate || assignment.startDate <= now) &&
                (!assignment.endDate || assignment.endDate >= now);

            if (!isValid) {
                throw new Error("Unauthorized");
            }
        }

        await ctx.db.patch(args.goalId, {
            status: "completed",
            progress: 100,
            updatedAt: Date.now(),
        });

        await createAuditLog(ctx, {
            userId: viewer._id,
            action: "goal.complete",
            entityType: "goals",
            entityId: args.goalId,
        });
    },
});

/**
 * Delete a goal (soft delete)
 */
export const deleteGoal = mutation({
    args: { goalId: v.id("goals") },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        const goal = await ctx.db.get(args.goalId);
        if (!goal || goal.isDeleted) throw new Error("Goal not found");

        if (goal.userId !== viewer._id && viewer.systemRole !== 'admin') {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.goalId, {
            isDeleted: true,
            deletedAt: Date.now(),
        });

        await createAuditLog(ctx, {
            userId: viewer._id,
            action: "goal.delete",
            entityType: "goals",
            entityId: args.goalId,
        });
    },
});

/**
 * Bulk create goals for a user (admin functionality)
 */
export const bulkCreateGoalsForUser = mutation({
    args: {
        userId: v.id("users"),
        cycleId: v.optional(v.id("review_cycles")),
        goals: v.array(v.object({
            title: v.string(),
            description: v.optional(v.string()),
            dueDate: v.optional(v.number()),
        })),
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        const user = await ctx.db.get(args.userId);
        if (!user || user.isDeleted) throw new Error("User not found");

        const now = Date.now();
        const created: string[] = [];

        for (const goalData of args.goals) {
            const goalId = await ctx.db.insert("goals", {
                userId: args.userId,
                cycleId: args.cycleId,
                title: goalData.title,
                description: goalData.description,
                status: "in_progress",
                progress: 0,
                dueDate: goalData.dueDate,
                createdAt: now,
                updatedAt: now,
            });
            created.push(goalId);
        }

        await createAuditLog(ctx, {
            userId: admin._id,
            action: "goal.bulk_create",
            entityType: "goals",
            entityId: args.userId,
            metadata: { count: created.length, cycleId: args.cycleId },
        });

        return { created: created.length };
    },
});
