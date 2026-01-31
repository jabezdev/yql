
import { v } from "convex/values";
import { query } from "./_generated/server";
import { getViewer } from "./auth";

/**
 * Resolves the Dashboard Layout for the current user.
 * 1. Checks user's role.
 * 2. Finds the 'dashboards' entry linked to that role.
 * 3. Returns the layout configuration + hydrated block details.
 */
export const getDashboard = query({
    args: {},
    handler: async (ctx) => {
        const user = await getViewer(ctx);
        if (!user) return null; // Or return a default public dashboard

        const systemRole = user.systemRole || "guest";

        // 1. Get Role Config to find the dashboard link
        const roleConfig = await ctx.db
            .query("roles")
            .withIndex("by_slug", (q) => q.eq("slug", systemRole))
            .first();

        const dashboardSlug = roleConfig?.defaultDashboardSlug || "guest_dashboard";

        // 2. Fetch the Dashboard Layout
        const dashboard = await ctx.db
            .query("dashboards")
            .withIndex("by_slug", (q) => q.eq("slug", dashboardSlug))
            .first();

        if (!dashboard) {
            // Fallback if configured dashboard is missing
            return null;
        }

        // 3. Hydrate the Blocks (fetch the actual block_instances)
        const blocksWithData = await Promise.all(
            dashboard.layout.map(async (item) => {
                const blockInstance = await ctx.db.get(item.blockId);
                if (!blockInstance) return null;

                return {
                    ...item,
                    block: blockInstance, // Embed the full block config
                };
            })
        );

        return {
            ...dashboard,
            layout: blocksWithData.filter(Boolean),
        };
    },
});

/**
 * Resolves dynamic data for specific dashboard blocks.
 * This prevents the frontend from needing N different queries for N widgets.
 */
export const getDashboardData = query({
    args: {},
    handler: async (ctx) => {
        const user = await getViewer(ctx);
        if (!user) return {};

        // Fetch fundamental data that widgets might need
        const processes = await ctx.db
            .query("processes")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        // Calculate specific stats
        const activeProcesses = processes.filter(p => p.status === 'in_progress');
        const completedProcesses = processes.filter(p => p.status === 'approved' || p.status === 'rejected');

        // This object can be expanded as we add more widget types
        return {
            userProfile: {
                name: user.name,
                role: user.systemRole,
            },
            stats: {
                active_applications: activeProcesses.length,
                total_applications: processes.length,
                pending_actions: 0, // Placeholder
            },
            processes: processes.map(p => ({
                _id: p._id,
                type: p.type,
                status: p.status,
                updatedAt: p.updatedAt,
                // We could fetch stage names here if needed
            }))
        };
    },
});
