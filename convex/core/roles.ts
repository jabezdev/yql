
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { ensureAdmin } from "./auth";

// Default Permissions with Granular Access
export const DEFAULT_ROLES = [
    {
        slug: "guest",
        name: "Guest",
        description: "External applicant or visitor.",
        uiPermissions: ["dashboard.view_recruitment"],
        permissions: [
            { resource: "processes", actions: ["read", "create"], scope: "own" },
            { resource: "events", actions: ["read"], scope: "own" },
            { resource: "goals", actions: ["read"], scope: "own" },
        ],
        defaultDashboardSlug: "guest",
        isSystemRole: true,
    },
    {
        slug: "contributor",
        name: "Contributor",
        description: "Non-member helper or volunteer.",
        uiPermissions: ["dashboard.view_member_portal"],
        permissions: [
            { resource: "processes", actions: ["read", "create", "update"], scope: "own" },
        ],
        defaultDashboardSlug: "guest", // or a constrained member view
        isSystemRole: true,
    },
    {
        slug: "alumni",
        name: "Alumni",
        description: "Former member.",
        uiPermissions: ["dashboard.view_member_portal"],
        permissions: [
            { resource: "processes", actions: ["read"], scope: "own" },
        ],
        defaultDashboardSlug: "member",
        isSystemRole: true,
    },
    {
        slug: "member",
        name: "Member",
        description: "Standard organization member.",
        uiPermissions: ["dashboard.view_member_portal", "dashboard.view_programs", "dashboard.view_surveys", "dashboard.view_goals"],
        permissions: [
            { resource: "processes", actions: ["read", "create", "update"], scope: "own" },
            { resource: "events", actions: ["read", "create"], scope: "department" },
            { resource: "users", actions: ["read"], scope: "all" },
            { resource: "departments", actions: ["read"], scope: "all" },
            { resource: "goals", actions: ["read", "create", "update"], scope: "own" },
            { resource: "reviews", actions: ["read", "create"], scope: "own" },
        ],
        defaultDashboardSlug: "member",
        isSystemRole: true,
    },
    {
        slug: "manager",
        name: "Manager",
        description: "Operational lead (Squad Lead, Project Manager).",
        uiPermissions: ["dashboard.view_member_portal", "dashboard.view_programs", "dashboard.manage_team"],
        permissions: [
            { resource: "processes", actions: ["read", "update"], scope: "department" },
            { resource: "users", actions: ["read"], scope: "all" },
            { resource: "users", actions: ["update"], scope: "department" },
            { resource: "events", actions: ["read", "create", "update", "delete"], scope: "department" },
            { resource: "reviews", actions: ["read", "create"], scope: "department" },
            { resource: "departments", actions: ["read"], scope: "all" },
            { resource: "goals", actions: ["read", "create", "update"], scope: "department" },
        ],
        defaultDashboardSlug: "manager",
        isSystemRole: true,
    },
    {
        slug: "lead",
        name: "Team Lead",
        description: "Strategic lead (Department Head, Director).",
        uiPermissions: ["dashboard.view_member_portal", "dashboard.view_programs", "dashboard.manage_department", "dashboard.view_analytics"],
        permissions: [
            { resource: "processes", actions: ["read", "update"], scope: "department" },
            { resource: "users", actions: ["read", "update", "delete"], scope: "department" },
            { resource: "events", actions: ["read", "create", "update", "delete"], scope: "department" },
            { resource: "reviews", actions: ["read", "create", "delete"], scope: "department" },
            { resource: "departments", actions: ["read", "update"], scope: "department" },
            { resource: "goals", actions: ["read", "create", "update"], scope: "department" },
        ],
        defaultDashboardSlug: "lead",
        isSystemRole: true,
    },
    {
        slug: "admin",
        name: "Administrator",
        description: "System owner with full access.",
        uiPermissions: ["dashboard.view_recruitment", "dashboard.view_member_portal", "system.manage_configuration", "system.manage_users", "dashboard.view_analytics"],
        permissions: [
            { resource: "processes", actions: ["read", "create", "update", "delete"], scope: "all" },
            { resource: "users", actions: ["read", "create", "update", "delete"], scope: "all" },
            { resource: "events", actions: ["read", "create", "update", "delete"], scope: "all" },
            { resource: "reviews", actions: ["read", "create", "update", "delete"], scope: "all" },
            { resource: "departments", actions: ["read", "create", "update", "delete"], scope: "all" },
            { resource: "programs", actions: ["read", "create", "update", "delete"], scope: "all" },
            { resource: "roles", actions: ["read", "create", "update"], scope: "all" },
            { resource: "goals", actions: ["read", "create", "update", "delete"], scope: "all" },
        ],
        defaultDashboardSlug: "admin",
        isSystemRole: true,
    }
];

export const seedRoles = mutation({
    args: {},
    handler: async (ctx) => {
        // await ensureAdmin(ctx); // Ideally restricted, but for initial seed we might need it open or check existing admin

        for (const roleDef of DEFAULT_ROLES) {
            const existing = await ctx.db.query("roles").withIndex("by_slug", q => q.eq("slug", roleDef.slug)).first();
            if (existing) {
                await ctx.db.patch(existing._id, {
                    name: roleDef.name,
                    description: roleDef.description,
                    uiPermissions: roleDef.uiPermissions,
                    defaultDashboardSlug: roleDef.defaultDashboardSlug
                });
            } else {
                await ctx.db.insert("roles", roleDef);
            }
        }
        return "Roles seeded successfully";
    }
});

export const getRole = query({
    args: { slug: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (!args.slug) return null;
        return await ctx.db.query("roles").withIndex("by_slug", q => q.eq("slug", args.slug!)).first();
    }
});

export const getMyPermissions = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return { role: "anon", permissions: [] };

        const user = await ctx.db.query("users").withIndex("by_tokenIdentifier", q => q.eq("tokenIdentifier", identity.tokenIdentifier)).first();
        if (!user || !user.systemRole) return { role: "guest", permissions: [] };

        const roleConfig = await ctx.db.query("roles").withIndex("by_slug", q => q.eq("slug", user.systemRole!)).first();

        // Fallback checks if role missing in DB but exists on user
        if (!roleConfig) {
            // Strict Mode: If role permissions are missing from DB, return empty/guest
            // This prevents "ghost" admin access via hardcoded fallbacks
            return { role: "guest", permissions: [] };
        }

        return {
            role: user.systemRole,
            permissions: roleConfig.uiPermissions
        };
    }
});

// ============================================
// ROLE CRUD MUTATIONS
// ============================================

/**
 * Get all roles (admin only)
 */
export const getAllRoles = query({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);
        return await ctx.db.query("roles").collect();
    },
});

/**
 * Create a new custom role
 */
export const createRole = mutation({
    args: {
        slug: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        uiPermissions: v.array(v.string()),
        permissions: v.optional(v.array(v.object({
            resource: v.string(),
            actions: v.array(v.string()),
            scope: v.string(),
        }))),
        allowedProcessTypes: v.optional(v.array(v.string())),
        defaultDashboardSlug: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        // Validate slug format
        if (!/^[a-z][a-z0-9_]*$/.test(args.slug)) {
            throw new Error("Slug must be lowercase, start with a letter, and contain only letters, numbers, and underscores");
        }

        // Check for existing role
        const existing = await ctx.db
            .query("roles")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();

        if (existing) {
            throw new Error(`Role with slug "${args.slug}" already exists`);
        }

        const roleId = await ctx.db.insert("roles", {
            slug: args.slug,
            name: args.name,
            description: args.description ?? "",
            uiPermissions: args.uiPermissions,
            permissions: args.permissions ?? [],
            defaultDashboardSlug: args.defaultDashboardSlug ?? "member_dashboard",
            isSystemRole: false, // Custom roles are not system roles
        });

        return roleId;
    },
});

/**
 * Update an existing role
 */
export const updateRole = mutation({
    args: {
        roleId: v.id("roles"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        uiPermissions: v.optional(v.array(v.string())),
        permissions: v.optional(v.array(v.object({
            resource: v.string(),
            actions: v.array(v.string()),
            scope: v.string(),
        }))),
        allowedProcessTypes: v.optional(v.array(v.string())),
        defaultDashboardSlug: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        const role = await ctx.db.get(args.roleId);
        if (!role) throw new Error("Role not found");

        // Build updates object with only provided fields
        const { roleId, ...updates } = args;
        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([, v]) => v !== undefined)
        );

        if (Object.keys(filteredUpdates).length === 0) {
            throw new Error("No updates provided");
        }

        await ctx.db.patch(args.roleId, filteredUpdates);

        return { success: true };
    },
});

/**
 * Delete a custom role (system roles cannot be deleted)
 */
export const deleteRole = mutation({
    args: { roleId: v.id("roles") },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        const role = await ctx.db.get(args.roleId);
        if (!role) throw new Error("Role not found");

        if (role.isSystemRole) {
            throw new Error("System roles cannot be deleted");
        }

        // Check if any users have this role
        const usersWithRole = await ctx.db
            .query("users")
            .withIndex("by_system_role", (q) => q.eq("systemRole", role.slug))
            .collect();

        if (usersWithRole.length > 0) {
            throw new Error(`Cannot delete role: ${usersWithRole.length} user(s) are assigned this role`);
        }

        await ctx.db.delete(args.roleId);

        return { success: true };
    },
});

/**
 * Assign a role to a user
 */
export const assignRoleToUser = mutation({
    args: {
        userId: v.id("users"),
        roleSlug: v.string(),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        const user = await ctx.db.get(args.userId);
        if (!user || user.isDeleted) throw new Error("User not found");

        const role = await ctx.db
            .query("roles")
            .withIndex("by_slug", (q) => q.eq("slug", args.roleSlug))
            .first();

        if (!role) throw new Error(`Role "${args.roleSlug}" not found`);

        await ctx.db.patch(args.userId, { systemRole: args.roleSlug });

        return { success: true, roleName: role.name };
    },
});

/**
 * Duplicate an existing role (useful for creating variations)
 */
export const duplicateRole = mutation({
    args: {
        roleId: v.id("roles"),
        newSlug: v.string(),
        newName: v.string(),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        const sourceRole = await ctx.db.get(args.roleId);
        if (!sourceRole) throw new Error("Source role not found");

        // Check new slug doesn't exist
        const existing = await ctx.db
            .query("roles")
            .withIndex("by_slug", (q) => q.eq("slug", args.newSlug))
            .first();

        if (existing) {
            throw new Error(`Role with slug "${args.newSlug}" already exists`);
        }

        const newRoleId = await ctx.db.insert("roles", {
            slug: args.newSlug,
            name: args.newName,
            description: sourceRole.description ? `Based on ${sourceRole.name}` : "",
            uiPermissions: sourceRole.uiPermissions,
            permissions: sourceRole.permissions,
            defaultDashboardSlug: sourceRole.defaultDashboardSlug,
            isSystemRole: false,
        });

        return newRoleId;
    },
});

/**
 * Get users by role (for role management UI)
 */
export const getUsersByRole = query({
    args: { roleSlug: v.string() },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        const users = await ctx.db
            .query("users")
            .withIndex("by_system_role", (q) => q.eq("systemRole", args.roleSlug))
            .filter((q) => q.neq(q.field("isDeleted"), true))
            .collect();

        return users.map((u) => ({
            _id: u._id,
            name: u.name,
            email: u.email,
            status: u.profile?.status,
        }));
    },
});
