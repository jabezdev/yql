import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const migratePipelines = mutation({
    args: {},
    handler: async (ctx) => {
        const cohorts = await ctx.db.query("cohorts").collect();
        let migratedCount = 0;

        for (const cohort of cohorts) {
            // Skip if already migrated or no pipeline
            if (cohort.stageIds && cohort.stageIds.length > 0) continue;
            if (!cohort.pipeline || cohort.pipeline.length === 0) continue;

            console.log(`Migrating cohort: ${cohort.name}`);
            const newStageIds = [];

            for (const step of cohort.pipeline) {
                const stageId = await ctx.db.insert("stages", {
                    cohortId: cohort._id,
                    name: step.name,
                    type: step.type,
                    config: step.formConfig ? { formConfig: step.formConfig } : {}, // Map formConfig to generic config
                    automations: step.automations,
                    assignees: step.assignees,
                    originalStageId: step.id, // Keep old ID for reference
                });
                newStageIds.push(stageId);
            }

            await ctx.db.patch(cohort._id, {
                stageIds: newStageIds,
            });
            migratedCount++;
        }

        return `Migrated ${migratedCount} cohorts.`;
    },
});
