import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getViewer, ensureAdmin } from "./auth";
import { createAuditLog } from "./auditLog";
import type { MutationCtx } from "./_generated/server";

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
        const requestor = await getViewer(ctx);
        if (!requestor || (requestor.clearanceLevel ?? 0) < 3) {
            throw new Error("Unauthorized");
        }

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
        if (
            requestor._id !== args.userId &&
            (requestor.clearanceLevel ?? 0) < 3
        ) {
            throw new Error("Unauthorized");
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
        const requestor = await getViewer(ctx);
        if (!requestor || (requestor.clearanceLevel ?? 0) < 3) {
            throw new Error("Unauthorized: Officer access required");
        }

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

        // Handle role/clearance adjustments
        let roleUpdates: {
            systemRole?: string;
            clearanceLevel?: number;
        } = {};

        // Automatic role adjustments based on status
        if (newStatus === "alumni" || newStatus === "suspended") {
            roleUpdates = {
                systemRole: "guest",
                clearanceLevel: 0,
            };
        } else if (newStatus === "active" && currentStatus === "candidate") {
            // Promotion from candidate to active
            roleUpdates = {
                systemRole: "member",
                clearanceLevel: 2,
            };
        } else if (newStatus === "probation" && currentStatus === "candidate") {
            // Provisional member
            roleUpdates = {
                systemRole: "member",
                clearanceLevel: 1,
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
 * Start Leave of Absence
 */
export const startLeave = mutation({
    args: {
        reason: v.optional(v.string()),
        expectedReturnDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        if (user.profile?.status !== "active") {
            throw new Error("Only active members can start a leave of absence");
        }

        // Use the changeStatus logic internally
        const historyEntry = {
            status: "on_leave",
            changedAt: Date.now(),
            changedBy: user._id,
            reason: args.reason || "Self-initiated LOA",
        };

        const existingHistory = user.profile?.statusHistory || [];

        await ctx.db.patch(user._id, {
            profile: {
                ...user.profile,
                status: "on_leave",
                statusHistory: [...existingHistory, historyEntry],
            },
        });

        // Audit log
        await createAuditLog(ctx, {
            userId: user._id,
            action: "user.status_change",
            entityType: "users",
            entityId: user._id,
            changes: {
                before: { status: "active" },
                after: {
                    status: "on_leave",
                    reason: args.reason,
                    expectedReturn: args.expectedReturnDate,
                },
            },
        });

        return { success: true };
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

        await ctx.db.patch(user._id, {
            profile: {
                ...user.profile,
                status: "active",
                statusHistory: [...existingHistory, historyEntry],
            },
        });

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
