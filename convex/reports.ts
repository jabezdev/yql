import { v } from "convex/values";
import { query } from "./_generated/server";
import { getViewer, ensureAdmin } from "./auth";

// ============================================
// RECRUITMENT ANALYTICS
// ============================================

/**
 * Get recruitment funnel analysis for a program
 */
export const getRecruitmentFunnel = query({
    args: {
        programId: v.optional(v.id("programs")),
        dateFrom: v.optional(v.number()),
        dateTo: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        let processes = await ctx.db.query("processes").collect();

        // Filter by program
        if (args.programId) {
            processes = processes.filter((p) => p.programId === args.programId);
        }

        // Filter by type (recruitment only)
        processes = processes.filter((p) => p.type === "recruitment");

        // Filter by date range
        if (args.dateFrom) {
            processes = processes.filter((p) => (p._creationTime ?? 0) >= args.dateFrom!);
        }
        if (args.dateTo) {
            processes = processes.filter((p) => (p._creationTime ?? 0) <= args.dateTo!);
        }

        // Get all stages for funnel analysis
        const stages = await ctx.db.query("stages").collect();
        const stageNames = new Map(stages.map((s) => [s._id, s.name ?? s.type]));

        // Count by current stage
        const stageCounts: Record<string, number> = {};
        const statusCounts: Record<string, number> = {
            in_progress: 0,
            completed: 0,
            rejected: 0,
            withdrawn: 0,
        };

        for (const process of processes) {
            // Status counts
            statusCounts[process.status] = (statusCounts[process.status] || 0) + 1;

            // Stage counts
            if (process.currentStage) {
                const stageName = stageNames.get(process.currentStage) ?? "Unknown";
                stageCounts[stageName] = (stageCounts[stageName] || 0) + 1;
            }
        }

        // Calculate conversion rates
        const total = processes.length;
        const conversionRate = total > 0
            ? Math.round((statusCounts.completed / total) * 100)
            : 0;

        return {
            total,
            byStatus: statusCounts,
            byCurrentStage: stageCounts,
            conversionRate,
        };
    },
});

/**
 * Get application trends over time
 */
export const getApplicationTrends = query({
    args: {
        programId: v.optional(v.id("programs")),
        interval: v.optional(v.string()), // "day", "week", "month"
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        let processes = await ctx.db.query("processes").collect();

        if (args.programId) {
            processes = processes.filter((p) => p.programId === args.programId);
        }

        processes = processes.filter((p) => p.type === "recruitment");

        // Group by time interval
        const interval = args.interval ?? "week";
        const grouped: Record<string, number> = {};

        for (const process of processes) {
            const date = new Date(process._creationTime ?? Date.now());
            let key: string;

            switch (interval) {
                case "day":
                    key = date.toISOString().split("T")[0];
                    break;
                case "month":
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                    break;
                case "week":
                default:
                    // Get ISO week
                    const startOfYear = new Date(date.getFullYear(), 0, 1);
                    const weekNum = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
                    key = `${date.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
            }

            grouped[key] = (grouped[key] || 0) + 1;
        }

        // Sort by date
        const sortedKeys = Object.keys(grouped).sort();
        return sortedKeys.map((key) => ({ period: key, count: grouped[key] }));
    },
});

// ============================================
// MEMBER ANALYTICS
// ============================================

/**
 * Get member statistics
 */
export const getMemberStats = query({
    args: {},
    handler: async (ctx) => {
        const viewer = await getViewer(ctx);
        if (!viewer || (viewer.clearanceLevel ?? 0) < 3) {
            throw new Error("Officer access required");
        }

        const users = await ctx.db.query("users").collect();
        const activeUsers = users.filter((u) => !u.isDeleted);

        // Count by status
        const statusCounts: Record<string, number> = {};
        for (const user of activeUsers) {
            const status = user.profile?.status ?? "unknown";
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        }

        // Count by role
        const roleCounts: Record<string, number> = {};
        for (const user of activeUsers) {
            const role = user.systemRole ?? "guest";
            roleCounts[role] = (roleCounts[role] || 0) + 1;
        }

        // Count by clearance level
        const clearanceCounts: Record<number, number> = {};
        for (const user of activeUsers) {
            const level = user.clearanceLevel ?? 0;
            clearanceCounts[level] = (clearanceCounts[level] || 0) + 1;
        }

        // Count on leave
        const onLeave = activeUsers.filter((u) => u.profile?.status === "on_leave").length;

        return {
            total: activeUsers.length,
            byStatus: statusCounts,
            byRole: roleCounts,
            byClearanceLevel: clearanceCounts,
            currentlyOnLeave: onLeave,
        };
    },
});

/**
 * Get member growth over time
 */
export const getMemberGrowth = query({
    args: { months: v.optional(v.number()) },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        const users = await ctx.db.query("users").collect();
        const monthsToShow = args.months ?? 12;
        const now = new Date();

        // Generate list of months
        const months: { month: string; joined: number; exited: number }[] = [];

        for (let i = monthsToShow - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

            const startOfMonth = date.getTime();
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime();

            const joined = users.filter((u) => {
                const joinDate = u.profile?.joinDate;
                return joinDate && joinDate >= startOfMonth && joinDate <= endOfMonth;
            }).length;

            const exited = users.filter((u) => {
                const exitDate = u.profile?.exitDate;
                return exitDate && exitDate >= startOfMonth && exitDate <= endOfMonth;
            }).length;

            months.push({ month: monthKey, joined, exited });
        }

        return months;
    },
});

// ============================================
// PERFORMANCE REVIEW ANALYTICS
// ============================================

/**
 * Get review cycle statistics
 */
export const getReviewCycleStats = query({
    args: { cycleId: v.optional(v.id("review_cycles")) },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer || (viewer.clearanceLevel ?? 0) < 3) {
            throw new Error("Officer access required");
        }

        // If cycleId provided, get stats for that cycle; otherwise get overall
        if (args.cycleId) {
            const cycle = await ctx.db.get(args.cycleId);
            if (!cycle) return null;

            const peerAssignments = await ctx.db
                .query("peer_review_assignments")
                .withIndex("by_cycle", (q) => q.eq("cycleId", args.cycleId))
                .collect();

            const statusCounts: Record<string, number> = {
                pending: 0,
                in_progress: 0,
                submitted: 0,
            };

            for (const assignment of peerAssignments) {
                statusCounts[assignment.status] = (statusCounts[assignment.status] || 0) + 1;
            }

            const total = peerAssignments.length;
            const submitted = statusCounts.submitted;

            return {
                cycleName: cycle.name,
                cycleStatus: cycle.status,
                peerReviews: {
                    total,
                    submitted,
                    pending: statusCounts.pending,
                    inProgress: statusCounts.in_progress,
                    completionRate: total > 0 ? Math.round((submitted / total) * 100) : 0,
                },
            };
        }

        // Overall stats across all cycles
        const allCycles = await ctx.db.query("review_cycles").collect();
        const allAssignments = await ctx.db.query("peer_review_assignments").collect();

        return {
            totalCycles: allCycles.length,
            activeCycles: allCycles.filter((c) => c.status === "active").length,
            completedCycles: allCycles.filter((c) => c.status === "completed").length,
            totalPeerReviews: allAssignments.length,
            submittedPeerReviews: allAssignments.filter((a) => a.status === "submitted").length,
        };
    },
});

// ============================================
// DEPARTMENT ANALYTICS
// ============================================

/**
 * Get department statistics
 */
export const getDepartmentStats = query({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);

        const departments = await ctx.db.query("departments").collect();
        const users = await ctx.db.query("users").collect();
        const activeUsers = users.filter((u) => !u.isDeleted && u.profile?.status === "active");

        const deptStats = await Promise.all(
            departments.filter((d) => !d.isDeleted && d.isActive).map(async (dept) => {
                const members = activeUsers.filter((u) =>
                    u.profile?.positions?.some((p) => p.departmentId === dept._id)
                );

                const head = dept.headId ? await ctx.db.get(dept.headId) : null;

                return {
                    departmentId: dept._id,
                    name: dept.name,
                    slug: dept.slug,
                    headName: head?.name ?? "Unassigned",
                    memberCount: members.length,
                };
            })
        );

        return deptStats.sort((a, b) => b.memberCount - a.memberCount);
    },
});

// ============================================
// EXPORT FUNCTIONALITY
// ============================================

/**
 * Export processes as CSV-ready data
 */
export const exportProcesses = query({
    args: {
        programId: v.optional(v.id("programs")),
        type: v.optional(v.string()),
        status: v.optional(v.string()),
        dateFrom: v.optional(v.number()),
        dateTo: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        let processes = await ctx.db.query("processes").collect();

        // Apply filters
        if (args.programId) {
            processes = processes.filter((p) => p.programId === args.programId);
        }
        if (args.type) {
            processes = processes.filter((p) => p.type === args.type);
        }
        if (args.status) {
            processes = processes.filter((p) => p.status === args.status);
        }
        if (args.dateFrom) {
            processes = processes.filter((p) => (p._creationTime ?? 0) >= args.dateFrom!);
        }
        if (args.dateTo) {
            processes = processes.filter((p) => (p._creationTime ?? 0) <= args.dateTo!);
        }

        // Enrich with user data
        const exportData = await Promise.all(
            processes.map(async (process) => {
                const user = await ctx.db.get(process.userId);
                const program = process.programId ? await ctx.db.get(process.programId) : null;
                const currentStage = process.currentStage ? await ctx.db.get(process.currentStage) : null;

                return {
                    processId: process._id,
                    userName: user?.name ?? "Unknown",
                    userEmail: user?.email ?? "",
                    type: process.type,
                    status: process.status,
                    programName: program?.name ?? "N/A",
                    currentStage: currentStage?.name ?? currentStage?.type ?? "N/A",
                    createdAt: new Date(process._creationTime ?? 0).toISOString(),
                    updatedAt: process.updatedAt ? new Date(process.updatedAt).toISOString() : "",
                };
            })
        );

        return {
            data: exportData,
            columns: [
                "processId",
                "userName",
                "userEmail",
                "type",
                "status",
                "programName",
                "currentStage",
                "createdAt",
                "updatedAt",
            ],
        };
    },
});

/**
 * Export members as CSV-ready data
 */
export const exportMembers = query({
    args: {
        status: v.optional(v.string()),
        departmentId: v.optional(v.id("departments")),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        let users = await ctx.db.query("users").collect();
        users = users.filter((u) => !u.isDeleted);

        if (args.status) {
            users = users.filter((u) => u.profile?.status === args.status);
        }

        if (args.departmentId) {
            users = users.filter((u) =>
                u.profile?.positions?.some((p) => p.departmentId === args.departmentId)
            );
        }

        const departments = await ctx.db.query("departments").collect();
        const deptMap = new Map(departments.map((d) => [d._id, d.name]));

        const exportData = users.map((user) => {
            const primaryPosition = user.profile?.positions?.find((p) => p.isPrimary);
            const deptName = primaryPosition?.departmentId
                ? deptMap.get(primaryPosition.departmentId) ?? "Unknown"
                : "N/A";

            return {
                userId: user._id,
                name: user.name,
                email: user.email,
                systemRole: user.systemRole ?? "guest",
                clearanceLevel: user.clearanceLevel ?? 0,
                status: user.profile?.status ?? "unknown",
                department: deptName,
                position: primaryPosition?.title ?? "N/A",
                joinDate: user.profile?.joinDate
                    ? new Date(user.profile.joinDate).toISOString().split("T")[0]
                    : "",
            };
        });

        return {
            data: exportData,
            columns: [
                "userId",
                "name",
                "email",
                "systemRole",
                "clearanceLevel",
                "status",
                "department",
                "position",
                "joinDate",
            ],
        };
    },
});

/**
 * Export goals as CSV-ready data
 */
export const exportGoals = query({
    args: {
        cycleId: v.optional(v.id("review_cycles")),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        let goals = await ctx.db.query("goals").collect();
        goals = goals.filter((g) => !g.isDeleted);

        if (args.cycleId) {
            goals = goals.filter((g) => g.cycleId === args.cycleId);
        }
        if (args.status) {
            goals = goals.filter((g) => g.status === args.status);
        }

        const exportData = await Promise.all(
            goals.map(async (goal) => {
                const user = await ctx.db.get(goal.userId);
                const cycle = goal.cycleId ? await ctx.db.get(goal.cycleId) : null;

                return {
                    goalId: goal._id,
                    userName: user?.name ?? "Unknown",
                    userEmail: user?.email ?? "",
                    title: goal.title,
                    description: goal.description ?? "",
                    status: goal.status,
                    progress: goal.progress ?? 0,
                    cycleName: cycle?.name ?? "N/A",
                    dueDate: goal.dueDate
                        ? new Date(goal.dueDate).toISOString().split("T")[0]
                        : "",
                    createdAt: new Date(goal.createdAt).toISOString().split("T")[0],
                };
            })
        );

        return {
            data: exportData,
            columns: [
                "goalId",
                "userName",
                "userEmail",
                "title",
                "description",
                "status",
                "progress",
                "cycleName",
                "dueDate",
                "createdAt",
            ],
        };
    },
});

// ============================================
// DASHBOARD SUMMARY
// ============================================

/**
 * Get overall Talent Development dashboard summary
 */
export const getTDDashboardSummary = query({
    args: {},
    handler: async (ctx) => {
        const viewer = await getViewer(ctx);
        if (!viewer || (viewer.clearanceLevel ?? 0) < 3) {
            throw new Error("Officer access required");
        }

        // Members
        const users = await ctx.db.query("users").collect();
        const activeMembers = users.filter((u) =>
            !u.isDeleted && u.profile?.status === "active"
        ).length;
        const onLeave = users.filter((u) =>
            !u.isDeleted && u.profile?.status === "on_leave"
        ).length;

        // Pending LOA requests
        const pendingLOA = users.filter((u) => {
            const pending = u.profile?.customFields?.pendingLOA;
            return pending && pending.status === "pending_approval";
        }).length;

        // Active recruitment
        const processes = await ctx.db.query("processes").collect();
        const activeRecruitment = processes.filter(
            (p) => p.type === "recruitment" && p.status === "in_progress"
        ).length;

        // Review cycles
        const cycles = await ctx.db.query("review_cycles").collect();
        const activeCycles = cycles.filter((c) => c.status === "active").length;

        // Pending peer reviews
        const peerAssignments = await ctx.db.query("peer_review_assignments").collect();
        const pendingReviews = peerAssignments.filter((a) => a.status === "pending").length;

        return {
            activeMembers,
            membersOnLeave: onLeave,
            pendingLOARequests: pendingLOA,
            activeRecruitment,
            activeReviewCycles: activeCycles,
            pendingPeerReviews: pendingReviews,
        };
    },
});
