import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { getViewer, ensureAdmin } from "./auth";
import { createAuditLog } from "./auditLog";

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
            if (!process) return null;
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

        if (args.type) {
            return processes.find(p => p.type === args.type) || null;
        }

        return processes.sort((a, b) => b.updatedAt - a.updatedAt)[0] || null;
    },
});

/**
 * Gets all processes (Admin only).
 */
export const getAllProcesses = query({
    args: {
        type: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user || user.systemRole !== "admin") throw new Error("Unauthorized");

        if (args.type) {
            return await ctx.db
                .query("processes")
                .withIndex("by_type", q => q.eq("type", args.type!))
                .collect();
        }
        return await ctx.db.query("processes").collect();
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
        if (!user || user.systemRole !== "admin") throw new Error("Unauthorized");

        const process = await ctx.db.get(args.processId);
        if (!process) throw new Error("Process not found");

        await ctx.db.patch(args.processId, {
            status: args.status,
            updatedAt: Date.now(),
        });

        if (process.type === "recruitment" && args.status === 'approved') {
            await ctx.db.patch(process.userId, {
                systemRole: "member",
                clearanceLevel: 2,
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
        let pipeline: any[] = [];

        if (program.stageIds && program.stageIds.length > 0) {
            pipeline = (await Promise.all(program.stageIds.map((id: any) => ctx.db.get(id)))).filter(Boolean);
            currentStageConfig = pipeline.find(p => p._id === process.currentStageId || p.originalStageId === process.currentStageId);
        }

        if (!currentStageConfig) throw new Error("Invalid stage configuration");

        const isMatch = args.stageId === currentStageConfig._id || args.stageId === currentStageConfig.id || args.stageId === currentStageConfig.originalStageId;

        if (!isMatch) {
            throw new Error(`Stage mismatch. You are trying to submit to ${args.stageId} but process is at ${process.currentStageId}`);
        }

        // 2. Validate Data
        const formConfig = currentStageConfig.config?.formConfig || currentStageConfig.formConfig;
        if (formConfig) {
            for (const field of formConfig) {
                if (field.required && (args.data[field.id] === undefined || args.data[field.id] === "")) {
                    throw new Error(`Field ${field.label} is required.`);
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

        const updates: any = {
            data: newStageData,
            updatedAt: Date.now(),
        };

        if (nextStage) {
            updates.currentStageId = nextStage._id;
        } else {
            // End of pipeline
        }

        await ctx.db.patch(process._id, updates);

        // --- Trigger Logic ---
        const values = Object.values(args.data);
        if (values.includes("accept") || values.includes("decline")) {
            await ctx.scheduler.runAfter(0, api.emails.sendEmail, {
                to: user.email,
                subject: values.includes("accept") ? "Offer Accepted! 🎉" : "Offer Update",
                template: "decision_acknowledgment",
                payload: {
                    name: user.name,
                    decision: values.includes("accept") ? "ACCEPTED" : "DECLINED",
                    stage: currentStageConfig.name
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
                stageId: args.stageId,
                nextStageId: updates.currentStageId,
            },
            metadata: { stageName: currentStageConfig.name }
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
