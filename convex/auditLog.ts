import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getViewer, ensureAdmin } from "./auth";
import type { MutationCtx } from "./_generated/server";

// ============================================
// TYPES
// ============================================

export type AuditAction =
    | "user.create"
    | "user.update"
    | "user.status_change"
    | "user.role_change"
    | "user.delete"
    | "user.export_data"
    | "user.request_deletion"
    | "user.cancel_deletion"
    | "user.reject_deletion"
    | "process.create"
    | "process.update"
    | "process.advance"
    | "process.status_change"
    | "department.create"
    | "department.update"
    | "department.delete"
    | "program.create"
    | "program.update"
    | "role.update"
    | "review.submit"
    | "event.create"
    | "event.book"
    | "event.cancel"
    | "event.delete"
    | "access_gate.failed_attempt"
    | "file.upload"
    | "file.delete";

export type EntityType =
    | "users"
    | "processes"
    | "departments"
    | "programs"
    | "stages"
    | "reviews"
    | "events"
    | "files";

// ============================================
// INTERNAL HELPER
// ============================================

/**
 * Internal helper to create an audit log entry.
 * Can be called from other mutations.
 */
export async function createAuditLog(
    ctx: MutationCtx,
    params: {
        userId: Id<"users">;
        action: string;
        entityType: string;
        entityId: string;
        changes?: { before?: unknown; after?: unknown };
        metadata?: unknown;
    }
): Promise<Id<"audit_logs">> {
    return await ctx.db.insert("audit_logs", {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        changes: params.changes,
        metadata: params.metadata,
        createdAt: Date.now(),
    });
}

/**
 * Internal mutation for scheduled/async audit logging
 */
export const logAudit = internalMutation({
    args: {
        userId: v.id("users"),
        action: v.string(),
        entityType: v.string(),
        entityId: v.string(),
        changes: v.optional(v.any()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("audit_logs", {
            ...args,
            createdAt: Date.now(),
        });
    },
});

// ============================================
// QUERIES
// ============================================

/**
 * Get audit logs for a specific entity
 */
export const getEntityLogs = query({
    args: {
        entityType: v.string(),
        entityId: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user || (user.clearanceLevel ?? 0) < 3) {
            throw new Error("Unauthorized: Officer access required");
        }

        const logs = await ctx.db
            .query("audit_logs")
            .withIndex("by_entity", (q) =>
                q.eq("entityType", args.entityType).eq("entityId", args.entityId)
            )
            .order("desc")
            .take(args.limit ?? 50);

        // Enrich with user info
        const enrichedLogs = await Promise.all(
            logs.map(async (log) => {
                const actor = await ctx.db.get(log.userId);
                return {
                    ...log,
                    actorName: actor?.name ?? "Unknown",
                    actorEmail: actor?.email ?? "",
                };
            })
        );

        return enrichedLogs;
    },
});

/**
 * Get audit logs by user (who performed actions)
 */
export const getUserActivityLogs = query({
    args: {
        userId: v.id("users"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        return await ctx.db
            .query("audit_logs")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .take(args.limit ?? 100);
    },
});

/**
 * Get recent audit logs (admin dashboard)
 */
export const getRecentLogs = query({
    args: {
        limit: v.optional(v.number()),
        actionFilter: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        let q = ctx.db.query("audit_logs").withIndex("by_created").order("desc");

        const logs = await q.take(args.limit ?? 50);

        // Filter by action if provided
        const filtered = args.actionFilter
            ? logs.filter((log) => log.action.startsWith(args.actionFilter!))
            : logs;

        // Enrich with user info
        return await Promise.all(
            filtered.map(async (log) => {
                const actor = await ctx.db.get(log.userId);
                return {
                    ...log,
                    actorName: actor?.name ?? "Unknown",
                    actorEmail: actor?.email ?? "",
                };
            })
        );
    },
});

/**
 * Get audit log stats (for dashboard widgets)
 */
export const getAuditStats = query({
    args: { sinceDaysAgo: v.optional(v.number()) },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        const since = Date.now() - (args.sinceDaysAgo ?? 7) * 24 * 60 * 60 * 1000;

        const logs = await ctx.db.query("audit_logs").collect();
        const recentLogs = logs.filter((log) => log.createdAt >= since);

        // Group by action type
        const actionCounts: Record<string, number> = {};
        for (const log of recentLogs) {
            const actionType = log.action.split(".")[0]; // e.g., "user" from "user.status_change"
            actionCounts[actionType] = (actionCounts[actionType] || 0) + 1;
        }

        // Get unique actors
        const uniqueActors = new Set(recentLogs.map((log) => log.userId));

        return {
            totalActions: recentLogs.length,
            uniqueActors: uniqueActors.size,
            actionBreakdown: actionCounts,
            periodDays: args.sinceDaysAgo ?? 7,
        };
    },
});
