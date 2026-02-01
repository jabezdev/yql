import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import { getViewer } from "./auth";
import { createAuditLog } from "./auditLog";
import { isOwnerOrAdmin } from "./lib/authorize";
import { isValidProcessType, PROCESS_TYPES } from "./lib/constants";
import { requireRateLimit } from "./lib/rateLimit";

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
 */
export const getAllProcesses = query({
    args: {
        type: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        // Require at least officer level (clearanceLevel >= 3)
        if (!user || (user.clearanceLevel ?? 0) < 3) {
            throw new Error("Unauthorized: Requires officer-level access");
        }

        if (args.type) {
            const processes = await ctx.db
                .query("processes")
                .withIndex("by_type", q => q.eq("type", args.type!))
                .collect();
            return processes.filter(p => !p.isDeleted);
        }
        const allProcesses = await ctx.db.query("processes").collect();
        return allProcesses.filter(p => !p.isDeleted);
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
        const user = await getViewer(ctx);
        // Require admin level (clearanceLevel >= 4)
        if (!user || (user.clearanceLevel ?? 0) < 4) {
            throw new Error("Unauthorized: Requires admin-level access");
        }

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

        // 2. Validate Data
        // 2. Validate Data
        const formConfig = (currentStageConfig.config as any)?.formConfig || (currentStageConfig as any).formConfig;
        if (formConfig && Array.isArray(formConfig)) {
            for (const field of formConfig) {
                const value = args.data[field.id];
                const isPresent = value !== undefined && value !== null && value !== "";

                // Check Required
                if (field.required && !isPresent) {
                    throw new Error(`Field '${field.label}' is required.`);
                }

                // Type Validation (if present)
                if (isPresent) {
                    if (field.type === "email") {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (typeof value !== "string" || !emailRegex.test(value)) {
                            throw new Error(`Field '${field.label}' must be a valid email.`);
                        }
                    } else if (field.type === "number") {
                        if (typeof value !== "number" && isNaN(Number(value))) {
                            throw new Error(`Field '${field.label}' must be a number.`);
                        }
                    }
                    // Add more type checks as needed
                }
            }
        }

        // 3. Save Data
        const newStageData = {
            ...(process.data || {}),
            [args.stageId]: args.data
        };

        // 4. Calculate Next Stage
        const currentIndex = pipeline.findIndex(p => p._id === currentStageConfig._id);
        const nextStage = pipeline[currentIndex + 1];

        const updates: Partial<Doc<"processes">> = {
            data: newStageData,
            updatedAt: Date.now(),
        };

        if (nextStage) {
            updates.currentStageId = nextStage._id;
        } else {
            // End of pipeline
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
    },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user) throw new Error("Unauthorized");

        // Rate limiting check
        await requireRateLimit(ctx, user._id, "process.create");

        // Role-Based Access Control via DB
        const systemRole = user.systemRole || "guest";

        // 1. Fetch Role Config
        const roleConfig = await ctx.db
            .query("roles")
            .withIndex("by_slug", q => q.eq("slug", systemRole))
            .first();

        let allowedTypes: string[] = [];

        if (roleConfig) {
            allowedTypes = roleConfig.allowedProcessTypes || [];
        } else {
            // Fallback for bootstrap/admin if DB check fails
            if (systemRole === "admin") allowedTypes = ["recruitment", "recommitment", "survey", "loa_request"];
        }

        if (!allowedTypes.includes(args.type)) {
            throw new Error(`Users with role '${systemRole}' are not permitted to start '${args.type}' processes.`);
        }

        // Check if already exists?
        const existing = await ctx.db.query("processes")
            .withIndex("by_user", q => q.eq("userId", user._id))
            .filter(q => q.eq(q.field("programId"), args.programId))
            .first();

        if (existing) throw new Error("Process already exists for this program");

        // Get first stage
        const program = await ctx.db.get(args.programId);
        if (!program || !program.stageIds || program.stageIds.length === 0) throw new Error("Invalid program");

        const firstStageId = program.stageIds[0];

        const processId = await ctx.db.insert("processes", {
            userId: user._id,
            programId: args.programId,
            type: args.type,
            status: "in_progress",
            currentStageId: firstStageId,
            updatedAt: Date.now(),
            data: {}
        });

        // Audit Log
        await createAuditLog(ctx, {
            userId: user._id,
            action: "process.create",
            entityType: "processes",
            entityId: processId,
            metadata: { type: args.type, programId: args.programId }
        });

        return processId;
    }
});
