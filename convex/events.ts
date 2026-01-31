import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// --- Queries ---

export const getEventsForBlock = query({
    args: { blockId: v.id("block_instances") },
    handler: async (ctx, args) => {
        const events = await ctx.db
            .query("events")
            .withIndex("by_block", (q) => q.eq("blockId", args.blockId))
            .collect();

        return events.sort((a, b) => a.startTime - b.startTime);
    },
});

export const getMyBookings = query({
    args: { blockId: v.id("block_instances") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        const user = await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) return [];

        const events = await ctx.db
            .query("events")
            .withIndex("by_block", (q) => q.eq("blockId", args.blockId))
            .collect();

        // Check if user is in attendees
        return events.filter(s => s.attendees.includes(user._id));
    },
});

// --- Mutations ---

export const createEvents = mutation({
    args: {
        blockId: v.id("block_instances"),
        slots: v.array(v.object({
            startTime: v.number(),
            endTime: v.number(),
            maxAttendees: v.number(),
        })),
        type: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || (user.clearanceLevel ?? 0) < 1) throw new Error("Unauthorized");

        for (const slot of args.slots) {
            await ctx.db.insert("events", {
                blockId: args.blockId,
                hostId: user._id,
                startTime: slot.startTime,
                endTime: slot.endTime,
                maxAttendees: slot.maxAttendees,
                attendees: [],
                status: "open",
                type: args.type || "interview" // Default to interview for compatibility
            });
        }
    },
});

export const deleteEvent = mutation({
    args: { eventId: v.id("events") },
    handler: async (ctx, args) => {
        const event = await ctx.db.get(args.eventId);
        if (!event) return;
        await ctx.db.delete(args.eventId);
    },
});

export const bookEvent = mutation({
    args: { eventId: v.id("events") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");

        const event = await ctx.db.get(args.eventId);
        if (!event) throw new Error("Event not found");

        if (event.attendees.includes(user._id)) return; // Already booked

        if (event.attendees.length >= event.maxAttendees) {
            throw new Error("Event provided is full");
        }

        const newAttendees = [...event.attendees, user._id];
        const newStatus = newAttendees.length >= event.maxAttendees ? "full" : "open";

        await ctx.db.patch(args.eventId, {
            attendees: newAttendees,
            status: newStatus
        });

        // Trigger Notification
        const dateStr = new Date(event.startTime).toLocaleString();
        await ctx.scheduler.runAfter(0, api.emails.sendEmail, {
            to: user.email,
            subject: "Event Scheduled",
            template: "booking_confirmation",
            payload: {
                name: user.name,
                date: dateStr,
                slotId: args.eventId
            }
        });
    },
});

export const cancelBooking = mutation({
    args: { eventId: v.id("events") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");

        const event = await ctx.db.get(args.eventId);
        if (!event) throw new Error("Event not found");

        const newAttendees = event.attendees.filter(id => id !== user._id);

        await ctx.db.patch(args.eventId, {
            attendees: newAttendees,
            status: "open"
        });
    },
});
