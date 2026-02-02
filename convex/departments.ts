import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ensureAdmin, getViewer } from "./auth";
import { createAuditLog } from "./auditLog";

// ============================================
// QUERIES
// ============================================

/**
 * Get all departments (for dropdowns, org charts)
 */
export const getAllDepartments = query({
    args: { includeInactive: v.optional(v.boolean()) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        let departments;
        if (args.includeInactive) {
            departments = await ctx.db.query("departments").collect();
        } else {
            departments = await ctx.db
                .query("departments")
                .withIndex("by_active", (q) => q.eq("isActive", true))
                .collect();
        }

        // Filter out soft-deleted
        return departments.filter(d => !d.isDeleted).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    },
});

/**
 * Get a single department by ID
 */
export const getDepartment = query({
    args: { departmentId: v.id("departments") },
    handler: async (ctx, args) => {
        const dept = await ctx.db.get(args.departmentId);
        if (!dept || dept.isDeleted) return null;
        return dept;
    },
});

/**
 * Get department by slug
 */
export const getDepartmentBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        const dept = await ctx.db
            .query("departments")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();

        if (!dept || dept.isDeleted) return null;
        return dept;
    },
});

/**
 * Get child departments (for hierarchy)
 */
export const getChildDepartments = query({
    args: { parentId: v.optional(v.id("departments")) },
    handler: async (ctx, args) => {
        return await ctx.db
        const depts = await ctx.db
            .query("departments")
            .withIndex("by_parent", (q) => q.eq("parentDepartmentId", args.parentId))
            .collect();
        return depts.filter(d => !d.isDeleted);
    },
});

/**
 * Get department members
 */
export const getDepartmentMembers = query({
    args: { departmentId: v.id("departments") },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user || !['admin', 'manager', 'lead', 'officer'].includes(user.systemRole || "")) {
            throw new Error("Unauthorized: Officer access required");
        }

        // Get all users with this department in their positions
        const allUsers = await ctx.db.query("users").collect();

        return allUsers.filter((u) => {
            if (!u.profile?.positions) return false;
            return u.profile.positions.some(
                (p) => p.departmentId === args.departmentId
            );
        });
    },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new department
 */
export const createDepartment = mutation({
    args: {
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        headId: v.optional(v.id("users")),
        parentDepartmentId: v.optional(v.id("departments")),
        order: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        // Check slug uniqueness
        const existing = await ctx.db
            .query("departments")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();

        if (existing) {
            throw new Error(`Department with slug '${args.slug}' already exists`);
        }

        const departmentId = await ctx.db.insert("departments", {
            ...args,
            isActive: true,
        });

        // Audit Log
        await createAuditLog(ctx, {
            userId: admin._id,
            action: "department.create",
            entityType: "departments",
            entityId: departmentId,
            changes: { after: args },
        });

        return departmentId;
    },
});

/**
 * Update a department
 */
export const updateDepartment = mutation({
    args: {
        departmentId: v.id("departments"),
        name: v.optional(v.string()),
        slug: v.optional(v.string()),
        description: v.optional(v.string()),
        headId: v.optional(v.id("users")),
        parentDepartmentId: v.optional(v.id("departments")),
        isActive: v.optional(v.boolean()),
        order: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        const department = await ctx.db.get(args.departmentId);
        if (!department) throw new Error("Department not found");

        // If changing slug, check uniqueness
        if (args.slug && args.slug !== department.slug) {
            const existing = await ctx.db
                .query("departments")
                .withIndex("by_slug", (q) => q.eq("slug", args.slug!))
                .first();
            if (existing) {
                throw new Error(`Department with slug '${args.slug}' already exists`);
            }
        }

        // Prevent circular hierarchy
        if (args.parentDepartmentId === args.departmentId) {
            throw new Error("A department cannot be its own parent");
        }

        const { departmentId, ...updates } = args;

        // Build before/after for audit
        const before = { ...department };

        await ctx.db.patch(departmentId, updates);

        // Audit Log
        await createAuditLog(ctx, {
            userId: admin._id,
            action: "department.update",
            entityType: "departments",
            entityId: departmentId,
            changes: { before, after: updates },
        });
    },
});

/**
 * Delete a department (soft delete - sets isActive to false)
 */
export const deleteDepartment = mutation({
    args: { departmentId: v.id("departments") },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        const department = await ctx.db.get(args.departmentId);
        if (!department) throw new Error("Department not found");

        // Check for child departments
        const children = await ctx.db
            .query("departments")
            .withIndex("by_parent", (q) =>
                q.eq("parentDepartmentId", args.departmentId)
            )
            .collect();

        if (children.length > 0) {
            throw new Error(
                "Cannot delete department with child departments. Delete or reassign children first."
            );
        }

        // Soft delete
        await ctx.db.patch(args.departmentId, {
            isActive: false,
            isDeleted: true,
            deletedAt: Date.now()
        });

        // Audit Log
        await createAuditLog(ctx, {
            userId: admin._id,
            action: "department.delete",
            entityType: "departments",
            entityId: args.departmentId,
            changes: { before: department },
        });
    },
});

/**
 * Reorder departments
 */
export const reorderDepartments = mutation({
    args: {
        orderedIds: v.array(v.id("departments")),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        for (let i = 0; i < args.orderedIds.length; i++) {
            await ctx.db.patch(args.orderedIds[i], { order: i });
        }
    },
});
