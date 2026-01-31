import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ensureAdmin } from "./auth";

export const getActiveProgram = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("programs")
            .withIndex("by_active", (q) => q.eq("isActive", true))
            .first();
    },
});

export const getAllPrograms = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("programs").collect();
    }
});

export const createProgram = mutation({
    args: {
        name: v.string(),
        slug: v.string(),
        startDate: v.number(),
        endDate: v.optional(v.number()),
        openPositions: v.optional(v.array(v.object({
            committee: v.string(),
            roles: v.array(v.string())
        }))),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        // Enforce uniqueness of slug
        const existing = await ctx.db.query("programs").withIndex("by_slug", q => q.eq("slug", args.slug)).first();
        if (existing) throw new Error("Program slug already exists.");

        const programId = await ctx.db.insert("programs", {
            ...args,
            isActive: false,
            stageIds: [] // Initialize empty
        });

        return programId;
    }
});

export const updateProgram = mutation({
    args: {
        programId: v.id("programs"),
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
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        const { programId, ...updates } = args;

        if (args.isActive) {
            const others = await ctx.db.query("programs").withIndex("by_active", q => q.eq("isActive", true)).collect();
            for (const c of others) {
                if (c._id !== programId) {
                    await ctx.db.patch(c._id, { isActive: false });
                }
            }
        }
        await ctx.db.patch(programId, {
            ...updates,
        });
    }
});
