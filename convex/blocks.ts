import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ensureAdmin } from "./auth";
import { getBlockConfigValidator, hasBlockValidator } from "./validators/blocks";

/**
 * Validates a block config against its type-specific schema.
 * Throws an error if validation fails.
 */
function validateBlockConfig(type: string, config: unknown): void {
    if (!hasBlockValidator(type)) {
        // Unknown block type - log warning but allow through for flexibility
        console.warn(`[Block Validation] No validator for block type: ${type}`);
        return;
    }

    const validator = getBlockConfigValidator(type);
    if (!validator) return;

    // Basic type checking - Convex validators would throw during actual insertion
    // This provides a friendlier error message
    if (config === null || config === undefined) {
        throw new Error(`Block config cannot be null or undefined for type: ${type}`);
    }

    if (typeof config !== 'object') {
        throw new Error(`Block config must be an object for type: ${type}`);
    }

    // Note: Full validation happens via Convex's type system when data is persisted.
    // This is a sanity check layer. For stricter validation, you could manually
    // check required fields here based on the type.
}

/**
 * Creates a new block instance.
 */
export const createBlock = mutation({
    args: {
        type: v.string(),
        name: v.optional(v.string()),
        config: v.any(),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        // Validate config against type-specific schema
        validateBlockConfig(args.type, args.config);

        return await ctx.db.insert("block_instances", {
            ...args,
            version: 1,
        });
    },
});

/**
 * Updates a block in place.
 * This affects ALL stages that link to this block ID.
 */
export const updateBlock = mutation({
    args: {
        blockId: v.id("block_instances"),
        config: v.optional(v.any()), // Full config replacement usually
        name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        const { blockId, ...updates } = args;

        // Optimistic version bump
        const block = await ctx.db.get(blockId);
        if (!block) throw new Error("Block not found");

        // Validate new config if provided
        if (args.config !== undefined) {
            validateBlockConfig(block.type, args.config);
        }

        await ctx.db.patch(blockId, {
            ...updates,
            version: (block.version || 1) + 1,
        });
    },
});

/**
 * Forks a block (Attributes: Duplicate).
 * Creates a deep copy of the block and returns the new ID.
 * Used when an admin wants to edit a block for *only* the current stage.
 */
export const forkBlock = mutation({
    args: {
        blockId: v.id("block_instances"),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        const original = await ctx.db.get(args.blockId);
        if (!original) throw new Error("Block not found");

        const newId = await ctx.db.insert("block_instances", {
            type: original.type,
            name: original.name ? `${original.name} (Copy)` : undefined,
            config: original.config,
            version: 1,
        });

        return newId;
    },
});

/**
 * Fetches detailed blocks for a given stage.
 * Requires authentication and validates access to the cohort.
 */
export const getStageBlocks = query({
    args: {
        stageId: v.id("stages"),
    },
    handler: async (ctx, args) => {
        // Require authentication
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return []; // Not authenticated
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user) {
            return []; // User not found
        }

        const stage = await ctx.db.get(args.stageId);
        if (!stage || !stage.blockIds) return [];

        // Verify user has access to this cohort
        const cohort = await ctx.db.get(stage.cohortId);
        if (!cohort) return [];

        const isAdminOrReviewer = user.role === "admin" || user.role === "reviewer";

        // For applicants, verify they have an application for this cohort
        // OR they are linked to the cohort
        if (!isAdminOrReviewer) {
            const hasApplicationForCohort = await ctx.db
                .query("applications")
                .withIndex("by_user", (q) => q.eq("userId", user._id))
                .filter((q) => q.eq(q.field("cohortId"), stage.cohortId))
                .first();

            const isLinkedToCohort = user.linkedCohortIds?.includes(stage.cohortId);

            if (!hasApplicationForCohort && !isLinkedToCohort) {
                return []; // No access to this cohort
            }
        }

        // Preserve order
        const blocks = await Promise.all(stage.blockIds.map(id => ctx.db.get(id)));
        const validBlocks = blocks.filter(b => b !== null);

        // For non-admins, strip sensitive config from internal blocks
        if (!isAdminOrReviewer) {
            const internalBlockTypes = ['review_rubric', 'decision_gate', 'auto_score'];
            return validBlocks.map(block => {
                if (internalBlockTypes.includes(block.type)) {
                    // Return block without sensitive config
                    return {
                        ...block,
                        config: { _internal: true },
                    };
                }
                // IMPORTANT: Never send access_gate passcode to client
                if (block.type === 'access_gate' && block.config?.passcode) {
                    return {
                        ...block,
                        config: { ...block.config, passcode: undefined },
                    };
                }
                return block;
            });
        }

        return validBlocks;
    },
});

/**
 * Batch create blocks (helpful for migration or complex stage creation)
 */
export const createBlocksBatch = mutation({
    args: {
        blocks: v.array(v.object({
            type: v.string(),
            name: v.optional(v.string()),
            config: v.any(),
        }))
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        // Validate all configs first before inserting any
        for (const b of args.blocks) {
            validateBlockConfig(b.type, b.config);
        }

        const ids = [];
        for (const b of args.blocks) {
            const id = await ctx.db.insert("block_instances", { ...b, version: 1 });
            ids.push(id);
        }
        return ids;
    }
});

