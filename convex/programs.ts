import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ensureAdmin, getViewer } from "./auth";
import { createAuditLog } from "./auditLog";
import { isValidProgramType, PROGRAM_TYPES } from "./lib/constants";

/**
 * Gets the currently active program
 */
export const getActiveProgram = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("programs")
            .withIndex("by_active", (q) => q.eq("isActive", true))
            .first();
    },
});

/**
 * Gets all programs (officer+ access)
 */
export const getAllPrograms = query({
    args: { programType: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        // Require at least officer level to view all programs
        if (!user || (user.clearanceLevel ?? 0) < 3) {
            throw new Error("Unauthorized: Officer access required");
        }

        if (args.programType) {
            return await ctx.db
                .query("programs")
                .withIndex("by_type", (q) => q.eq("programType", args.programType))
                .collect();
        }
        return await ctx.db.query("programs").collect();
    }
});

/**
 * Creates a new program
 */
export const createProgram = mutation({
    args: {
        name: v.string(),
        slug: v.string(),
        programType: v.optional(v.string()), // recruitment_cycle, survey_campaign, etc.
        startDate: v.number(),
        endDate: v.optional(v.number()),
        config: v.optional(v.any()), // Type-specific configuration
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        // Validate program type if provided
        if (args.programType && !isValidProgramType(args.programType)) {
            throw new Error(`Invalid program type: ${args.programType}`);
        }

        // Enforce uniqueness of slug
        const existing = await ctx.db
            .query("programs")
            .withIndex("by_slug", q => q.eq("slug", args.slug))
            .first();
        if (existing) throw new Error("Program slug already exists.");

        const programId = await ctx.db.insert("programs", {
            ...args,
            programType: args.programType || PROGRAM_TYPES.GENERIC,
            isActive: false,
            stageIds: []
        });

        // Audit Log
        await createAuditLog(ctx, {
            userId: admin._id,
            action: "program.create",
            entityType: "programs",
            entityId: programId,
            changes: { after: args }
        });

        return programId;
    }
});

/**
 * Updates a program
 */
export const updateProgram = mutation({
    args: {
        programId: v.id("programs"),
        isActive: v.optional(v.boolean()),
        name: v.optional(v.string()),
        slug: v.optional(v.string()),
        programType: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        config: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);
        const { programId, ...updates } = args;

        const program = await ctx.db.get(programId);
        if (!program) throw new Error("Program not found");

        // Validate program type if being updated
        if (args.programType && !isValidProgramType(args.programType)) {
            throw new Error(`Invalid program type: ${args.programType}`);
        }

        // If activating, deactivate others (only one active at a time)
        if (args.isActive) {
            const others = await ctx.db
                .query("programs")
                .withIndex("by_active", q => q.eq("isActive", true))
                .collect();
            for (const c of others) {
                if (c._id !== programId) {
                    await ctx.db.patch(c._id, { isActive: false });
                }
            }
        }

        await ctx.db.patch(programId, updates);

        // Audit Log
        await createAuditLog(ctx, {
            userId: admin._id,
            action: "program.update",
            entityType: "programs",
            entityId: programId,
            changes: {
                before: { isActive: program.isActive },
                after: updates
            }
        });
    }
});

