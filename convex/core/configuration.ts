import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { ensureAdmin } from "./auth";
import { createAuditLog } from "./auditLog";

/**
 * ============================================
 * DEPARTMENT MANAGEMENT
 * ============================================
 */

export const createDepartment = mutation({
    args: {
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        headId: v.optional(v.id("users")),
        managerIds: v.optional(v.array(v.id("users"))),
        parentDepartmentId: v.optional(v.id("departments")),
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        const existing = await ctx.db
            .query("departments")
            .withIndex("by_slug", q => q.eq("slug", args.slug))
            .first();

        if (existing) {
            throw new Error(`Department with slug "${args.slug}" already exists`);
        }

        const deptId = await ctx.db.insert("departments", {
            ...args,
            isActive: true,
            order: 0,
        });

        await createAuditLog(ctx, {
            userId: admin._id,
            action: "department.create",
            entityType: "departments",
            entityId: deptId,
            changes: { after: args }
        });

        return deptId;
    }
});

export const updateDepartment = mutation({
    args: {
        departmentId: v.id("departments"),
        name: v.optional(v.string()),
        slug: v.optional(v.string()), // Use with caution
        description: v.optional(v.string()),
        headId: v.optional(v.id("users")),
        managerIds: v.optional(v.array(v.id("users"))),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);
        const { departmentId, ...updates } = args;

        const dept = await ctx.db.get(departmentId);
        if (!dept) throw new Error("Department not found");

        await ctx.db.patch(departmentId, updates);

        await createAuditLog(ctx, {
            userId: admin._id,
            action: "department.update",
            entityType: "departments",
            entityId: departmentId,
            changes: {
                before: dept,
                after: updates
            }
        });
    }
});

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
