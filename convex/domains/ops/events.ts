import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { api, internal } from "../../_generated/api";
import { getViewer } from "../../core/auth";
import { createAuditLog } from "../../core/auditLog";
import { requireRateLimit } from "../../lib/rateLimit";

// --- Queries ---

export const getEventsForBlock = query({
    args: { blockId: v.id("block_instances") },
    handler: async (ctx, args) => {
        const events = await ctx.db
            .query("events")
            .withIndex("by_block", (q) => q.eq("blockId", args.blockId))
            .collect();

        // Filter out soft-deleted events
        return events
            .filter(e => !e.isDeleted)
            .sort((a, b) => a.startTime - b.startTime);
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

        // Filter out soft-deleted and check if user is in attendees
        return events.filter(s => !s.isDeleted && s.attendees.includes(user._id));
    },
});

export const getShifts = query({
    args: { programId: v.optional(v.id("programs")) },
    handler: async (ctx, args) => {
        const q = ctx.db.query("events").withIndex("by_type", q => q.eq("type", "shift"));

        const shifts = await q.collect();

        // Filter by program if provided
        // Also could filter by date (future only?) - for now return all active
        const now = Date.now();

        return shifts
            .filter(s => !s.isDeleted && s.endTime > now && (!args.programId || s.programId === args.programId))
            .sort((a, b) => a.startTime - b.startTime);
    }
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
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        // Rate limiting check
        await requireRateLimit(ctx, user._id, "event.create");

        // Require at least probation level (clearance 1) to create events
        if (['guest'].includes(user.systemRole || "")) {
            throw new Error("Unauthorized: Insufficient access level to create events");
        }

        const createdEventIds = [];
        for (const slot of args.slots) {
            const eventId = await ctx.db.insert("events", {
                blockId: args.blockId,
                hostId: user._id,
                startTime: slot.startTime,
                endTime: slot.endTime,
                maxAttendees: slot.maxAttendees,
                attendees: [],
                status: "open",
                type: args.type || "meeting" // Generic default
            });
            createdEventIds.push(eventId);
        }

        // Audit Log
        await createAuditLog(ctx, {
            userId: user._id,
            action: "event.create",
            entityType: "events",
            entityId: createdEventIds[0], // Log first event, metadata has count
            metadata: {
                blockId: args.blockId,
                eventCount: args.slots.length,
                type: args.type || "meeting"
            }
        });

        return createdEventIds;
    },
});

export const createShift = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        location: v.optional(v.string()),
        startTime: v.number(),
        endTime: v.number(),
        maxAttendees: v.number(),
        programId: v.optional(v.id("programs")),
    },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        // Require staff/manager
        await requireRateLimit(ctx, user._id, "event.create");

        // Simple check for now
        if (['guest', 'member'].includes(user.systemRole || "")) {
            throw new Error("Unauthorized: Only staff/managers can create shifts");
        }

        const eventId = await ctx.db.insert("events", {
            hostId: user._id,
            title: args.title,
            description: args.description,
            location: args.location,
            startTime: args.startTime,
            endTime: args.endTime,
            maxAttendees: args.maxAttendees,
            programId: args.programId,
            attendees: [],
            status: "open",
            type: "shift"
        });

        await createAuditLog(ctx, {
            userId: user._id,
            action: "shift.create",
            entityType: "events",
            entityId: eventId,
            metadata: { title: args.title }
        });

        return eventId;
    }
});

export const deleteEvent = mutation({
    args: { eventId: v.id("events") },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        const event = await ctx.db.get(args.eventId);
        if (!event) throw new Error("Event not found");
        if (event.isDeleted) throw new Error("Event already deleted");

        // Only host or admin can delete
        const isHost = event.hostId === user._id;
        const isAdmin = user.systemRole === 'admin';

        if (!isHost && !isAdmin) {
            throw new Error("Unauthorized: Only the host or an admin can delete this event");
        }

        // Soft delete
        await ctx.db.patch(args.eventId, {
            isDeleted: true,
            deletedAt: Date.now(),
        });

        // Audit Log
        await createAuditLog(ctx, {
            userId: user._id,
            action: "event.delete",
            entityType: "events",
            entityId: args.eventId,
            changes: { before: event }
        });
    },
});

export const bookEvent = mutation({
    args: { eventId: v.id("events") },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        const event = await ctx.db.get(args.eventId);
        if (!event || event.isDeleted) throw new Error("Event not found or deleted");

        if (event.attendees.includes(user._id)) return; // Already booked

        if (event.attendees.length >= event.maxAttendees) {
            throw new Error("Event is full");
        }

        const newAttendees = [...event.attendees, user._id];
        const newStatus = newAttendees.length >= event.maxAttendees ? "full" : "open";

        await ctx.db.patch(args.eventId, {
            attendees: newAttendees,
            status: newStatus
        });

        // Audit Log
        await createAuditLog(ctx, {
            userId: user._id,
            action: "event.book",
            entityType: "events",
            entityId: args.eventId,
            metadata: { attendeeCount: newAttendees.length }
        });

        // Match automations if part of a program
        if (event.programId) {
            await ctx.scheduler.runAfter(0, internal.engine.automations.evaluate, {
                trigger: "event_booked",
                programId: event.programId,
                userId: user._id,
                data: {
                    eventId: args.eventId,
                    eventName: event.title,
                    startTime: event.startTime,
                    location: event.location
                }
            });
        }

        // Trigger Notification (Legacy / Default for non-program events)
        const dateStr = new Date(event.startTime).toLocaleString();
        await ctx.scheduler.runAfter(0, api.core.emails.sendEmail, {
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
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        const event = await ctx.db.get(args.eventId);
        if (!event || event.isDeleted) throw new Error("Event not found or deleted");

        // Check if user is actually a registered attendee
        if (!event.attendees.includes(user._id)) {
            throw new Error("You are not registered for this event");
        }

        const newAttendees = event.attendees.filter(id => id !== user._id);

        await ctx.db.patch(args.eventId, {
            attendees: newAttendees,
            status: "open"
        });

        // Audit Log
        await createAuditLog(ctx, {
            userId: user._id,
            action: "event.cancel",
            entityType: "events",
            entityId: args.eventId,
            metadata: { attendeeCount: newAttendees.length }
        });
    },
});
