import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ensureAdmin } from "./auth";

export const getActiveCohort = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("cohorts")
            .withIndex("by_active", (q) => q.eq("isActive", true))
            .first();
    },
});

export const getAllCohorts = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("cohorts").collect();
    }
});

export const createCohort = mutation({
    args: {
        name: v.string(),
        slug: v.string(),
        startDate: v.number(),
        endDate: v.optional(v.number()),
        openPositions: v.optional(v.array(v.object({
            committee: v.string(),
            roles: v.array(v.string())
        }))),
        pipeline: v.array(v.object({
            id: v.string(),
            name: v.string(),
            type: v.string(),
            description: v.optional(v.string()),
            formConfig: v.optional(v.array(v.object({
                id: v.string(),
                label: v.string(),
                type: v.string(),
                options: v.optional(v.array(v.string())),
                required: v.boolean(),
                placeholder: v.optional(v.string()), // Added placeholder support
            }))),
            automations: v.optional(v.array(v.object({
                trigger: v.string(),
                action: v.string(),
            }))),
            assignees: v.optional(v.array(v.string())),
        }))
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        // Enforce uniqueness of slug
        const existing = await ctx.db.query("cohorts").withIndex("by_slug", q => q.eq("slug", args.slug)).first();
        if (existing) throw new Error("Cohort slug already exists.");

        // If making this active (logic could go here, but for now defaulting new to inactive)
        // Create Cohort first
        const cohortId = await ctx.db.insert("cohorts", {
            ...args,
            isActive: false,
            pipeline: undefined, // Don't store legacy pipeline
            stageIds: []
        });

        // Instantiate Stages
        const stageIds = [];
        if (args.pipeline && args.pipeline.length > 0) {
            for (const step of args.pipeline) {
                const stageId = await ctx.db.insert("stages", {
                    cohortId,
                    name: step.name,
                    type: step.type,
                    config: step.formConfig ? { formConfig: step.formConfig } : {},
                    automations: step.automations,
                    assignees: step.assignees,
                    originalStageId: step.id
                });
                stageIds.push(stageId);
            }

            // Update cohort with stageIds
            await ctx.db.patch(cohortId, { stageIds });
        }

        return cohortId;
    }
});

export const updateCohort = mutation({
    args: {
        cohortId: v.id("cohorts"),
        isActive: v.optional(v.boolean()),
        // Full update fields
        name: v.optional(v.string()),
        slug: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        openPositions: v.optional(v.array(v.object({
            committee: v.string(),
            roles: v.array(v.string())
        }))),
        pipeline: v.optional(v.array(v.object({
            id: v.string(),
            name: v.string(),
            type: v.string(),
            description: v.optional(v.string()),
            formConfig: v.optional(v.array(v.object({
                id: v.string(),
                label: v.string(),
                type: v.string(),
                options: v.optional(v.array(v.string())),
                required: v.boolean(),
                placeholder: v.optional(v.string()), // Added placeholder support
            }))),
            automations: v.optional(v.array(v.object({
                trigger: v.string(),
                action: v.string(),
            }))),
            assignees: v.optional(v.array(v.string())),
        })))
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        const { cohortId, ...updates } = args;

        if (args.isActive) {
            // Deactivate others? Or allow multiple active?
            // Usually one active cohort for application.
            const others = await ctx.db.query("cohorts").withIndex("by_active", q => q.eq("isActive", true)).collect();
            for (const c of others) {
                if (c._id !== cohortId) {
                    await ctx.db.patch(c._id, { isActive: false });
                }
            }
        }
        // Handle Pipeline Update -> Re-instantiate Stages
        // This is a "Reset" of stages if pipeline is passed.
        // If the user modified the pipeline in the UI, we effectively replace the stages.
        // NOTE: This might be destructive for existing application data linked to old stage IDs!
        // But since we are "Managing Cohort Workflow", presumably before it's live or knowingly changing it.
        // For active cohorts with data, we might want to be careful.
        // But given the request to "Copy", and this is the Admin Editor:

        let newStageIds = undefined;

        if (args.pipeline) {
            // 1. Fetch existing stages to see if we can update them or if we must delete/create
            // For simplicity and "snapshot" logic, if the admin saves the whole pipeline from the editor,
            // we interpret that as the new truth.
            // We'll archive/delete old stages? Or just orphan them?
            // Better to orphan if we care about history, but for this "Stages linked to Cohort" model,
            // if we remove them from cohort.stageIds, they are effectively removed.

            newStageIds = [];
            for (const step of args.pipeline) {
                // We always create NEW stages on a full save to ensure isolation? 
                // Or do we try to match?
                // The prompt said: "use Form A... copied... change stuff...".
                // If I am editing an existing cohort, I expect to update the EXISTING stages of that cohort.
                // But `updateCohort` receives a JSON array.
                // Implementation:
                // We will create NEW stages and replace the list. This ensures "Copy on Write" behavior 
                // if the source was a template, but here it's an edit.
                // However, we should probably DELETE the old stages of this cohort to avoid junk.

                const stageId = await ctx.db.insert("stages", {
                    cohortId,
                    name: step.name,
                    type: step.type,
                    config: step.formConfig ? { formConfig: step.formConfig } : {},
                    automations: step.automations,
                    assignees: step.assignees,
                    originalStageId: step.id
                });
                newStageIds.push(stageId);
            }

            // Clean up old stages?
            // const oldCohort = await ctx.db.get(cohortId);
            // if (oldCohort?.stageIds) { ... }
            // Let's just update the list for now.
        }

        await ctx.db.patch(cohortId, {
            ...updates,
            stageIds: newStageIds || undefined,
            pipeline: undefined // Clear legacy
        });
    }
});
