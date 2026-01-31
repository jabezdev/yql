import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Evaluates automations for a specific trigger.
 * This is an internal mutation called by other mutations (processes, events, etc).
 */
export const evaluate = internalMutation({
    args: {
        trigger: v.string(), // "status_change", "stage_submission"
        programId: v.optional(v.id("programs")),
        processId: v.optional(v.id("processes")),
        userId: v.id("users"),
        data: v.optional(v.any()), // Context data (e.g., new status, form usage)
    },
    handler: async (ctx, args) => {
        if (!args.programId) return; // No program context, no automations

        const program = await ctx.db.get(args.programId);
        if (!program || !program.automations) return;

        // Filter for matching triggers
        const pertinentAutomations = program.automations.filter(
            (a: any) => a.trigger === args.trigger
        );

        for (const automation of pertinentAutomations) {
            // 1. Check Conditions
            const conditionsMet = checkConditions(automation.conditions, args.data);
            if (!conditionsMet) continue;

            // 2. Execute Actions
            for (const action of automation.actions) {
                await executeAction(ctx, action, args);
            }
        }
    },
});

function checkConditions(conditions: Record<string, unknown> | undefined, context: any): boolean {
    if (!conditions) return true;

    // Simple equality check for now
    for (const [key, value] of Object.entries(conditions)) {
        // Support specific keys like "status" or deep checking in context
        if (context[key] !== value) {
            return false;
        }
    }
    return true;
}

async function executeAction(ctx: any, action: any, context: { userId: Id<"users">, data?: any }) {
    const user = await ctx.db.get(context.userId);
    if (!user) return;

    switch (action.type) {
        case "send_email":
            await ctx.scheduler.runAfter(0, api.emails.sendEmail, {
                to: user.email,
                subject: action.payload.subject || "Notification",
                template: action.payload.template,
                payload: {
                    name: user.name,
                    ...context.data, // Pass generic data to template
                    ...action.payload.variables // Hardcoded variables
                }
            });
            break;

        case "update_role":
            // e.g. payload: { systemRole: "member", clearanceLevel: 2 }
            await ctx.db.patch(user._id, {
                systemRole: action.payload.systemRole,
                clearanceLevel: action.payload.clearanceLevel
            });
            break;

        case "update_status": {
            // e.g. payload: { status: "active" }
            const currentProfile = user.profile || { positions: [], status: "candidate" } as any;
            await ctx.db.patch(user._id, {
                profile: {
                    ...currentProfile,
                    status: action.payload.status
                }
            });
            break;
        }

        default:
            console.warn(`Unknown automation action type: ${action.type}`);
    }
}
