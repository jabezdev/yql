import { v } from "convex/values";
import { zStageSubmission } from "./utils";
import { mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";

import { getViewer, ensureAdmin, ensureReviewer } from "../core/auth";
import { createAuditLog } from "../core/auditLog";
import { requireRateLimit } from "../core/rateLimit";
import { validateStageSubmission, calculateNextStage } from "./utils";
import { getProcessAccessMask, canAccessProcess } from "./access";
import { ROLE_HIERARCHY, SYSTEM_ROLES, PROCESS_STATUS, isAdmin } from "../core/constants";
import { generateSchemaFromConfig } from "./validators/schemaGenerator";
import { generateUuid } from "./utils";

/** Gets a single process. */
export const getProcess = query({
    args: {
        userId: v.optional(v.id("users")),
        processId: v.optional(v.id("processes")),
        type: v.optional(v.string()), // e.g. "recruitment"
    },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        // If specific process ID requested
        if (args.processId) {
            const process = await ctx.db.get(args.processId);
            if (!process || process.isDeleted) return null;
            if (process.userId !== user._id && !isAdmin(user.systemRole)) {
                throw new Error("Unauthorized");
            }
            return process;
        }

        // If generic lookup by user
        let targetUserId = user._id;
        if (args.userId) {
            if (args.userId !== user._id && !isAdmin(user.systemRole)) {
                throw new Error("Unauthorized");
            }
            targetUserId = args.userId;
        }

        const q = ctx.db.query("processes").withIndex("by_user", (q) => q.eq("userId", targetUserId));

        const processes = await q.collect();

        // Filter out deleted
        const activeProcesses = processes.filter(p => !p.isDeleted);

        if (args.type) {
            return activeProcesses.find(p => p.type === args.type) || null;
        }

        return activeProcesses.sort((a, b) => b.updatedAt - a.updatedAt)[0] || null;
    },
});

/** Gets all active processes for the current user (Inbox). */
export const getMyProcesses = query({
    args: {},
    handler: async (ctx) => {
        const user = await getViewer(ctx);
        if (!user) return [];

        const processes = await ctx.db
            .query("processes")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .filter((q) => q.neq(q.field("isDeleted"), true))
            .collect();

        // Sort by updated descending
        return processes.sort((a, b) => b.updatedAt - a.updatedAt);
    },
});

/** Gets all processes for users managed by the current user (Team Inbox). */
export const getTeamProcesses = query({
    args: {},
    handler: async (ctx) => {
        const user = await getViewer(ctx);
        if (!user) return [];

        // 1. Get Direct Reports
        const assignments = await ctx.db
            .query("manager_assignments")
            .withIndex("by_manager", (q) => q.eq("managerId", user._id))
            .filter((q) => q.neq(q.field("isDeleted"), true))
            .collect();

        if (assignments.length === 0) return [];

        const reportIds = assignments.map(a => a.userId);

        // 2. Fetch Processes for each Report
        // Using Promise.all for parallelism
        const processesLists = await Promise.all(
            reportIds.map(userId =>
                ctx.db
                    .query("processes")
                    .withIndex("by_user", (q) => q.eq("userId", userId))
                    .filter((q) => q.neq(q.field("isDeleted"), true))
                    .collect()
            )
        );

        // 3. Flatten and Sort
        const allProcesses = processesLists.flat();
        return allProcesses.sort((a, b) => b.updatedAt - a.updatedAt);
    },
});

/** Gets all processes (Admin/Officer only) with pagination. Uses Merge Sort pattern for scalability. */
export const getProcessesPaginated = query({
    args: {
        type: v.optional(v.string()), // Optional filter by type
        paginationOpts: v.any(), // PaginationOptions
    },
    handler: async (ctx, args) => {
        // Require at least officer/staff level
        await ensureReviewer(ctx);
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        const userRole = user.systemRole || SYSTEM_ROLES.GUEST;
        const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0;


        const querySource = args.type
            ? ctx.db.query("processes").withIndex("by_type", q => q.eq("type", args.type!))
            : ctx.db.query("processes");

        // Apply Visibility Filter (DB Side)
        // efficient "Push Down" predicate
        const paginated = await querySource.filter(q =>
            q.and(
                q.neq(q.field("isDeleted"), true),
                q.lte(q.field("requiredRoleLevel"), userLevel)
            )
        ).order("desc").paginate(args.paginationOpts);

        return paginated;
    },
});

/** Helper to determine Role Level from Program Config */
function calculateRequiredRoleLevel(program: FuncResult<"programs">): number {
    if (!program.viewConfig) return 0; // Public/Guest

    const levels = [
        { role: SYSTEM_ROLES.GUEST, val: 0 },
        { role: SYSTEM_ROLES.MEMBER, val: 10 },
        { role: SYSTEM_ROLES.MANAGER, val: 20 },
        { role: SYSTEM_ROLES.LEAD, val: 30 },
        { role: SYSTEM_ROLES.ADMIN, val: 100 },
    ];

    for (const { role, val } of levels) {
        const config = program.viewConfig[role];
        // Default is visible (true)
        const isVisible = config?.visible !== false;

        if (isVisible) return val;
    }

    return 100; // Only Admin
}

// Add this type helper if needed or just use `any` for Program
type FuncResult<T extends "programs"> = Doc<T>;


/** Get a process with access mask for the current user. */
export const getProcessWithAccess = query({
    args: {
        processId: v.id("processes"),
    },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        const process = await ctx.db.get(args.processId);
        if (!process || process.isDeleted) return null;

        // Check basic view access
        const canView = await canAccessProcess(ctx, user, process, "view");
        if (!canView) {
            return null;
        }

        // Get full access mask
        const access = await getProcessAccessMask(ctx, user, process);

        return {
            process,
            access,
        };
    },
});

/** Updates just status (Admin only). */
export const updateStatus = mutation({
    args: {
        processId: v.id("processes"),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        // Require admin level
        const user = await ensureAdmin(ctx);
        if (!user) throw new Error("Unauthorized");


        const process = await ctx.db.get(args.processId);
        if (!process) throw new Error("Process not found");

        const previousStatus = process.status;

        await ctx.db.patch(args.processId, {
            status: args.status,
            updatedAt: Date.now(),
        });

        // Audit Log
        await createAuditLog(ctx, {
            userId: user._id,
            action: "process.status_change",
            entityType: "processes",
            entityId: args.processId,
            changes: {
                before: { status: previousStatus },
                after: { status: args.status }
            }
        });

        // Automations Hook: Status Change
        const processData = await ctx.db.get(args.processId);
        if (processData && processData.programId) {
            await ctx.scheduler.runAfter(0, internal.engine.automations.evaluate, {
                trigger: "status_change",
                programId: processData.programId,
                processId: processData._id,
                userId: processData.userId,
                data: {
                    status: args.status,
                    prevStatus: process.status
                }
            });
        }

        // Audit Log
        await createAuditLog(ctx, {
            userId: user._id,
            action: "process.status_change",
            entityType: "processes",
            entityId: args.processId,
            changes: { before: { status: process.status }, after: { status: args.status } }
        });
    },
});

/** Safely submit data for the CURRENT stage and advance if applicable. */
export const submitStage = mutation({
    args: {
        processId: v.id("processes"),
        stageId: v.string(),
        data: v.any(),
    },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        const process = await ctx.db.get(args.processId);
        if (!process) throw new Error("Process not found");

        if (process.userId !== user._id && !isAdmin(user.systemRole)) {
            throw new Error("Unauthorized");
        }

        if (!process.programId) throw new Error("Process not linked to a defined program");

        const program = await ctx.db.get(process.programId);
        if (!program) throw new Error("Program not found");

        // 1. Validate Current Stage & Fetch Pipeline
        let currentStageConfig;
        let pipeline: Doc<"stages">[] = [];

        if (program.stageIds && program.stageIds.length > 0) {
            pipeline = (await Promise.all(program.stageIds.map((id) => ctx.db.get(id)))).filter(Boolean) as Doc<"stages">[];
            currentStageConfig = pipeline.find(p => p._id === process.currentStageId || p.originalStageId === process.currentStageId);
        }

        if (!currentStageConfig) throw new Error("Invalid stage configuration");

        const isMatch = args.stageId === currentStageConfig._id || args.stageId === (currentStageConfig as any).id || args.stageId === currentStageConfig.originalStageId; // eslint-disable-line @typescript-eslint/no-explicit-any

        if (!isMatch) {
            throw new Error(`Stage mismatch. You are trying to submit to ${args.stageId} but process is at ${process.currentStageId}`);
        }

        // 2. Validate Data (Strict Mode via Zod)
        try {
            // A. Basic Format
            zStageSubmission.parse(args.data);

            // B. Config-Based Schema
            // If the stage has a defined form config, we validate against it.
            const validationConfig = currentStageConfig.config || {};
            const strictSchema = generateSchemaFromConfig(validationConfig);

            strictSchema.parse(args.data);

        } catch (e: any) {
            // Zod Error Formatting
            if (e.issues) {
                const issues = e.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ');
                throw new Error(`Validation Failed: ${issues}`);
            }
            throw new Error(`Invalid submission data: ${e.message}`);
        }

        // Legacy check (kept for robust double-check on 'requiredFields' block array)
        validateStageSubmission(args.data, currentStageConfig);

        // 3. Save Data
        const newStageData = {
            ...(process.data || {}),
            [args.stageId]: args.data
        };

        // 4. Calculate Next Stage
        const nextStageId = calculateNextStage(process.currentStageId, pipeline, args.data);

        const updates: Partial<Doc<"processes">> = {
            data: newStageData,
            updatedAt: Date.now(),
        };

        if (nextStageId) {
            updates.currentStageId = nextStageId as Doc<"stages">["_id"];
        } else {
            // End of pipeline
            updates.status = PROCESS_STATUS.COMPLETED; // Mark as completed
        }

        await ctx.db.patch(process._id, updates);

        // Automations Hook: Stage Submission
        await ctx.scheduler.runAfter(0, internal.engine.automations.evaluate, {
            trigger: "stage_submission",
            programId: program._id,
            processId: process._id,
            userId: user._id,
            data: {
                stageId: args.stageId,
                stageName: currentStageConfig.name,
                submission: args.data,
                decision: Object.values(args.data).includes("accept") ? "accept" :
                    Object.values(args.data).includes("decline") ? "decline" : undefined
            }
        });

        // Automations Hook: Process Completion checks
        if (!nextStageId) {
            await ctx.scheduler.runAfter(0, internal.engine.automations.evaluate, {
                trigger: "process_completed",
                programId: program._id,
                processId: process._id,
                userId: user._id,
                data: {
                    finalData: newStageData
                }
            });
        }

        // Audit Log (for stage submission/advance)
        await createAuditLog(ctx, {
            userId: user._id,
            action: process.currentStageId !== updates.currentStageId ? "process.advance" : "process.update",
            entityType: "processes",
            entityId: process._id,
            changes: {
                before: { currentStageId: process.currentStageId },
                after: { currentStageId: updates.currentStageId }
            },
            metadata: {
                stageName: currentStageConfig.name,
                submittedStageId: args.stageId
            }
        });
    }
});

/** Create a new process (e.g. applying). */
export const createProcess = mutation({
    args: {
        programId: v.id("programs"),
        type: v.string(), // "recruitment"
        // Phase 3: Department scoping
        departmentId: v.optional(v.id("departments")), // For department-scoped processes
        targetUserId: v.optional(v.id("users")),       // For creating on behalf of a team member
    },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        // Rate limiting check
        await requireRateLimit(ctx, user._id, "process.create");

        // Role-Based Access Control via DB
        const systemRole = user.systemRole || SYSTEM_ROLES.GUEST;

        // 1. Fetch Program Config (Inversion of Control)
        const program = await ctx.db.get(args.programId);
        if (!program || !program.isActive) throw new Error("Program not found or inactive");

        // 2. Check Permissions via allowStartBy or accessControl
        let isAllowed = false;

        // Check new accessControl first
        if (program.accessControl) {
            const roleConfig = program.accessControl.find(ac => ac.roleSlug === systemRole);
            if (roleConfig?.actions.includes("start")) {
                isAllowed = true;

                // Validate department scope if specified
                if (roleConfig.departmentScope && roleConfig.departmentScope !== "all") {
                    const userDepartments = user.profile?.positions
                        ?.filter(p => p.departmentId)
                        .map(p => p.departmentId!) || [];

                    if (roleConfig.departmentScope === "own") {
                        // Must provide a departmentId that user belongs to
                        if (args.departmentId && !userDepartments.includes(args.departmentId)) {
                            throw new Error("You can only create processes for your own department");
                        }
                    }
                }
            }
        }

        if (!isAllowed) {
            throw new Error(`Users with role '${systemRole}' are not permitted to start this process.`);
        }

        // 3. Validate targetUserId if provided (manager creating for team member)
        let effectiveUserId = user._id;

        if (args.targetUserId && args.targetUserId !== user._id) {
            // Must be at least officer/staff level to create for others
            await ensureReviewer(ctx);

            // Verify manager relationship
            const managerAssignment = await ctx.db
                .query("manager_assignments")
                .withIndex("by_manager", q => q.eq("managerId", user._id))
                .filter(q =>
                    q.and(
                        q.eq(q.field("userId"), args.targetUserId),
                        q.neq(q.field("isDeleted"), true)
                    )
                )
                .first();

            const isAdminUser = isAdmin(user.systemRole);

            if (!managerAssignment && !isAdminUser) {
                throw new Error("You can only create processes for your direct reports");
            }

            effectiveUserId = args.targetUserId;
        }

        // Check if already exists for the effective user
        const existing = await ctx.db.query("processes")
            .withIndex("by_user", q => q.eq("userId", effectiveUserId))
            .filter(q => q.eq(q.field("programId"), args.programId))
            .first();

        if (existing) throw new Error("Process already exists for this program");

        if (!program.stageIds || program.stageIds.length === 0) throw new Error("Invalid program configuration: No stages defined");

        const firstStageId = program.stageIds[0];

        const processId = await ctx.db.insert("processes", {
            userId: effectiveUserId,
            programId: args.programId,
            type: args.type,
            status: PROCESS_STATUS.IN_PROGRESS,
            currentStageId: firstStageId,
            updatedAt: Date.now(),
            data: {},
            // Phase 3 fields
            departmentId: args.departmentId,
            createdFor: args.targetUserId !== user._id ? args.targetUserId : undefined,
            // Scalability: Calc visibility level
            requiredRoleLevel: calculateRequiredRoleLevel(program),
            // Resilience: Snapshot stage flow
            stageFlowSnapshot: program.stageIds,
            uuid: generateUuid(),
        });

        // Audit Log
        await createAuditLog(ctx, {
            userId: user._id,
            action: "process.create",
            entityType: "processes",
            entityId: processId,
            metadata: {
                type: args.type,
                programId: args.programId,
                departmentId: args.departmentId,
                createdFor: args.targetUserId,
            }
        });

        // Automation Hook: Process Created
        if (program.automations) {
            await ctx.scheduler.runAfter(0, internal.engine.automations.evaluate, {
                trigger: "process_created",
                programId: args.programId,
                processId: processId,
                userId: effectiveUserId,
                data: {
                    type: args.type,
                    departmentId: args.departmentId
                }
            });
        }

        return processId;
    }
});

/** Accepts an offer and promotes the user. Data-driven via automations. */
export const acceptOffer = mutation({
    args: {
        processId: v.id("processes"),
    },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        const process = await ctx.db.get(args.processId);
        if (!process) throw new Error("Process not found");

        if (process.userId !== user._id) throw new Error("Unauthorized");

        // Status must be 'accepted' (which means Offer Extended in our flow)
        if (process.status !== PROCESS_STATUS.ACCEPTED) {
            throw new Error("No pending offer to accept.");
        }

        const programId = process.programId;
        if (!programId) throw new Error("Process not linked to program");

        // 1. Update Process Status
        await ctx.db.patch(process._id, {
            status: PROCESS_STATUS.OFFER_ACCEPTED, // or "completed"
            updatedAt: Date.now(),
        });

        // 2. Trigger Automation (REPLACES HARDCODED ROLE UPDATES)
        // This ensures the Program defines WHAT happens (e.g. role=member, status=active)
        await ctx.scheduler.runAfter(0, internal.engine.automations.evaluate, {
            trigger: "offer_accepted",
            programId: programId,
            processId: process._id,
            userId: user._id,
            data: {
                previousStatus: PROCESS_STATUS.ACCEPTED,
                newStatus: PROCESS_STATUS.OFFER_ACCEPTED
            }
        });

        // 3. Audit Log
        await createAuditLog(ctx, {
            userId: user._id,
            action: "offer.accept",
            entityType: "processes",
            entityId: process._id,
            changes: { before: { status: PROCESS_STATUS.ACCEPTED }, after: { status: PROCESS_STATUS.OFFER_ACCEPTED } }
        });

        return { success: true };
    },
});
