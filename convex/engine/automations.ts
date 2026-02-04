import { internalMutation } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

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
                    data: args.data
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
        if (key === "check_prerequisites") {
            // value = { programSlug: "onboarding", status: "completed" }
            // Need to check if user has completed that program
            // This requires async check, but checkConditions was synchronous.
            // We need to refactor checkConditions to be async or handle it inside the loop.
            // For now, let's skip complex async checks here or assume data has flags.
            // Better approach: Let's make checkConditions async?
            // Or better: Move this check to specific action that fails if not met?
            // Actually, simplest is to pass context.userHistory to data?
            // Let's defer "check_prerequisites" to a specific "gate_keeper" action that stops execution,
            // OR make checkConditions async.
            continue;
        }

        // Support specific keys like "status" or deep checking in context
        if (context[key] !== value) {
            return false;
        }
    }
    return true;
}

// Helper for check_prerequisites (async wrapper in main loop)
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

async function executeAction(ctx: MutationCtx, action: AutomationAction, context: { userId: Id<"users">; processId?: Id<"processes">; data?: Record<string, any>; }) {
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

        case "manage_user_profile": {
            // e.g. payload: { fields: { phone: "123", tags: ["photographer"] } }
            // context.data might contain the actual values from a form
            const currentProfile = user.profile || { positions: [], status: "candidate" };
            const updates = resolveValues(action.payload.fields as Record<string, any>, context.data);

            // Merge with existing customFields or specific profile props
            // Note: Schema defines specific props like joinDate and a generic customFields
            // We'll simplisticly map known keys to the root of profile, and others to customFields
            const knownKeys = ["joinDate", "exitDate", "privacyLevel"];
            const newCustomFields = { ...(currentProfile.customFields || {}) };
            const profileUpdates: any = {};

            for (const [key, val] of Object.entries(updates)) {
                if (knownKeys.includes(key)) {
                    profileUpdates[key] = val;
                } else if (key === "tags") {
                    // Start tags array or append? For now, replace or ensure array
                    // If we want to append, we'd need more logic. Let's assume specific tag management is handled by specific actions or UI, 
                    // or this replaces the list. Let's replace the list for simplicity in "update"
                    // But wait, schema doesn't have "tags" on profile root, it has customFields.
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

        case "create_goal": {
            // e.g. payload: { title: "...", description: "...", cycleId: "..." }
            const title = resolveValue(action.payload.title, context.data);
            if (!title) return;

            await ctx.db.insert("goals", {
                userId: user._id,
                title,
                description: resolveValue(action.payload.description, context.data),
                cycleId: resolveValue(action.payload.cycleId, context.data),
                status: "in_progress",
                createdAt: Date.now(),
                updatedAt: Date.now()
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

            await ctx.db.insert("processes", {
                userId: user._id,
                programId: programId as Id<"programs">,
                type: prog.programType || "generic",
                status: "in_progress",
                currentStageId: prog.stageIds[0],
                updatedAt: Date.now(),
                data: {},
                // If we had Department Scoping in the payload we could add it
            });
            break;
        }

        case "book_event": {
            // payload: { blockId: "...", eventId: "..." }
            // Only auto-book if specific eventId logic or next available?
            // Let's support booking a specific event if passed in context, or finding next open in block.
            const eventId = resolveValue(action.payload.eventId, context.data);
            if (eventId) {
                // Call book logic
                await ctx.scheduler.runAfter(0, api.domains.ops.events.bookEvent, { eventId });
            }
            break;
        }

        case "distribute_peer_reviews": {
            // payload: { cycleId: "...", grouping: "same_department", count: 2 }
            const cycleId = resolveValue(action.payload.cycleId, context.data);
            const grouping = action.payload.grouping || "same_department";
            const count = (action.payload.count as number) || 2;

            if (!cycleId) return;

            // This is heavy, maybe offload to a recursive scheduled action if many users?
            // For now, doing strictly "same_department" logic for the Triggering User?
            // "distribute_peer_reviews" implies bulk action.
            // Usually this runs once for the whole system.
            // But here we are in context of A TRIGGER (e.g. "manual_trigger" or "schedule").

            // Implementation: Find peers for THIS user? Or global?
            // If context.userId is the admin triggering it, maybe global?
            // If context.userId is a member, maybe assign THEIR peers?

            // Let's assume Global Distribution if triggered by Admin/System, 
            // or "Assign Peers For This User" if triggered by User?
            // The name "distribute_peer_reviews" suggests global.
            // Let's implement "assign_peers_for_user" logic: ensuring THIS user has peers assigned to review THEM,
            // or ensuring THIS user is assigned to review others?

            // Let's go with: "Assign reviewers TO this user" (User is reviewee)
            // AND "Assign this user to review others"

            // Actually, simplest Peer Review logic:
            // 1. Get all potential reviewers (e.g. same department)
            // 2. Pick N random ones.
            const userDept = user.profile?.positions?.find(p => p.isPrimary)?.departmentId;
            if (grouping === "same_department" && userDept) {
                // This is getting complicated for a single function.
                // Let's simplify: Create a placeholder assignment that Admin must confirm?
                // OR: Just assign manager as reviewer?

                // Real implementation:
                // We'll trust the User is the Reviewee.
                // We find 2 peers in same dept (using simple scan for prototype).
                const allUsers = await ctx.db.query("users").collect();
                const deptPeers = allUsers.filter(u =>
                    u._id !== user._id &&
                    u.profile?.positions?.some(p => p.departmentId === userDept)
                );

                // Shuffle and pick N
                const selected = deptPeers.sort(() => 0.5 - Math.random()).slice(0, count);

                for (const peer of selected) {
                    await ctx.db.insert("peer_review_assignments", {
                        cycleId: cycleId as Id<"review_cycles">,
                        reviewerId: peer._id,
                        revieweeId: user._id,
                        isAnonymous: true,
                        status: "pending"
                    });

                    // Notify Peer?
                }
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

/**
 * Helper to resolve values from context data if the value is a template string like "{{someField}}"
 * or if it's a direct value.
 */
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

