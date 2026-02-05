
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { SYSTEM_ROLES } from "../core/constants";

/**
 * Migration: Backfill requiredRoleLevel for all processes.
 * Run this once via dashboard or CLI.
 */
export const run = internalMutation({
    args: {
        batchSize: v.optional(v.number()),
        cursor: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const batchSize = args.batchSize || 100;

        // Paginate over processes
        const processQuery = ctx.db.query("processes");
        const results = await processQuery.paginate({
            cursor: args.cursor || null,
            numItems: batchSize
        });

        let updatedCount = 0;

        for (const process of results.page) {
            // calculated field if missing
            if (process.requiredRoleLevel === undefined) {
                let level = 100; // Default Restricted

                if (process.programId) {
                    const program = await ctx.db.get(process.programId);
                    if (program) {
                        level = calculateRequiredRoleLevel(program);
                    }
                } else {
                    // Orphaned processes -> Default to Admin Only (100) or keep as is?
                    // Let's safe fail to 100.
                }

                await ctx.db.patch(process._id, {
                    requiredRoleLevel: level
                });
                updatedCount++;
            }
        }

        return {
            updatedCount,
            isDone: results.isDone,
            continueCursor: results.continueCursor,
        };
    }
});

/**
 * Helper strictly copied from engine/processes.ts to ensure consistency
 */
function calculateRequiredRoleLevel(program: any): number {
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
        const isVisible = config?.visible !== false;

        if (isVisible) return val;
    }

    return 100;
}
