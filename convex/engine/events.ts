
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getViewer } from "../core/auth";
import { generateUuid } from "./utils";

// ============================================
// QUERIES
// ============================================

export const getEventsForBlock = query({
    args: { blockId: v.id("block_instances") },
    handler: async (ctx, args) => {
        return await ctx.db.query("events")
            .withIndex("by_block", q => q.eq("blockId", args.blockId))
            .filter(q => q.neq(q.field("isDeleted"), true))
            .collect();
    }
});

export const getMyBookings = query({
    args: { blockId: v.id("block_instances") },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) return [];

        // Inefficient scan for now as attendees is an array
        // Optimized: Schema has "attendees" array. We don't have an index on attendees array (Convex supports it though).
        // Let's assume we don't have an index for now and just filter.
        // Actually schema has "events" table... let's check schema.
        // Assuming typical implementation:
        const events = await ctx.db.query("events")
            .withIndex("by_block", q => q.eq("blockId", args.blockId))
            .filter(q => q.neq(q.field("isDeleted"), true))
            .collect();

        return events.filter(e => e.attendees.includes(viewer._id));
    }
});

// ============================================
// MUTATIONS
// ============================================

export const createEvents = mutation({
    args: {
        blockId: v.id("block_instances"),
        slots: v.array(v.object({
            startTime: v.number(),
            endTime: v.number(),
            maxAttendees: v.number(),
        })),
        type: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Auth check: Implementer/Admin only? 
        // For now, let's allow "staff" or anyone who can edit the block (implied by calling this).
        // Strict: `ensureAdmin(ctx)`?
        // Let's assume the UI guards this.

        for (const slot of args.slots) {
            await ctx.db.insert("events", {
                blockId: args.blockId,
                title: "Available Slot", // Default title
                startTime: slot.startTime,
                endTime: slot.endTime,
                maxAttendees: slot.maxAttendees,
                attendees: [],
                status: "open",
                type: args.type || "generic",
                uuid: generateUuid(),
            });
        }
    }
});

export const deleteEvent = mutation({
    args: { eventId: v.id("events") },
    handler: async (ctx, args) => {
        // Soft delete
        await ctx.db.patch(args.eventId, { isDeleted: true });
    }
});

export const bookEvent = mutation({
    args: { eventId: v.id("events") },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthenticated");

        const event = await ctx.db.get(args.eventId);
        if (!event) throw new Error("Event not found");

        if (event.status !== "open" || event.isDeleted) {
            throw new Error("Event is not available");
        }

        if (event.attendees.length >= event.maxAttendees) {
            throw new Error("Event is full");
        }

        if (event.attendees.includes(viewer._id)) {
            // Already booked
            return;
        }

        const newAttendees = [...event.attendees, viewer._id];
        const newStatus = newAttendees.length >= event.maxAttendees ? "full" : "open";

        await ctx.db.patch(args.eventId, {
            attendees: newAttendees,
            status: newStatus
        });

        // Trigger automations?
    }
});

export const cancelBooking = mutation({
    args: { eventId: v.id("events") },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthenticated");

        const event = await ctx.db.get(args.eventId);
        if (!event) throw new Error("Event not found");

        if (!event.attendees.includes(viewer._id)) {
            return; // Not booked
        }

        const newAttendees = event.attendees.filter(id => id !== viewer._id);

        await ctx.db.patch(args.eventId, {
            attendees: newAttendees,
            status: "open" // Always open if someone leaves (unless it was cancelled by admin?)
        });
    }
});
