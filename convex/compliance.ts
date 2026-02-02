import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getViewer, ensureAdmin } from "./auth";
import { createAuditLog } from "./auditLog";

/**
 * Submit an Incident/Grievance Report
 */
export const submitIncidentReport = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        isAnonymous: v.boolean(),
        involvedParties: v.optional(v.string()), // Names or IDs
    },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        const now = Date.now();

        // If anonymous, we might still store the creator ID for system integrity but hide it in UI?
        // Or actually store it but mark as anonymous. 
        // For true anonymity, we might not store userId, but this system generally assumes logged in users.
        // Let's store userId but flagged as anonymous report.

        await ctx.db.insert("processes", {
            userId: viewer._id,
            type: "incident_report",
            createdFor: viewer._id, // The reporter
            status: "submitted",
            currentStageId: (await ctx.db.query("stages").first())?._id as any, // Placeholder
            data: {
                report: {
                    title: args.title,
                    description: args.description,
                    involvedParties: args.involvedParties,
                    isAnonymous: args.isAnonymous,
                    submittedAt: now,
                }
            },
            updatedAt: now,
        });

        // Notify Admins
        const tdTeam = await ctx.db.query("users").collect();
        const admins = tdTeam.filter(u => u.systemRole === 'admin' && !u.isDeleted);

        for (const admin of admins) {
            await ctx.db.insert("notifications", {
                userId: admin._id,
                type: "incident",
                title: "New Incident Report",
                message: "A new incident report has been submitted.",
                link: `/dashboard/admin/compliance`,
                isRead: false,
                createdAt: now,
            });
        }
    },
});

/**
 * Get Incident Reports (Admin Only)
 */
export const getIncidentReports = query({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);

        const reports = await ctx.db
            .query("processes")
            .withIndex("by_type", (q) => q.eq("type", "incident_report"))
            .collect();

        return await Promise.all(reports.map(async (r) => {
            let reporterName = "Anonymous";
            if (!r.data?.report?.isAnonymous) {
                const reporter = await ctx.db.get(r.userId);
                reporterName = reporter?.name ?? "Unknown";
            }

            return {
                _id: r._id,
                title: r.data?.report?.title,
                description: r.data?.report?.description,
                submittedAt: r.data?.report?.submittedAt,
                reporterName,
                status: r.status,
            };
        }));
    },
});

/**
 * Export My Data (GDPR)
 */
export const exportMyData = mutation({
    args: { format: v.optional(v.string()) }, // json default
    handler: async (ctx) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        // Aggregate data
        const profile = viewer;


        // Get user's processes
        const processes = await ctx.db
            .query("processes")
            .withIndex("by_user", (q) => q.eq("userId", viewer._id))
            .collect();

        // Get user's reviews (self)
        // ... (can add more references here)

        const exportData = {
            user: profile,
            processes: processes,
            generatedAt: Date.now(),
        };

        // In a real app, this might return a signed URL to a file. 
        // For MVP, we return the JSON string directly.

        await createAuditLog(ctx, {
            userId: viewer._id,
            action: "data.export",
            entityType: "users",
            entityId: viewer._id,
        });

        return JSON.stringify(exportData);
    }
});
