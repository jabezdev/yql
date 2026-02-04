import { v } from "convex/values";
import { mutation, query, internalMutation } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { getViewer } from "./auth";
import { api } from "../_generated/api";
import { requireRateLimit } from "../lib/rateLimit";

// ============================================
// NOTIFICATION TYPES
// ============================================

export const NOTIFICATION_TYPES = {
    // Process-related
    PROCESS_UPDATE: "process_update",
    PROCESS_APPROVED: "process_approved",
    PROCESS_REJECTED: "process_rejected",
    PROCESS_REMINDER: "process_reminder",

    // Event-related
    EVENT_REMINDER: "event_reminder",
    EVENT_CANCELLED: "event_cancelled",
    EVENT_BOOKED: "event_booked",

    // Status-related
    STATUS_CHANGE: "status_change",
    ROLE_CHANGE: "role_change",

    // System
    SYSTEM_ALERT: "system_alert",
    WELCOME: "welcome",
    DEADLINE_WARNING: "deadline_warning",
} as const;

// ============================================
// QUERIES
// ============================================

/**
 * Get current user's notifications
 */
export const getMyNotifications = query({
    args: {
        unreadOnly: v.optional(v.boolean()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user) return [];

        let q;
        if (args.unreadOnly) {
            q = ctx.db
                .query("notifications")
                .withIndex("by_unread", (q) =>
                    q.eq("userId", user._id).eq("isRead", false)
                );
        } else {
            q = ctx.db
                .query("notifications")
                .withIndex("by_user", (q) => q.eq("userId", user._id));
        }

        const notifications = await q.order("desc").take(args.limit ?? 20);
        // Filter out soft-deleted
        return notifications.filter(n => !n.isDeleted);
    },
});

/**
 * Get unread notification count
 */
export const getUnreadCount = query({
    args: {},
    handler: async (ctx) => {
        const user = await getViewer(ctx);
        if (!user) return 0;

        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_unread", (q) =>
                q.eq("userId", user._id).eq("isRead", false)
            )
            .collect();

        return unread.length;
    },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a notification for a user
 */
export const createNotification = mutation({
    args: {
        userId: v.id("users"),
        type: v.string(),
        title: v.string(),
        message: v.string(),
        link: v.optional(v.string()),
        relatedEntityType: v.optional(v.string()),
        relatedEntityId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Only admins or system can create notifications for others
        const requestor = await getViewer(ctx);
        if (!requestor) throw new Error("Unauthorized");

        // Check if authorized (Admin, Manager, Lead, Officer)
        // Simplest: Check if systemRole is NOT guest/candidate
        const isStaff = requestor.systemRole &&
            ['admin', 'manager', 'lead', 'officer', 'member'].includes(requestor.systemRole);

        if (!isStaff && requestor.systemRole !== 'admin') {
            throw new Error("Unauthorized");
        }

        // Rate limiting check
        await requireRateLimit(ctx, requestor._id, "notification.create");

        const notificationId = await ctx.db.insert("notifications", {
            ...args,
            isRead: false,
            createdAt: Date.now(),
        });

        // TODO: Trigger email if user preferences allow
        const user = await ctx.db.get(args.userId);
        if (user?.notificationPreferences?.email?.enabled) {
            await ctx.scheduler.runAfter(0, api.core.emails.sendEmail, {
                to: user.email,
                subject: args.title,
                template: "notification",
                payload: {
                    title: args.title,
                    message: args.message,
                    link: args.link,
                },
            });
        }

        return notificationId;
    },
});

/**
 * Internal mutation for system-generated notifications
 */
export const systemNotify = internalMutation({
    args: {
        userId: v.id("users"),
        type: v.string(),
        title: v.string(),
        message: v.string(),
        link: v.optional(v.string()),
        relatedEntityType: v.optional(v.string()),
        relatedEntityId: v.optional(v.string()),
        sendEmail: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const notificationId = await ctx.db.insert("notifications", {
            userId: args.userId,
            type: args.type,
            title: args.title,
            message: args.message,
            link: args.link,
            relatedEntityType: args.relatedEntityType,
            relatedEntityId: args.relatedEntityId,
            isRead: false,
            createdAt: Date.now(),
        });

        // Check email preferences
        if (args.sendEmail) {
            const user = await ctx.db.get(args.userId);
            if (user?.notificationPreferences?.email?.enabled !== false) {
                await ctx.scheduler.runAfter(0, api.core.emails.sendEmail, {
                    to: user!.email,
                    subject: args.title,
                    template: "notification",
                    payload: {
                        title: args.title,
                        message: args.message,
                        link: args.link,
                    },
                });
            }
        }

        return notificationId;
    },
});

/**
 * Mark a notification as read
 */
export const markAsRead = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        const notification = await ctx.db.get(args.notificationId);
        if (!notification) return;

        // Only owner can mark as read
        if (notification.userId !== user._id) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.notificationId, { isRead: true });
    },
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_unread", (q) =>
                q.eq("userId", user._id).eq("isRead", false)
            )
            .collect();

        for (const notification of unread) {
            await ctx.db.patch(notification._id, { isRead: true });
        }

        return { marked: unread.length };
    },
});

/**
 * Delete a notification
 */
export const deleteNotification = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        const notification = await ctx.db.get(args.notificationId);
        if (!notification) return;
        if (notification.isDeleted) return; // Already deleted

        if (notification.userId !== user._id) {
            throw new Error("Unauthorized");
        }

        // Soft delete
        await ctx.db.patch(args.notificationId, {
            isDeleted: true,
            deletedAt: Date.now(),
        });
    },
});

/**
 * Clear old notifications (cleanup job) - marks as deleted
 */
export const cleanupOldNotifications = internalMutation({
    args: { olderThanDays: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const cutoff =
            Date.now() - (args.olderThanDays ?? 30) * 24 * 60 * 60 * 1000;

        const oldNotifications = await ctx.db
            .query("notifications")
            .filter((q) => q.and(
                q.lt(q.field("createdAt"), cutoff),
                q.neq(q.field("isDeleted"), true)
            ))
            .collect();

        for (const n of oldNotifications) {
            await ctx.db.patch(n._id, {
                isDeleted: true,
                deletedAt: Date.now(),
            });
        }

        return { deleted: oldNotifications.length };
    },
});

// ============================================
// HELPER FUNCTIONS (for use in other mutations)
// ============================================

/**
 * Helper to notify user about process updates
 */
export async function notifyProcessUpdate(
    ctx: MutationCtx,
    userId: Id<"users">,
    processId: Id<"processes">,
    title: string,
    message: string
) {
    await ctx.db.insert("notifications", {
        userId,
        type: NOTIFICATION_TYPES.PROCESS_UPDATE,
        title,
        message,
        link: `/dashboard/process/${processId}`,
        relatedEntityType: "processes",
        relatedEntityId: processId,
        isRead: false,
        createdAt: Date.now(),
    });
}

/**
 * Helper to notify user about status changes
 */
export async function notifyStatusChange(
    ctx: MutationCtx,
    userId: Id<"users">,
    oldStatus: string,
    newStatus: string,
    reason?: string
) {
    await ctx.db.insert("notifications", {
        userId,
        type: NOTIFICATION_TYPES.STATUS_CHANGE,
        title: "Membership Status Updated",
        message: `Your status has been changed from ${oldStatus} to ${newStatus}.${reason ? ` Reason: ${reason}` : ""}`,
        link: "/dashboard/profile",
        relatedEntityType: "users",
        relatedEntityId: userId,
        isRead: false,
        createdAt: Date.now(),
    });
}

