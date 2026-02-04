import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { getViewer, ensureReviewer } from "../../core/auth";
import { createAuditLog } from "../../core/auditLog";

/**
 * Log hours for a shift or general activity.
 */
export const logHours = mutation({
    args: {
        shiftId: v.optional(v.id("events")),
        date: v.number(),
        durationMinutes: v.number(),
        activityDescription: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        const timesheetId = await ctx.db.insert("timesheets", {
            userId: user._id,
            shiftId: args.shiftId,
            date: args.date,
            durationMinutes: args.durationMinutes,
            activityDescription: args.activityDescription,
            status: "pending",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return timesheetId;
    }
});

/**
 * Get my timesheets.
 */
export const getMyTimesheets = query({
    args: {},
    handler: async (ctx) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        return await ctx.db
            .query("timesheets")
            .withIndex("by_user", q => q.eq("userId", user._id))
            .filter(q => q.neq(q.field("isDeleted"), true))
            .collect();
    }
});

/**
 * Approve or Reject a timesheet (Manager/Admin).
 */
export const reviewTimesheet = mutation({
    args: {
        timesheetId: v.id("timesheets"),
        status: v.union(v.literal("approved"), v.literal("rejected")),
        rejectionReason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const reviewer = await ensureReviewer(ctx);

        const timesheet = await ctx.db.get(args.timesheetId);
        if (!timesheet) throw new Error("Timesheet not found");

        // Ideally check if reviewer manages the user, but for now ensureReviewer is enough for MVP.

        await ctx.db.patch(args.timesheetId, {
            status: args.status,
            approverId: reviewer._id,
            rejectionReason: args.rejectionReason,
            updatedAt: Date.now(),
        });

        await createAuditLog(ctx, {
            userId: reviewer._id,
            action: `timesheet.${args.status}`,
            entityType: "timesheets",
            entityId: args.timesheetId,
            changes: { after: { status: args.status } }
        });
    }
});
