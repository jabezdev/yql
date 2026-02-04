import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { getViewer, ensureAdmin, ensureReviewer } from "../../core/auth";
import { createAuditLog } from "../../core/auditLog";


// ============================================
// CONSTANTS
// ============================================

export const MEMBER_STATUSES = [
    "candidate",
    "probation",
    "active",
    "on_leave",
    "alumni",
    "suspended",
] as const;

export type MemberStatus = (typeof MEMBER_STATUSES)[number];

/**
 * Valid status transitions map.
 * Key = current status, Value = array of allowed next statuses
 */
export const STATUS_TRANSITIONS: Record<MemberStatus, MemberStatus[]> = {
    candidate: ["probation", "active", "alumni"], // Rejected goes to alumni
    probation: ["active", "alumni"], // Failed probation or quit
    active: ["on_leave", "alumni", "suspended"],
    on_leave: ["active", "alumni"],
    suspended: ["active", "alumni"],
    alumni: ["active"], // Recommitment
};

// ============================================
// QUERIES
// ============================================

/**
 * Get available status transitions for a user
 */
export const getAvailableTransitions = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        await ensureReviewer(ctx);

        const user = await ctx.db.get(args.userId);
        if (!user) return { currentStatus: null, availableTransitions: [] };

        const currentStatus = (user.profile?.status ?? "candidate") as MemberStatus;
        const availableTransitions = STATUS_TRANSITIONS[currentStatus] || [];

        return {
            currentStatus,
            availableTransitions,
        };
    },
});

/**
 * Get a user's status history
 */
export const getStatusHistory = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const requestor = await getViewer(ctx);
        if (!requestor) throw new Error("Unauthorized");

        // Allow viewing own history or if officer+
        if (requestor._id !== args.userId) {
            await ensureReviewer(ctx);
        }

        const user = await ctx.db.get(args.userId);
        if (!user) return [];

        const history = user.profile?.statusHistory || [];

        // Enrich with changer info
        return await Promise.all(
            history.map(async (entry) => {
                let changerName = "System";
                if (entry.changedBy) {
                    const changer = await ctx.db.get(entry.changedBy);
                    changerName = changer?.name ?? "Unknown";
                }
                return {
                    ...entry,
                    changerName,
                };
            })
        );
    },
});

/**
 * Get members by status
 */
export const getMembersByStatus = query({
    args: { status: v.string() },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        const allUsers = await ctx.db.query("users").collect();
        return allUsers.filter((u) => u.profile?.status === args.status);
    },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Change a user's membership status with validation and history tracking
 */
export const changeStatus = mutation({
    args: {
        userId: v.id("users"),
        newStatus: v.string(),
        reason: v.optional(v.string()),
        // For exits
        exitDate: v.optional(v.number()),
        exitReason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ensureReviewer(ctx);
        const requestor = await getViewer(ctx);
        if (!requestor) throw new Error("Unauthorized");

        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const currentStatus = (user.profile?.status ?? "candidate") as MemberStatus;
        const newStatus = args.newStatus as MemberStatus;

        // Validate transition
        const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
        if (!allowedTransitions.includes(newStatus)) {
            throw new Error(
                `Invalid status transition: ${currentStatus} → ${newStatus}. Allowed: ${allowedTransitions.join(", ")}`
            );
        }

        // Build history entry
        const historyEntry = {
            status: newStatus,
            changedAt: Date.now(),
            changedBy: requestor._id,
            reason: args.reason,
        };

        const existingHistory = user.profile?.statusHistory || [];

        // Build profile updates
        const profileUpdates: Record<string, unknown> = {
            status: newStatus,
            statusHistory: [...existingHistory, historyEntry],
        };

        // Handle exit-specific fields
        if (newStatus === "alumni") {
            profileUpdates.exitDate = args.exitDate || Date.now();
            profileUpdates.exitReason = args.exitReason || args.reason;
        }

        // Handle role adjustments
        let roleUpdates: {
            systemRole?: string;
        } = {};

        // Automatic role adjustments based on status
        if (newStatus === "alumni" || newStatus === "suspended") {
            roleUpdates = {
                systemRole: "guest",
            };
        } else if (newStatus === "active" && currentStatus === "candidate") {
            // Promotion from candidate to active
            roleUpdates = {
                systemRole: "member",
            };
        } else if (newStatus === "probation" && currentStatus === "candidate") {
            // Provisional member
            roleUpdates = {
                systemRole: "member",
            };
        }

        // Merge existing profile with updates
        const updatedProfile = {
            ...(user.profile || { positions: [], status: "candidate" }),
            ...profileUpdates,
        };

        // Perform the update
        await ctx.db.patch(args.userId, {
            profile: updatedProfile,
            ...roleUpdates,
        });

        // Create audit log
        await createAuditLog(ctx, {
            userId: requestor._id,
            action: "user.status_change",
            entityType: "users",
            entityId: args.userId,
            changes: {
                before: { status: currentStatus },
                after: {
                    status: newStatus,
                    reason: args.reason,
                    roleUpdates,
                },
            },
        });

        return { success: true, newStatus };
    },
});

/**
 * Request Leave of Absence (creates pending request, notifies manager)
 */
export const requestLeave = mutation({
    args: {
        reason: v.string(),
        startDate: v.number(),
        expectedReturnDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        if (user.profile?.status !== "active") {
            throw new Error("Only active members can request leave of absence");
        }

        // Check if there's already a pending LOA request
        const existingRequest = await ctx.db
            .query("processes")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .filter((q) =>
                q.and(
                    q.eq(q.field("type"), "loa_request"),
                    q.eq(q.field("status"), "in_progress")
                )
            )
            .first();

        if (existingRequest) {
            throw new Error("You already have a pending LOA request");
        }

        // Get LOA approvers
        const approvers = await ctx.db
            .query("manager_assignments")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .filter((q) =>
                q.and(
                    q.or(
                        q.eq(q.field("context"), "loa_approver"),
                        q.and(
                            q.eq(q.field("context"), "direct"),
                            q.eq(q.field("isPrimary"), true)
                        )
                    ),
                    q.neq(q.field("isDeleted"), true)
                )
            )
            .collect();

        // Create LOA request process
        // Note: This requires a stage to exist for LOA - create a simple one if needed
        // Check if LOA stage exists (optional check)
        await ctx.db.query("stages").filter((q) =>
            q.eq(q.field("type"), "loa_approval")
        ).first();

        // If no LOA stage exists, we'll store the data without a process
        // For now, log the request and notify managers
        const loaData = {
            reason: args.reason,
            startDate: args.startDate,
            expectedReturnDate: args.expectedReturnDate,
            requestedAt: Date.now(),
            status: "pending_approval",
            approvers: approvers.map((a) => a.managerId),
        };

        // Store in user's profile customFields for now
        const customFields = user.profile?.customFields || {};
        await ctx.db.patch(user._id, {
            profile: {
                ...user.profile!,
                customFields: {
                    ...customFields,
                    pendingLOA: loaData,
                },
            },
        });

        // Notify managers
        for (const approver of approvers) {
            await ctx.db.insert("notifications", {
                userId: approver.managerId,
                type: "loa_request",
                title: "Leave of Absence Request",
                message: `${user.name} has requested leave of absence starting ${new Date(args.startDate).toLocaleDateString()}`,
                link: `/talent-development/loa-requests`,
                relatedEntityType: "users",
                relatedEntityId: user._id,
                isRead: false,
                createdAt: Date.now(),
            });
        }

        // Notify Talent Development team (officers+)
        const tdTeam = await ctx.db.query("users").collect();
        const tdOfficers = tdTeam.filter((u) =>
            u.systemRole === 'admin' && !u.isDeleted && u._id !== user._id
        );

        for (const officer of tdOfficers.slice(0, 5)) { // Limit to first 5 execs
            await ctx.db.insert("notifications", {
                userId: officer._id,
                type: "loa_request",
                title: "LOA Request Submitted",
                message: `${user.name} submitted an LOA request (FYI - pending manager approval)`,
                link: `/talent-development/loa-requests`,
                relatedEntityType: "users",
                relatedEntityId: user._id,
                isRead: false,
                createdAt: Date.now(),
            });
        }

        // Audit log
        await createAuditLog(ctx, {
            userId: user._id,
            action: "loa.request",
            entityType: "users",
            entityId: user._id,
            changes: { after: loaData },
        });

        return { success: true, approverCount: approvers.length };
    },
});

/**
 * Approve Leave of Absence (manager action)
 */
export const approveLeave = mutation({
    args: {
        userId: v.id("users"),
        comments: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const manager = await getViewer(ctx);
        if (!manager) throw new Error("Unauthorized");

        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const pendingLOA = user.profile?.customFields?.pendingLOA as {
            reason: string;
            startDate: number;
            expectedReturnDate?: number;
            requestedAt: number;
            status: string;
            approvers: Id<"users">[];
        } | undefined;

        if (!pendingLOA || pendingLOA.status !== "pending_approval") {
            throw new Error("No pending LOA request found");
        }

        // Check if manager is authorized to approve
        const isManager = pendingLOA.approvers.includes(manager._id);
        const isAdmin = manager.systemRole === 'admin';

        if (!isManager && !isAdmin) {
            throw new Error("You are not authorized to approve this request");
        }

        // Change status to on_leave
        const historyEntry = {
            status: "on_leave" as const,
            changedAt: Date.now(),
            changedBy: manager._id,
            reason: `LOA approved: ${pendingLOA.reason}`,
        };

        const existingHistory = user.profile?.statusHistory || [];
        const customFields = user.profile?.customFields || {};

        // Update pending LOA status
        const updatedLOA = {
            ...pendingLOA,
            status: "approved",
            approvedBy: manager._id,
            approvedAt: Date.now(),
            approverComments: args.comments,
        };

        await ctx.db.patch(args.userId, {
            profile: {
                ...user.profile!,
                status: "on_leave",
                statusHistory: [...existingHistory, historyEntry],
                customFields: {
                    ...customFields,
                    pendingLOA: undefined,
                    currentLOA: updatedLOA,
                },
            },
        });

        // Notify the user
        await ctx.db.insert("notifications", {
            userId: args.userId,
            type: "loa_approved",
            title: "Leave of Absence Approved",
            message: `Your LOA request has been approved by ${manager.name}`,
            isRead: false,
            createdAt: Date.now(),
        });

        // Notify Talent Development
        const tdTeam = await ctx.db.query("users").collect();
        const tdOfficers = tdTeam.filter((u) =>
            u.systemRole === 'admin' && !u.isDeleted && u._id !== args.userId && u._id !== manager._id
        );

        for (const officer of tdOfficers.slice(0, 3)) {
            await ctx.db.insert("notifications", {
                userId: officer._id,
                type: "loa_approved",
                title: "LOA Approved",
                message: `${user.name}'s LOA was approved by ${manager.name}`,
                isRead: false,
                createdAt: Date.now(),
            });
        }

        // Audit log
        await createAuditLog(ctx, {
            userId: manager._id,
            action: "loa.approve",
            entityType: "users",
            entityId: args.userId,
            changes: {
                before: { status: "active", loa: pendingLOA },
                after: { status: "on_leave", loa: updatedLOA },
            },
        });

        return { success: true };
    },
});

/**
 * Deny Leave of Absence (manager action)
 */
export const denyLeave = mutation({
    args: {
        userId: v.id("users"),
        reason: v.string(),
    },
    handler: async (ctx, args) => {
        const manager = await getViewer(ctx);
        if (!manager) throw new Error("Unauthorized");

        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const pendingLOA = user.profile?.customFields?.pendingLOA as {
            reason: string;
            status: string;
            approvers: Id<"users">[];
        } | undefined;

        if (!pendingLOA || pendingLOA.status !== "pending_approval") {
            throw new Error("No pending LOA request found");
        }

        const isManager = pendingLOA.approvers.includes(manager._id);
        const isAdmin = manager.systemRole === 'admin';

        if (!isManager && !isAdmin) {
            throw new Error("You are not authorized to deny this request");
        }

        // Clear the pending LOA
        const customFields = user.profile?.customFields || {};

        await ctx.db.patch(args.userId, {
            profile: {
                ...user.profile!,
                customFields: {
                    ...customFields,
                    pendingLOA: undefined,
                    lastDeniedLOA: {
                        ...pendingLOA,
                        status: "denied",
                        deniedBy: manager._id,
                        deniedAt: Date.now(),
                        denialReason: args.reason,
                    },
                },
            },
        });

        // Notify the user
        await ctx.db.insert("notifications", {
            userId: args.userId,
            type: "loa_denied",
            title: "Leave of Absence Denied",
            message: `Your LOA request was denied: ${args.reason}`,
            isRead: false,
            createdAt: Date.now(),
        });

        // Audit log
        await createAuditLog(ctx, {
            userId: manager._id,
            action: "loa.deny",
            entityType: "users",
            entityId: args.userId,
            changes: { before: { loa: pendingLOA }, after: { reason: args.reason } },
        });

        return { success: true };
    },
});

/**
 * Get pending LOA requests (for managers/admin)
 */
export const getPendingLOARequests = query({
    args: {},
    handler: async (ctx) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        const allUsers = await ctx.db.query("users").collect();

        // Filter users with pending LOA
        const pendingRequests = allUsers.filter((u) => {
            const pendingLOA = u.profile?.customFields?.pendingLOA;
            return pendingLOA && pendingLOA.status === "pending_approval";
        });

        // If not admin, only show requests where viewer is approver
        const isAdmin = viewer.systemRole === 'admin';

        const filteredRequests = pendingRequests.filter((u) => {
            if (isAdmin) return true;
            const pendingLOA = u.profile?.customFields?.pendingLOA as { approvers?: Id<"users">[] };
            return pendingLOA?.approvers?.includes(viewer._id);
        });

        return filteredRequests.map((u) => ({
            userId: u._id,
            userName: u.name,
            userEmail: u.email,
            request: u.profile?.customFields?.pendingLOA,
        }));
    },
});

/**
 * End Leave of Absence (return to active)
 */
export const endLeave = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        if (user.profile?.status !== "on_leave") {
            throw new Error("You are not currently on leave");
        }

        const historyEntry = {
            status: "active" as const,
            changedAt: Date.now(),
            changedBy: user._id,
            reason: "Returned from leave",
        };

        const existingHistory = user.profile?.statusHistory || [];
        const customFields = user.profile?.customFields || {};

        await ctx.db.patch(user._id, {
            profile: {
                ...user.profile,
                status: "active",
                statusHistory: [...existingHistory, historyEntry],
                customFields: {
                    ...customFields,
                    currentLOA: undefined,
                },
            },
        });

        // Notify Talent Development
        const tdTeam = await ctx.db.query("users").collect();
        const tdOfficers = tdTeam.filter((u) =>
            u.systemRole === 'admin' && !u.isDeleted && u._id !== user._id
        );

        for (const officer of tdOfficers.slice(0, 3)) {
            await ctx.db.insert("notifications", {
                userId: officer._id,
                type: "loa_ended",
                title: "Member Returned from Leave",
                message: `${user.name} has returned from leave of absence`,
                isRead: false,
                createdAt: Date.now(),
            });
        }

        // Audit log
        await createAuditLog(ctx, {
            userId: user._id,
            action: "user.status_change",
            entityType: "users",
            entityId: user._id,
            changes: {
                before: { status: "on_leave" },
                after: { status: "active" },
            },
        });

        return { success: true };
    },
});

// ... (previous content)

/**
 * Submit Resignation (Start Offboarding)
 */
export const submitResignation = mutation({
    args: {
        reason: v.string(),
        intendedExitDate: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        if (user.profile?.status === "alumni" || user.profile?.status === "candidate") {
            throw new Error("Invalid status for resignation");
        }

        const now = Date.now();

        // Check for existing offboarding process
        const existing = await ctx.db
            .query("processes")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .filter((q) => q.eq(q.field("type"), "offboarding"))
            .first();

        if (existing && existing.status === "in_progress") {
            throw new Error("You already have an offboarding process in progress");
        }

        // Create Offboarding Process
        const processId = await ctx.db.insert("processes", {
            userId: user._id,
            type: "offboarding",
            createdFor: user._id,
            status: "in_progress",
            // We assume a generic "Offboarding" stage exists or we use a placeholder
            currentStageId: (await ctx.db.query("stages").first())?._id as any, // HACK
            data: {
                resignation: {
                    reason: args.reason,
                    intendedExitDate: args.intendedExitDate,
                    submittedAt: now
                },
                steps: {
                    exitInterview: { status: "pending" },
                    assetReturn: { status: "pending" }
                }
            },
            updatedAt: now,
        });

        // Notify Admins
        const tdTeam = await ctx.db.query("users").collect();
        const admins = tdTeam.filter((u) => u.systemRole === 'admin' && !u.isDeleted);

        for (const admin of admins.slice(0, 3)) {
            await ctx.db.insert("notifications", {
                userId: admin._id,
                type: "resignation",
                title: "Resignation Submitted",
                message: `${user.name} has submitted their resignation.`,
                link: `/dashboard/admin/offboarding/${processId}`, // Mock link
                isRead: false,
                createdAt: now,
            });
        }

        await createAuditLog(ctx, {
            userId: user._id,
            action: "offboarding.start",
            entityType: "processes",
            entityId: processId,
        });

        return processId;
    },
});

/**
 * Complete Offboarding (Finalize transition to Alumni)
 */
export const completeOffboarding = mutation({
    args: {
        processId: v.id("processes"),
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        const process = await ctx.db.get(args.processId);
        if (!process) throw new Error("Process not found");
        if (process.type !== "offboarding") throw new Error("Not an offboarding process");

        const user = await ctx.db.get(process.userId);
        if (!user) throw new Error("User not found");

        const now = Date.now();

        // Close process
        await ctx.db.patch(args.processId, {
            status: "completed",
            updatedAt: now,
        });

        // Change user status to Alumni
        // Reuse internal logic or call it directly if we refactored.
        // For now, manual update similiar to changeStatus

        const historyEntry = {
            status: "alumni" as const,
            changedAt: now,
            changedBy: admin._id,
            reason: "Offboarding completed",
        };

        await ctx.db.patch(process.userId, {
            profile: {
                ...user.profile!,
                status: "alumni",
                exitDate: now,
                exitReason: process.data?.resignation?.reason ?? "Resigned",
                statusHistory: [...(user.profile?.statusHistory || []), historyEntry]
            },
            systemRole: "guest", // Alumni have guest-like access but special view
        });

        await createAuditLog(ctx, {
            userId: admin._id,
            action: "offboarding.complete",
            entityType: "users",
            entityId: process.userId,
        });
    },
});
