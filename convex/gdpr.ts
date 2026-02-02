import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getViewer, ensureAdmin } from "./auth";
import { createAuditLog } from "./auditLog";

// ============================================
// GDPR COMPLIANCE MODULE
// ============================================

/**
 * Export all user data (GDPR Article 15 - Right of Access)
 * Returns all personal data associated with the requesting user
 */
export const exportMyData = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        // Collect all user data
        const userData: Record<string, unknown> = {
            exportedAt: new Date().toISOString(),
            exportType: "GDPR_DATA_EXPORT",
        };

        // 1. User Profile
        userData.profile = {
            id: user._id,
            email: user.email,
            name: user.name,
            systemRole: user.systemRole,
            // clearanceLevel removed
            profileData: user.profile,
            notificationPreferences: user.notificationPreferences,
        };

        // 2. All Processes (applications, etc.)
        const processes = await ctx.db
            .query("processes")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();
        userData.processes = processes.filter(p => !p.isDeleted);

        // 3. All Notifications
        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();
        userData.notifications = notifications.filter(n => !n.isDeleted);

        // 4. All Files (metadata only)
        const files = await ctx.db
            .query("files")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();
        userData.files = files.filter(f => !f.isDeleted).map((f) => ({
            id: f._id,
            name: f.name,
            type: f.type,
            createdAt: f.createdAt,
            // Note: storageId not included for security
        }));

        // 5. Events where user is host or attendee
        const allEvents = await ctx.db.query("events").collect();
        const userEvents = allEvents.filter(
            (e) => !e.isDeleted && (e.hostId === user._id || e.attendees.includes(user._id))
        );
        userData.events = userEvents;

        // 6. Reviews authored by user
        const reviews = await ctx.db
            .query("reviews")
            .filter((q) => q.eq(q.field("reviewerId"), user._id))
            .collect();
        userData.reviews = reviews;

        // 7. Audit logs where user is the subject
        const auditLogs = await ctx.db
            .query("audit_logs")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .take(100); // Limit to prevent huge exports
        userData.auditLogs = auditLogs;

        // 8. Rate limits (user's own data)
        const rateLimits = await ctx.db
            .query("rate_limits")
            .filter((q) => q.eq(q.field("userId"), user._id))
            .collect();
        userData.rateLimits = rateLimits;

        // 9. Deletion requests (user's own)
        const deletionRequests = await ctx.db
            .query("deletion_requests")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();
        userData.deletionRequests = deletionRequests;

        // Audit the export
        await createAuditLog(ctx, {
            userId: user._id,
            action: "user.export_data",
            entityType: "users",
            entityId: user._id,
            metadata: { exportedTables: Object.keys(userData) }
        });

        return userData;
    },
});

/**
 * Request account deletion (GDPR Article 17 - Right to Erasure)
 * Creates a deletion request that requires admin approval
 */
export const requestDeletion = mutation({
    args: {
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        // Check for existing pending request
        const existingRequest = await ctx.db
            .query("deletion_requests")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .first();

        if (existingRequest) {
            throw new Error("A deletion request is already pending");
        }

        // Create deletion request
        const requestId = await ctx.db.insert("deletion_requests", {
            userId: user._id,
            status: "pending",
            requestedAt: Date.now(),
            reason: args.reason,
        });

        // Audit the request
        await createAuditLog(ctx, {
            userId: user._id,
            action: "user.request_deletion",
            entityType: "users",
            entityId: user._id,
            metadata: { requestId, reason: args.reason }
        });

        return { requestId, status: "pending" };
    },
});

/**
 * Cancel a pending deletion request
 */
export const cancelDeletionRequest = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        const request = await ctx.db
            .query("deletion_requests")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .first();

        if (!request) {
            throw new Error("No pending deletion request found");
        }

        await ctx.db.patch(request._id, {
            status: "cancelled",
            processedAt: Date.now(),
        });

        await createAuditLog(ctx, {
            userId: user._id,
            action: "user.cancel_deletion",
            entityType: "users",
            entityId: user._id,
        });

        return { success: true };
    },
});

/**
 * Get deletion request status for current user
 */
export const getMyDeletionStatus = query({
    args: {},
    handler: async (ctx) => {
        const user = await getViewer(ctx);
        if (!user) return null;

        const request = await ctx.db
            .query("deletion_requests")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .order("desc")
            .first();

        return request;
    },
});

// ============================================
// ADMIN FUNCTIONS
// ============================================

/**
 * Get all pending deletion requests (Admin only)
 */
export const getPendingDeletionRequests = query({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);

        const requests = await ctx.db
            .query("deletion_requests")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        // Enrich with user info
        const enriched = await Promise.all(
            requests.map(async (r) => {
                const user = await ctx.db.get(r.userId);
                return {
                    ...r,
                    user: user ? { name: user.name, email: user.email } : null,
                };
            })
        );

        return enriched;
    },
});

/**
 * Process a deletion request (Admin only)
 * Approves or rejects the request
 */
export const processDeletionRequest = mutation({
    args: {
        requestId: v.id("deletion_requests"),
        action: v.union(v.literal("approve"), v.literal("reject")),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        const request = await ctx.db.get(args.requestId);
        if (!request) throw new Error("Request not found");
        if (request.status !== "pending") {
            throw new Error("Request already processed");
        }

        if (args.action === "approve") {
            // Soft-delete all user data
            const userId = request.userId;

            // Soft-delete processes
            const processes = await ctx.db
                .query("processes")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .collect();
            for (const p of processes) {
                await ctx.db.patch(p._id, { isDeleted: true, deletedAt: Date.now() });
            }

            // Soft-delete notifications
            const notifications = await ctx.db
                .query("notifications")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .collect();
            for (const n of notifications) {
                await ctx.db.patch(n._id, { isDeleted: true, deletedAt: Date.now() });
            }

            // Soft-delete files
            const files = await ctx.db
                .query("files")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .collect();
            for (const f of files) {
                await ctx.db.patch(f._id, { isDeleted: true, deletedAt: Date.now() });
            }

            // Anonymize user profile
            const user = await ctx.db.get(userId);
            if (user) {
                await ctx.db.patch(userId, {
                    email: `deleted-${userId}@deleted.local`,
                    name: "Deleted User",
                    profile: undefined,
                    notificationPreferences: undefined,
                });
            }

            // Update request status
            await ctx.db.patch(args.requestId, {
                status: "completed",
                processedAt: Date.now(),
                processedBy: admin._id,
                reason: args.reason,
            });

            await createAuditLog(ctx, {
                userId: admin._id,
                action: "user.delete",
                entityType: "users",
                entityId: userId,
                metadata: { requestId: args.requestId, action: "approved" }
            });
        } else {
            // Reject the request
            await ctx.db.patch(args.requestId, {
                status: "rejected",
                processedAt: Date.now(),
                processedBy: admin._id,
                reason: args.reason,
            });

            await createAuditLog(ctx, {
                userId: admin._id,
                action: "user.reject_deletion",
                entityType: "users",
                entityId: request.userId,
                metadata: { requestId: args.requestId, reason: args.reason }
            });
        }

        return { success: true };
    },
});
