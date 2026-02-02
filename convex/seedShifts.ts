import { mutation } from "./_generated/server";

export const seed = mutation({
    args: {},
    handler: async (ctx) => {
        // 1. Create a "Volunteer Operations" Program? Or just reuse existing.
        // Let's create a generic "Weekend Volunteering" program.
        const programId = await ctx.db.insert("programs", {
            name: "Weekend Volunteering 2026",
            slug: "weekend-volunteering",
            isActive: true,
            startDate: Date.now(),
            programType: "operations",
            description: "Regular weekend shifts.",
        });

        // 2. Create Shifts
        const shift1Id = await ctx.db.insert("events", {
            title: "Saturday Morning Pantry",
            description: "Help distribute food packages.",
            location: "Community Center Hall B",
            startTime: Date.now() + 86400000, // +1 day
            endTime: Date.now() + 86400000 + 14400000, // +4 hours
            maxAttendees: 5,
            attendees: [],
            status: "open",
            type: "shift",
            programId
        });

        const shift2Id = await ctx.db.insert("events", {
            title: "Sunday Clean Up",
            description: "Park cleanup duty.",
            location: "Central Park",
            startTime: Date.now() + 172800000, // +2 days
            endTime: Date.now() + 172800000 + 10800000, // +3 hours
            maxAttendees: 10,
            attendees: [],
            status: "open",
            type: "shift",
            programId
        });

        // 3. Log a Timesheet (Generic, no shift linked yet)
        // We need a user ID for this. We'll skip creating a user here, 
        // but the mutations will work if called by a logged-in user.

        return { programId, shift1Id, shift2Id };
    },
});
