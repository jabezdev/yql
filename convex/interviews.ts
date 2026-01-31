import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { ensureAdmin } from "./auth";

// --- Queries ---

export const getSlotsForBlock = query({
    args: { blockId: v.string() },
    handler: async (ctx, args) => {
        const slots = await ctx.db
            .query("interview_slots")
            .withIndex("by_block", (q) => q.eq("blockId", args.blockId))
            .collect();

        // Filter out past slots? Maybe not, context usually implies upcoming.
        // We let the frontend filter.
        return slots.sort((a, b) => a.startTime - b.startTime);
    },
});

export const getMyBookings = query({
    args: { blockId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        const user = await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) return [];

        const slots = await ctx.db
            .query("interview_slots")
            .withIndex("by_block", (q) => q.eq("blockId", args.blockId))
            .collect();

        // Check if user is in attendees
        return slots.filter(s => s.attendees.includes(user._id));
    },
});

// --- Mutations ---

export const createSlots = mutation({
    args: {
        blockId: v.string(),
        slots: v.array(v.object({
            startTime: v.number(),
            endTime: v.number(),
            maxAttendees: v.number(),
        })),
    },
    handler: async (ctx, args) => {
        // Validation: Ensure Admin or Reviewer (TODO: strict role check)
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || user.role === 'applicant') throw new Error("Unauthorized");

        for (const slot of args.slots) {
            await ctx.db.insert("interview_slots", {
                blockId: args.blockId,
                reviewerId: user._id, // The creator is the host
                startTime: slot.startTime,
                endTime: slot.endTime,
                maxAttendees: slot.maxAttendees,
                attendees: [],
                status: "open",
            });
        }
    },
});

export const deleteSlot = mutation({
    args: { slotId: v.id("interview_slots") },
    handler: async (ctx, args) => {
        // Validation needed
        const slot = await ctx.db.get(args.slotId);
        if (!slot) return;

        // Notify attendees of cancellation? (Side Effect: TODO)

        await ctx.db.delete(args.slotId);
    },
});

export const bookSlot = mutation({
    args: { slotId: v.id("interview_slots") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");

        const slot = await ctx.db.get(args.slotId);
        if (!slot) throw new Error("Slot not found");

        if (slot.attendees.includes(user._id)) return; // Already booked

        if (slot.attendees.length >= slot.maxAttendees) {
            throw new Error("Slot provided is full");
        }

        const newAttendees = [...slot.attendees, user._id];
        const newStatus = newAttendees.length >= slot.maxAttendees ? "full" : "open";

        await ctx.db.patch(args.slotId, {
            attendees: newAttendees,
            status: newStatus
        });

        // Trigger Notification
        const dateStr = new Date(slot.startTime).toLocaleString();
        await ctx.scheduler.runAfter(0, api.emails.sendEmail, {
            to: user.email,
            subject: "Interview Requested",
            template: "booking_confirmation",
            payload: {
                name: user.name,
                date: dateStr,
                slotId: args.slotId
            }
        });
    },
});

export const cancelBooking = mutation({
    args: { slotId: v.id("interview_slots") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");

        const slot = await ctx.db.get(args.slotId);
        if (!slot) throw new Error("Slot not found");

        const newAttendees = slot.attendees.filter(id => id !== user._id);

        await ctx.db.patch(args.slotId, {
            attendees: newAttendees,
            status: "open"
        });
    },
});
