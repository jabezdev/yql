import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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
        // Enforce uniqueness of slug
        const existing = await ctx.db.query("cohorts").withIndex("by_slug", q => q.eq("slug", args.slug)).first();
        if (existing) throw new Error("Cohort slug already exists.");

        // If making this active (logic could go here, but for now defaulting new to inactive)
        return await ctx.db.insert("cohorts", {
            ...args,
            isActive: false // Default to inactive
        });
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
        await ctx.db.patch(cohortId, updates);
    }
});
