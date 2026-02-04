import { query } from "../../_generated/server";
import { ensureAdmin } from "../../core/auth";
import type { Doc } from "../../_generated/dataModel";

/**
 * Returns a high-level overview of the Engine's health.
 * Used for the Admin Health Dashboard.
 */
export const getSystemStats = query({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);

        // 1. Process Stats
        const processes = await ctx.db.query("processes").collect();
        const activeProcesses = processes.filter((p: Doc<"processes">) => !p.isDeleted && p.status !== "completed");
        const completedProcesses = processes.filter((p: Doc<"processes">) => p.status === "completed");

        // 2. Program Stats
        const programs = await ctx.db.query("programs").collect();
        const activePrograms = programs.filter((p: Doc<"programs">) => p.isActive);

        // 3. Automation Health (Mocked for now, real implementation would join logs)
        // In a real system, we'd query audit_logs for "automation_failed"
        const recentErrors = await ctx.db.query("audit_logs")
            .withIndex("by_created")
            .order("desc")
            .take(50);

        const errorCount = recentErrors.filter((l: Doc<"audit_logs">) => l.action.includes("fail") || l.action.includes("error")).length;

        // 4. Database Size Estimate (Row counts)
        const rowCounts = {
            users: (await ctx.db.query("users").collect()).length, // Warning: optimize this later
            events: (await ctx.db.query("events").collect()).length,
            auditLogs: recentErrors.length, // Just what we fetched
        };

        return {
            processHealth: {
                total: processes.length,
                active: activeProcesses.length,
                completed: completedProcesses.length,
                stalled: activeProcesses.filter((p: Doc<"processes">) => Date.now() - p.updatedAt > 1000 * 60 * 60 * 24 * 7).length, // > 7 days untouched
            },
            configurations: {
                totalPrograms: programs.length,
                activePrograms: activePrograms.length,
                totalAutomations: programs.reduce((acc: number, p: Doc<"programs">) => acc + (p.automations?.length || 0), 0),
            },
            system: {
                errorRateProportion: errorCount / (recentErrors.length || 1),
                rowCounts
            }
        };
    }
});
