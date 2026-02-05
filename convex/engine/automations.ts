import { internalMutation } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { createAuditLog } from "../core/auditLog";
import { generateUuid } from "./utils";

const MAX_RECURSION_DEPTH = 3;

/** Evaluates automations for a specific trigger. Internal mutation. */
export const evaluate = internalMutation({
    args: {
        trigger: v.string(), // "status_change", "stage_submission"
        programId: v.optional(v.id("programs")),
        processId: v.optional(v.id("processes")),
        userId: v.id("users"),
        data: v.optional(v.any()), // Context data (e.g., new status, form usage)
        depth: v.optional(v.number()), // Loop Detection
    },
    handler: async (ctx, args) => {
        const depth = args.depth || 0;
        if (depth > MAX_RECURSION_DEPTH) {
            console.error(`Automation Loop Detected! Trigger: ${args.trigger}, User: ${args.userId}. Halting.`);
            await createAuditLog(ctx, { // Log critical failure
                userId: args.userId,
                action: "automation.halted",
                entityType: "automation",
                entityId: "loop_protection",
                metadata: { trigger: args.trigger, depth }
            });
            return;
        }

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

            // 1b. Async Conditions (Prereqs)
            if (automation.conditions?.check_prerequisites) {
                const passed = await verifyPrerequisites(ctx, args.userId, automation.conditions.check_prerequisites);
                if (!passed) continue;
            }

            // 2. Execute Actions
            for (const action of automation.actions) {
                // Combine args into context. args has { userId, processId, data, programId }
                // We map this to { userId, processId, data }
                await executeAction(ctx, action, {
                    userId: args.userId,
                    processId: args.processId,
                    data: args.data,
                    depth: depth
                });
            }
        }
    },
});

function checkConditions(conditions: Record<string, unknown> | undefined, context: Record<string, unknown> | undefined): boolean {
    if (!conditions) return true;
    if (!context) return false;

    // Simple equality check for now
    for (const [key, value] of Object.entries(conditions)) {
        if (key === "check_prerequisites") continue; // Handled async in verifyPrerequisites

        // Support specific keys like "status" or deep checking in context
        if (context[key] !== value) {
            return false;
        }
    }
    return true;
}

/** Helper for check_prerequisites (async wrapper in main loop) */
async function verifyPrerequisites(ctx: MutationCtx, userId: Id<"users">, condition: any): Promise<boolean> {
    if (!condition) return true;
    // e.g. { programSlug: "onboarding", status: "completed" }
    const program = await ctx.db.query("programs").withIndex("by_slug", q => q.eq("slug", condition.programSlug)).first();
    if (!program) return false;

    const process = await ctx.db.query("processes")
        .withIndex("by_user", q => q.eq("userId", userId))
        .filter(q => q.eq(q.field("programId"), program._id))
        .first();

    if (!process) return false;
    if (condition.status && process.status !== condition.status) return false;

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

async function executeAction(ctx: MutationCtx, action: AutomationAction, context: { userId: Id<"users">; processId?: Id<"processes">; data?: Record<string, any>; depth?: number }) {
    const user = await ctx.db.get(context.userId);
    if (!user) return;

    switch (action.type) {
        case "send_email":
            await ctx.scheduler.runAfter(0, api.core.emails.sendEmail, {
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
            // payload: { systemRole: "member" }
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
                    status: (action.payload.status as any) || currentProfile.status
                }
            });
            break;
        }

        case "manage_user_profile": {
            // e.g. payload: { fields: { phone: "123", tags: ["photographer"] } }
            // context.data might contain the actual values from a form
            const currentProfile = user.profile || { positions: [], status: "candidate" };
            const updates = resolveValues(action.payload.fields as Record<string, any>, context.data);

            // Merge with existing customFields or specific profile props
            const knownKeys = ["joinDate", "exitDate", "privacyLevel"];
            const newCustomFields = { ...(currentProfile.customFields || {}) };
            const profileUpdates: any = {};

            for (const [key, val] of Object.entries(updates)) {
                if (knownKeys.includes(key)) {
                    profileUpdates[key] = val;
                } else if (key === "tags") {
                    newCustomFields[key] = val;
                } else {
                    newCustomFields[key] = val;
                }
            }

            await ctx.db.patch(user._id, {
                profile: {
                    ...currentProfile,
                    ...profileUpdates,
                    customFields: newCustomFields
                }
            });
            break;
        }

        case "assign_manager": {
            // e.g. payload: { managerId: "...", context: "direct" }
            const managerId = resolveValue(action.payload.managerId, context.data);
            if (!managerId) return;

            // Check if assignment exists
            const existing = await ctx.db.query("manager_assignments")
                .withIndex("by_user", q => q.eq("userId", user._id))
                .filter(q => q.and(
                    q.eq(q.field("managerId"), managerId),
                    q.eq(q.field("context"), (action.payload.context as string) || "direct"),
                    q.neq(q.field("isDeleted"), true)
                ))
                .first();

            if (!existing) {
                await ctx.db.insert("manager_assignments", {
                    userId: user._id,
                    managerId: managerId,
                    context: (action.payload.context as string) || "direct",
                    isPrimary: !!action.payload.isPrimary,
                    startDate: Date.now()
                });
            }
            break;
        }

        case "assign_department": {
            // e.g. payload: { departmentId: "...", title: "Member" }
            const departmentId = resolveValue(action.payload.departmentId, context.data);
            const title = resolveValue(action.payload.title, context.data);

            if (!departmentId) return;

            const currentProfile = user.profile || { positions: [], status: "candidate" };
            const positions = currentProfile.positions || [];

            // Check if already in dept
            const existingIdx = positions.findIndex(p => p.departmentId === departmentId);

            const newPositions = [...positions];
            if (existingIdx >= 0) {
                // Update title if provided
                if (title) {
                    newPositions[existingIdx] = { ...newPositions[existingIdx], title };
                }
            } else {
                newPositions.push({
                    departmentId,
                    title: title || "Member",
                    isPrimary: positions.length === 0, // First one is primary default
                    startDate: Date.now()
                });
            }

            await ctx.db.patch(user._id, {
                profile: {
                    ...currentProfile,
                    positions: newPositions
                }
            });
            break;
        }



        case "trigger_process": {
            // Start a new process for the user
            // e.g. payload: { programSlug: "onboarding", programId: "..." }
            let programId = action.payload.programId;

            if (!programId && action.payload.programSlug) {
                const prog = await ctx.db.query("programs")
                    .withIndex("by_slug", q => q.eq("slug", action.payload.programSlug as string))
                    .first();
                if (prog) programId = prog._id;
            }

            if (!programId) return;

            // ... We need firstStageId
            const prog = await ctx.db.get(programId as Id<"programs">);
            if (!prog || !prog.stageIds || prog.stageIds.length === 0) return;

            // Check existing
            const existing = await ctx.db.query("processes")
                .withIndex("by_user", q => q.eq("userId", user._id))
                .filter(q => q.eq(q.field("programId"), programId as Id<"programs">))
                .first();
            if (existing) return; // Idempotency



            // Create process and trigger automation

            const pid = await ctx.db.insert("processes", {
                userId: user._id,
                programId: programId as Id<"programs">,
                type: prog.programType || "generic",
                status: "in_progress",
                currentStageId: prog.stageIds[0],
                updatedAt: Date.now(),
                data: {},
                // Resilience: Snapshot stage flow
                stageFlowSnapshot: prog.stageIds,
                uuid: generateUuid(),
            });

            // Trigger "Process Created" Automation
            if (prog.automations) {
                await ctx.scheduler.runAfter(0, internal.engine.automations.evaluate, {
                    trigger: "process_created",
                    programId: programId as Id<"programs">,
                    processId: pid,
                    userId: user._id,
                    data: { type: prog.programType || "generic" },
                    depth: (context.depth || 0) + 1
                });
            }
            break;
        }

        case "book_event": {
            // payload: { blockId: "...", eventId: "..." }
            const eventId = action.payload.eventId as Id<"events">;
            if (eventId) {
                await ctx.scheduler.runAfter(0, api.engine.events.bookEvent, { eventId });
            }
            break;
        }



        case "update_process_status": {
            if (!action.payload.status) return;
            const pid = context.processId;
            if (pid) {
                await ctx.db.patch(pid, {
                    status: action.payload.status as string,
                    updatedAt: Date.now()
                });
            }
            break;
        }

        default:
            console.warn(`Unknown automation action type: ${action.type}`);
    }
}

/** Resolves values from context data (e.g., "{{someField}}") */
function resolveValue(value: any, contextData: Record<string, unknown> | undefined): any {
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}') && contextData) {
        const key = value.slice(2, -2).trim();
        return contextData[key];
    }
    return value;
}

function resolveValues(fields: Record<string, any>, contextData: Record<string, unknown> | undefined): Record<string, any> {
    if (!fields) return {};
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
        result[k] = resolveValue(v, contextData);
    }
    return result;
}

