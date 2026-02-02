import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getViewer } from "./auth";

/**
 * Get all alumni for the network directory
 */
export const getAlumniDirectory = query({
    args: {},
    handler: async (ctx) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        // Allow active members and alumni to see the directory
        if (viewer.profile?.status !== 'active' && viewer.profile?.status !== 'alumni' && viewer.systemRole !== 'admin') {
            throw new Error("Ask your admin for access to the Alumni Network");
        }

        const users = await ctx.db.query("users").collect();
        const alumni = users.filter(u => u.profile?.status === "alumni" && !u.isDeleted);

        return alumni.map(u => ({
            _id: u._id,
            name: u.name,
            email: u.email, // Maybe hide based on privacy?
            exitDate: u.profile?.exitDate,
            mentorshipOpen: u.profile?.customFields?.mentorshipOpen ?? false,
            positions: u.profile?.positions
        }));
    }
});

/**
 * Toggle mentorship availability
 */
export const toggleMentorshipStatus = mutation({
    args: { isOpen: v.boolean() },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        if (viewer.profile?.status !== "alumni") {
            throw new Error("Only alumni can set mentorship status");
        }

        const customFields = viewer.profile?.customFields || {};

        await ctx.db.patch(viewer._id, {
            profile: {
                ...viewer.profile!,
                customFields: {
                    ...customFields,
                    mentorshipOpen: args.isOpen
                }
            }
        });
    }
});
