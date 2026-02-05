import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { ensureAdmin } from "./auth";
import { createAuditLog } from "./auditLog";

/**
 * ============================================
 * DEPARTMENT MANAGEMENT
 * ============================================
 */

/*
 * Dead code removed: createDepartment, updateDepartment
 * Logic moved to convex/core/departments.ts
 */

/**
 * ============================================
 * SYSTEM TRIGGER & NOTIFICATION CONFIG
 * ============================================
 * This handles "Meta-Use Case 6: System Notification Configuration"
 * effectively by managing automations on a "System Program" or global settings.
 */

export const updateSystemNotificationTriggers = mutation({
    args: {
        // We'll manage this as a specific system setting key
        triggers: v.array(v.object({
            event: v.string(), // "user_signup", "process_complete"
            template: v.string(),
            recipients: v.array(v.string()), // ["admin", "manager"]
        }))
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);
        if (!admin) throw new Error("Unauthorized");

        // Store in system_settings
        const existing = await ctx.db.query("system_settings")
            .withIndex("by_key", q => q.eq("key", "notification_triggers"))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                value: args.triggers,
                updatedAt: Date.now(),
                updatedBy: admin._id
            });
        } else {
            await ctx.db.insert("system_settings", {
                key: "notification_triggers",
                value: args.triggers,
                updatedAt: Date.now(),
                updatedBy: admin._id
            });
        }

        // Audit
        await createAuditLog(ctx, {
            userId: admin._id,
            action: "system.update_settings",
            entityType: "system",
            entityId: "notification_triggers",
            changes: { after: args.triggers }
        });
    }
});
