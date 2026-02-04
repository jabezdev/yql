import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { ensureAdmin } from "../core/auth";

/**
 * Creates a reusable stage template.
 */
export const createTemplate = mutation({
    args: {
        name: v.string(),
        type: v.string(),
        description: v.optional(v.string()),
        config: v.any(),
        blockIds: v.optional(v.array(v.id("block_instances"))),
        automations: v.optional(v.array(v.object({
            trigger: v.string(),
            action: v.string(),
        }))),
        assignees: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        return await ctx.db.insert("stage_templates", {
            ...args,
            assignees: [], // Default empty
        });
    },
});

/**
 * Lists all available templates.
 */
export const listTemplates = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("stage_templates").collect();
    },
});

/**
 * Adds a stage to a program.
 */
export const addStageToProgram = mutation({
    args: {
        programId: v.id("programs"),
        templateId: v.optional(v.id("stage_templates")),
        // Overrides or raw config if no template
        name: v.string(),
        type: v.string(),
        description: v.optional(v.string()),
        config: v.any(),
        blockIds: v.optional(v.array(v.id("block_instances"))),
        automations: v.optional(v.array(v.object({
            trigger: v.string(),
            action: v.string(),
        }))),
        assignees: v.optional(v.array(v.string())),
        originalStageId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        let templateConfig = null;
        if (args.templateId) {
            templateConfig = await ctx.db.get(args.templateId);
            if (!templateConfig) throw new Error("Template not found");
        }

        // 1. Prepare Block IDs (Deep Copy Strategy)
        const finalBlockIds: string[] = [];

        if (templateConfig && templateConfig.blockIds) {
            for (const blockId of templateConfig.blockIds) {
                const originalBlock = await ctx.db.get(blockId);
                if (originalBlock) {
                    const newBlockId = await ctx.db.insert("block_instances", {
                        type: originalBlock.type,
                        name: originalBlock.name,
                        config: originalBlock.config,
                        version: 1,
                        parentId: originalBlock._id,
                    });
                    finalBlockIds.push(newBlockId);
                }
            }
        }
        else if (args.blockIds) {
            finalBlockIds.push(...args.blockIds);
        }

        // 2. Create the Stage Instance
        const stageId = await ctx.db.insert("stages", {
            programId: args.programId,
            name: args.name,
            type: args.type,
            config: templateConfig ? templateConfig.config : args.config,
            blockIds: finalBlockIds as any,
            automations: args.automations,
            assignees: args.assignees,
            sourceTemplateId: args.templateId,
            originalStageId: args.originalStageId,
        });

        // 3. Link to Program (Append to order)
        const program = await ctx.db.get(args.programId);
        if (!program) throw new Error("Program not found");

        const currentStageIds = program.stageIds || [];
        await ctx.db.patch(args.programId, {
            stageIds: [...currentStageIds, stageId],
        });

        return stageId;
    },
});

/**
 * Reorders stages in a program.
 */
export const reorderStages = mutation({
    args: {
        programId: v.id("programs"),
        stageIds: v.array(v.id("stages")),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        await ctx.db.patch(args.programId, {
            stageIds: args.stageIds,
        });
    },
});

/**
 * Updates a specific stage instance.
 */
export const updateStage = mutation({
    args: {
        stageId: v.id("stages"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        config: v.optional(v.any()),
        blockIds: v.optional(v.array(v.id("block_instances"))),
        automations: v.optional(v.array(v.object({
            trigger: v.string(),
            action: v.string(),
        }))),
        assignees: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        const { stageId, ...updates } = args;
        await ctx.db.patch(stageId, updates);
    },
});

/**
 * Removes a stage from a program.
 * Also removes it from the program's ordered list.
 */
export const deleteStage = mutation({
    args: {
        stageId: v.id("stages"),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        const stage = await ctx.db.get(args.stageId);
        if (!stage) return;

        // Remove from program list
        const program = await ctx.db.get(stage.programId);
        if (program && program.stageIds) {
            await ctx.db.patch(stage.programId, {
                stageIds: program.stageIds.filter(id => id !== args.stageId)
            });
        }

        // Soft Delete the stage record
        await ctx.db.patch(args.stageId, {
            isDeleted: true,
            deletedAt: Date.now()
        });
    },
});

/**
 * Fetches stages for a program in the correct order.
 */
export const getProgramStages = query({
    args: { programId: v.id("programs") },
    handler: async (ctx, args) => {
        const program = await ctx.db.get(args.programId);
        if (!program) return null;

        if (!program.stageIds || program.stageIds.length === 0) {
            return [];
        }

        const stages = await Promise.all(program.stageIds.map(id => ctx.db.get(id)));
        return stages.filter(s => s !== null && !s.isDeleted);
    },
});

/**
 * Update role access configuration for a stage (Phase 4)
 */
export const updateStageRoleAccess = mutation({
    args: {
        stageId: v.id("stages"),
        roleAccess: v.array(v.object({
            roleSlug: v.string(),
            canView: v.boolean(),
            canSubmit: v.boolean(),
            canApprove: v.boolean(),
        })),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        const stage = await ctx.db.get(args.stageId);
        if (!stage || stage.isDeleted) {
            throw new Error("Stage not found");
        }

        await ctx.db.patch(args.stageId, {
            roleAccess: args.roleAccess,
        });

        return { success: true };
    },
});

/**
 * Fetches stages visible to the current user based on their role.
 * Returns stages with access mask.
 */
export const getVisibleProgramStages = query({
    args: { programId: v.id("programs") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", q => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user) return [];

        const roleSlug = user.systemRole || "guest";
        const isAdmin = user.systemRole === 'admin';

        const program = await ctx.db.get(args.programId);
        if (!program) return [];

        if (!program.stageIds || program.stageIds.length === 0) {
            return [];
        }

        const stages = await Promise.all(program.stageIds.map(id => ctx.db.get(id)));
        const activeStages = stages.filter(s => s !== null && !s.isDeleted);

        // Admin sees all with full access
        if (isAdmin) {
            return activeStages.map(stage => ({
                stage,
                access: { canView: true, canSubmit: true, canApprove: true },
            }));
        }

        // Filter and decorate by role access
        const visibleStages = [];
        for (const stage of activeStages) {
            if (!stage) continue;

            // Default access if no roleAccess configured
            let access = { canView: true, canSubmit: true, canApprove: false };

            if (stage.roleAccess) {
                const roleConfig = stage.roleAccess.find(ra => ra.roleSlug === roleSlug);
                if (roleConfig) {
                    // If explicitly configured and canView is false, skip
                    if (!roleConfig.canView) continue;
                    access = {
                        canView: roleConfig.canView,
                        canSubmit: roleConfig.canSubmit,
                        canApprove: roleConfig.canApprove,
                    };
                }
                // If no config for this role and there ARE roleAccess entries, default deny
                else if (stage.roleAccess.length > 0) {
                    continue;
                }
            }

            visibleStages.push({ stage, access });
        }

        return visibleStages;
    },
});
