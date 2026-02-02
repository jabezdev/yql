import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ensureAdmin } from "./auth";
import { getBlockConfigValidator, hasBlockValidator } from "./validators/blocks";

function validateBlockConfig(type: string, config: unknown): void {
    if (!hasBlockValidator(type)) {
        console.warn(`[Block Validation] No validator for block type: ${type}`);
        return;
    }

    const validator = getBlockConfigValidator(type);
    if (!validator) return;

    if (config === null || config === undefined) {
        throw new Error(`Block config cannot be null or undefined for type: ${type}`);
    }

    if (typeof config !== 'object') {
        throw new Error(`Block config must be an object for type: ${type}`);
    }
}

export const createBlock = mutation({
    args: {
        type: v.string(),
        name: v.optional(v.string()),
        config: v.any(),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        validateBlockConfig(args.type, args.config);
        return await ctx.db.insert("block_instances", { ...args, version: 1 });
    },
});

export const updateBlock = mutation({
    args: {
        blockId: v.id("block_instances"),
        config: v.optional(v.any()),
        name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        const { blockId, ...updates } = args;

        const block = await ctx.db.get(blockId);
        if (!block) throw new Error("Block not found");

        if (args.config !== undefined) {
            validateBlockConfig(block.type, args.config);
        }

        await ctx.db.patch(blockId, {
            ...updates,
            version: (block.version || 1) + 1,
        });
    },
});

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
            parentId: original._id,
        });

        return newId;
    },
});

export const getStageBlocks = query({
    args: {
        stageId: v.id("stages"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return []; // Not authenticated
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user) {
            return [];
        }

        const stage = await ctx.db.get(args.stageId);
        if (!stage || !stage.blockIds) return [];

        const program = await ctx.db.get(stage.programId);
        if (!program) return [];

        const isAdminOrReviewer = ['admin', 'manager', 'lead', 'officer'].includes(user.systemRole || "") || user.systemRole === "admin";

        // Check Access
        if (!isAdminOrReviewer) {
            // Check if user has an active process (application) for this program
            const hasProcess = await ctx.db
                .query("processes")
                .withIndex("by_user", (q) => q.eq("userId", user._id))
                .filter((q) => q.eq(q.field("programId"), stage.programId))
                .first();

            if (!hasProcess) {
                return [];
            }
        }

        const blocks = await Promise.all(stage.blockIds.map(id => ctx.db.get(id)));
        const validBlocks = blocks.filter(b => b !== null);

        if (!isAdminOrReviewer) {
            const userRole = user.systemRole || "guest"; // Simple role resolution for now, can be improved
            const internalBlockTypes = ['review_rubric', 'decision_gate', 'auto_score'];

            return validBlocks.filter(block => {
                // Phase 5: Check Granular Access
                if (block.roleAccess) {
                    const rule = block.roleAccess.find(r => r.roleSlug === userRole);
                    if (rule && rule.canView === false) return false;
                    // If rule exists and canView is true, or no rule exists (default visible), continue
                }
                return true;
            }).map(block => {
                if (internalBlockTypes.includes(block.type)) {
                    return {
                        ...block,
                        config: { _internal: true },
                    };
                }
                if (block.type === 'access_gate' && block.config?.passcode) {
                    return {
                        ...block,
                        config: { ...block.config, passcode: undefined },
                    };
                }
                // Mask editability if needed (can be used by UI)
                if (block.roleAccess) {
                    const rule = block.roleAccess.find(r => r.roleSlug === userRole);
                    if (rule && rule.canEdit === false) {
                        return { ...block, _readOnly: true }; // UI hint
                    }
                }
                return block;
            });
        }

        return validBlocks;
    },
});

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

export const duplicateBlock = mutation({
    args: {
        blockId: v.id("block_instances"),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        const original = await ctx.db.get(args.blockId);
        if (!original) throw new Error("Block not found");

        const newId = await ctx.db.insert("block_instances", {
            type: original.type,
            name: original.name,
            config: original.config,
            version: 1,
            parentId: original._id,
        });

        return newId;
    },
});
