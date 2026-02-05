import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { ensureAdmin } from "./auth";
import { createAuditLog } from "./auditLog";

/**
 * Get all system settings
 */
export const getSettings = query({
    args: {},
    handler: async (ctx) => {
        // Publicly readable? Maybe some? For now, simpler to allow read, restrict write.
        // Actually, frontend needs to know if maintenance mode is on.
        return await ctx.db.query("system_settings").collect();
    }
});

/**
 * Get a specific setting by key
 */
export const getSetting = query({
    args: { key: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("system_settings")
            .withIndex("by_key", q => q.eq("key", args.key))
            .first();
    }
});

/**
 * Update a system setting
 */
export const updateSetting = mutation({
    args: {
        key: v.string(),
        value: v.any(),
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);
        if (!admin) throw new Error("Unauthorized");

        const existing = await ctx.db
            .query("system_settings")
            .withIndex("by_key", q => q.eq("key", args.key))
            .first();

        let settingId;
        if (existing) {
            await ctx.db.patch(existing._id, {
                value: args.value,
                updatedAt: Date.now(),
                updatedBy: admin._id
            });
            settingId = existing._id;
        } else {
            settingId = await ctx.db.insert("system_settings", {
                key: args.key,
                value: args.value,
                updatedAt: Date.now(),
                updatedBy: admin._id
            });
        }

        // Audit Log
        await createAuditLog(ctx, {
            userId: admin._id,
            action: "system.update_setting",
            entityType: "system_settings",
            entityId: settingId,
            changes: {
                before: {},
                after: { key: args.key, value: args.value }
            }
        });

        return settingId;
    }
});
