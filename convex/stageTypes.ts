import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ensureAdmin } from "./auth";

export const getAll = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("stage_types").collect();
    },
});

export const create = mutation({
    args: {
        token: v.string(),
        key: v.string(),
        label: v.string(),
        description: v.optional(v.string()),
        icon: v.string(),
        kind: v.string(),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx, args.token);
        const { token, ...data } = args;
        const existing = await ctx.db.query("stage_types").withIndex("by_key", q => q.eq("key", args.key)).first();
        if (existing) throw new Error("Stage type key already exists");
        return await ctx.db.insert("stage_types", data);
    }
});

export const update = mutation({
    args: {
        token: v.string(),
        id: v.id("stage_types"),
        label: v.optional(v.string()),
        description: v.optional(v.string()),
        icon: v.optional(v.string()),
        kind: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx, args.token);
        const { id, token, ...updates } = args;
        await ctx.db.patch(id, updates);
    }
});

export const remove = mutation({
    args: { id: v.id("stage_types"), token: v.string() },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx, args.token);
        await ctx.db.delete(args.id);
    }
});

export const seedDefaults = mutation({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx, args.token);
        // Only seed if empty to avoid duplicates/overwrite
        const existing = await ctx.db.query("stage_types").take(1);
        if (existing.length > 0) return;

        const defaults = [
            { key: 'static', label: 'Static Info', kind: 'static', icon: 'LayoutTemplate', description: 'Display text content to the applicant.' },
            { key: 'form', label: 'Form', kind: 'form', icon: 'FileText', description: 'Collect data via input fields.' },
            { key: 'interview', label: 'Interview', kind: 'static', icon: 'Mic', description: 'Schedule or join an interview.' },
            { key: 'agreement', label: 'Agreement', kind: 'form', icon: 'PenTool', description: 'Sign a document or agree to terms.' },
            { key: 'completed', label: 'Completed', kind: 'completed', icon: 'CheckCircle2', description: 'End of pipeline.' },
        ];

        for (const t of defaults) {
            await ctx.db.insert("stage_types", t);
        }
    }
});
