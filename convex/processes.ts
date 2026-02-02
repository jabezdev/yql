import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { getViewer, ensureAdmin, ensureReviewer } from "./auth";
import { createAuditLog } from "./auditLog";
import { requireRateLimit } from "./lib/rateLimit";
import { validateStageSubmission, calculateNextStage } from "./lib/processEngine";
import { getProcessAccessMask, canAccessProcess } from "./lib/processAccess";

/**
 * Gets a single process.
 */
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
            if (process.userId !== user._id && user.systemRole !== "admin") {
                throw new Error("Unauthorized");
            }
            return process;
        }

        // If generic lookup by user
        let targetUserId = user._id;
        if (args.userId) {
            if (args.userId !== user._id && user.systemRole !== "admin") {
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

/**
 * Gets all processes (Admin/Officer only).
 * Filters based on program viewConfig visibility.
 */
export const getAllProcesses = query({
    args: {
        type: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        // Require at least officer/staff level
        await ensureReviewer(ctx);
        const user = await getViewer(ctx); // Re-fetch to satisfy type (or ensureReviewer return user)

        if (!user) throw new Error("Unauthorized");

        const roleSlug = user.systemRole || "guest";
        const isAdmin = user.systemRole === 'admin';

        let processes;
        if (args.type) {
            processes = await ctx.db
                .query("processes")
                .withIndex("by_type", q => q.eq("type", args.type!))
                .collect();
        } else {
            processes = await ctx.db.query("processes").collect();
        }

        // Filter deleted + check viewConfig visibility
        const visibleProcesses = [];
        for (const p of processes) {
            if (p.isDeleted) continue;

            // Admin sees all
            if (isAdmin) {
                visibleProcesses.push(p);
                continue;
            }

            // Check program viewConfig
            if (p.programId) {
                const program = await ctx.db.get(p.programId);
                if (program?.viewConfig) {
                    const roleConfig = program.viewConfig[roleSlug];
                    if (roleConfig && roleConfig.visible === false) {
                        continue; // Skip - not visible to this role
                    }
                }
            }

            visibleProcesses.push(p);
        }

        return visibleProcesses;
    },
});

/**
 * Get a process with access mask for the current user.
 * Returns visibility and action permissions based on program accessControl/viewConfig.
 */
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

/**
 * Updates just status (Admin only).
 */
export const updateStatus = mutation({
    args: {
        processId: v.id("processes"),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        // Require admin level
        const user = await ensureAdmin(ctx);


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
            await ctx.scheduler.runAfter(0, internal.automations.evaluate, {
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

/**
 * Safely submit data for the CURRENT stage and advance if applicable.
 */
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

        if (process.userId !== user._id && user.systemRole !== "admin") {
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

        // 2. Validate Data (Using Lib)
        // We dynamic import here or assume it's available via top-level import
        // Since we cannot dynamically import easily in Convex functions unless top-level, we added the import at top.
        // But we need to update imports in processes.ts first! 
        // For now, I'll inline the call assuming I will add the import in a separate step or included in this file update if I could.
        // Wait, I can't add imports with replace_file_content easily if I don't target the top.
        // I will trust that I will add the import in the next step.

        // Actually, let's just implement the logic here for now if I can't easily add the import, 
        // OR better: I will use a separate replace_file_content to add the import.

        // Let's assume the import `import { validateStageSubmission, calculateNextStage } from "./lib/processEngine";` is there.
        // Wait, I haven't added it yet. I should have done that. 
        // I will simply use the logic I wrote in the lib, but I'll write it here for now to avoid breakage, 
        // OR I will queue an import update. 

        // Let we try to rely on the lib. I'll make sure to add the import in the NEXT tool call.
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
            // End of pipeline or stay on current
        }

        await ctx.db.patch(process._id, updates);

        // Automations Hook: Stage Submission
        await ctx.scheduler.runAfter(0, internal.automations.evaluate, {
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

/**
 * Create a new process (e.g. applying)
 */
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
        const systemRole = user.systemRole || "guest";

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

        // Strict Mode: Removed legacy allowStartBy fallback.
        // Access must be explicitly granted via program.accessControl using valid roles.

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

            const isAdmin = user.systemRole === 'admin';

            if (!managerAssignment && !isAdmin) {
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
            status: "in_progress",
            currentStageId: firstStageId,
            updatedAt: Date.now(),
            data: {},
            // Phase 3 fields
            departmentId: args.departmentId,
            createdFor: args.targetUserId !== user._id ? args.targetUserId : undefined,
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

        return processId;
    }
});

