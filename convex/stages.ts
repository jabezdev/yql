import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ensureAdmin } from "./auth";

/**
 * Creates a reusable stage template.
 */
export const createTemplate = mutation({
    args: {
        name: v.string(),
        type: v.string(),
        description: v.optional(v.string()),
        config: v.any(),
        automations: v.optional(v.array(v.object({
            trigger: v.string(),
            action: v.string(),
        }))),
        assignees: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        return await ctx.db.insert("stage_templates", args);
    },
});

/**
 * Lists all available templates.
 */
export const listTemplates = query({
    args: {},
    handler: async (ctx) => {
        // Admin only for now? Or reviewers too?
        // await ensureAdmin(ctx); 
        return await ctx.db.query("stage_templates").collect();
    },
});

/**
 * Adds a stage to a cohort.
 * Can be based on a template or created from scratch.
 * "Copy on Write" logic: We create a new stage record.
 */
export const addStageToCohort = mutation({
    args: {
        cohortId: v.id("cohorts"),
        templateId: v.optional(v.id("stage_templates")),
        // Overrides or raw config if no template
        name: v.string(),
        type: v.string(),
        description: v.optional(v.string()),
        config: v.any(),
        automations: v.optional(v.array(v.object({
            trigger: v.string(),
            action: v.string(),
        }))),
        assignees: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        // 1. Create the Stage Instance
        const stageId = await ctx.db.insert("stages", {
            cohortId: args.cohortId,
            name: args.name,
            type: args.type,
            config: args.config, // Snapshotting the config
            automations: args.automations,
            assignees: args.assignees,
            sourceTemplateId: args.templateId,
            // originalStageId can be generated if needed for migration compatibility, usually UI handles this
        });

        // 2. Link to Cohort (Append to order)
        const cohort = await ctx.db.get(args.cohortId);
        if (!cohort) throw new Error("Cohort not found");

        const currentStageIds = cohort.stageIds || [];
        await ctx.db.patch(args.cohortId, {
            stageIds: [...currentStageIds, stageId],
        });

        return stageId;
    },
});

/**
 * Reorders stages in a cohort.
 */
export const reorderStages = mutation({
    args: {
        cohortId: v.id("cohorts"),
        stageIds: v.array(v.id("stages")),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        // Verify ownership/integrity if needed
        await ctx.db.patch(args.cohortId, {
            stageIds: args.stageIds,
        });
    },
});

/**
 * Updates a specific stage instance.
 * Does NOT affect the template it came from.
 */
export const updateStage = mutation({
    args: {
        stageId: v.id("stages"),
        name: v.optional(v.string()),
        config: v.optional(v.any()), // Partial updates might be tricky with any, usually replace
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
 * Removes a stage from a cohort.
 * Also removes it from the cohort's ordered list.
 */
export const deleteStage = mutation({
    args: {
        stageId: v.id("stages"),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        const stage = await ctx.db.get(args.stageId);
        if (!stage) return;

        // Remove from cohort list
        const cohort = await ctx.db.get(stage.cohortId);
        if (cohort && cohort.stageIds) {
            await ctx.db.patch(stage.cohortId, {
                stageIds: cohort.stageIds.filter(id => id !== args.stageId)
            });
        }

        // Delete the stage record
        await ctx.db.delete(args.stageId);
    },
});

/**
 * Fetches stages for a cohort in the correct order.
 */
export const getCohortStages = query({
    args: { cohortId: v.id("cohorts") },
    handler: async (ctx, args) => {
        const cohort = await ctx.db.get(args.cohortId);
        if (!cohort) return null;

        if (!cohort.stageIds || cohort.stageIds.length === 0) {
            return [];
        }

        // Fetch all stages (could use Promise.all or similar)
        // Convex `getAll` is efficient
        // Note: stageIds might contain IDs that were deleted if we aren't careful, 
        // filter nulls.
        const stages = await Promise.all(cohort.stageIds.map(id => ctx.db.get(id)));
        return stages.filter(s => s !== null);
    },
});
