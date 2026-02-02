import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

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
            (a: { trigger: string }) => a.trigger === args.trigger
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

function checkConditions(conditions: Record<string, unknown> | undefined, context: Record<string, unknown> | undefined): boolean {
    if (!conditions) return true;
    if (!context) return false;

    // Simple equality check for now
    for (const [key, value] of Object.entries(conditions)) {
        // Support specific keys like "status" or deep checking in context
        if (context[key] !== value) {
            return false;
        }
    }
    return true;
}

interface AutomationAction {
    type: string;
    payload: {
        subject?: string;
        template?: string;
        variables?: Record<string, unknown>;
        systemRole?: string;
        // clearanceLevel removed
        status?: string;
        [key: string]: unknown;
    };
}

async function executeAction(ctx: MutationCtx, action: AutomationAction, context: { userId: Id<"users">; data?: Record<string, unknown> }) {
    const user = await ctx.db.get(context.userId);
    if (!user) return;

    switch (action.type) {
        case "send_email":
            await ctx.scheduler.runAfter(0, api.emails.sendEmail, {
                to: user.email,
                subject: action.payload.subject || "Notification",
                template: action.payload.template || "default",
                payload: {
                    name: user.name,
                    ...(context.data || {}),
                    ...(action.payload.variables || {})
                }
            });
            break;

        case "update_role":
            // e.g. payload: { systemRole: "member" }
            await ctx.db.patch(user._id, {
                systemRole: action.payload.systemRole,
            });
            break;

        case "update_status": {
            // e.g. payload: { status: "active" }
            const currentProfile = user.profile || { positions: [], status: "candidate" };
            await ctx.db.patch(user._id, {
                profile: {
                    ...currentProfile,
                    status: action.payload.status || currentProfile.status
                }
            });
            break;
        }

        default:
            console.warn(`Unknown automation action type: ${action.type}`);
    }
}

