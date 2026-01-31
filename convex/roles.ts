
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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
        ],
        allowedProcessTypes: ["recruitment"],
        defaultDashboardSlug: "guest_dashboard",
        isSystemRole: true,
    },
    {
        slug: "member",
        name: "Member",
        description: "Active organization member.",
        uiPermissions: ["dashboard.view_member_portal", "dashboard.view_programs", "dashboard.view_surveys"],
        permissions: [
            { resource: "processes", actions: ["read", "create", "update"], scope: "own" },
            { resource: "events", actions: ["read", "create"], scope: "department" },
            { resource: "users", actions: ["read"], scope: "department" },
            { resource: "departments", actions: ["read"], scope: "all" },
        ],
        allowedProcessTypes: ["recruitment", "recommitment", "survey", "loa_request"],
        defaultDashboardSlug: "member_dashboard",
        isSystemRole: true,
    },
    {
        slug: "officer",
        name: "Officer",
        description: "Department officer with management access.",
        uiPermissions: ["dashboard.view_member_portal", "dashboard.view_programs", "dashboard.manage_reviews"],
        permissions: [
            { resource: "processes", actions: ["read", "update"], scope: "department" },
            { resource: "users", actions: ["read", "update"], scope: "department" },
            { resource: "events", actions: ["read", "create", "update", "delete"], scope: "department" },
            { resource: "reviews", actions: ["read", "create"], scope: "department" },
            { resource: "departments", actions: ["read"], scope: "all" },
        ],
        allowedProcessTypes: ["recruitment", "recommitment", "survey", "loa_request"],
        defaultDashboardSlug: "officer_dashboard",
        isSystemRole: true,
    },
    {
        slug: "admin",
        name: "Administrator",
        description: "System administrator with full access.",
        uiPermissions: ["dashboard.view_recruitment", "dashboard.view_member_portal", "system.manage_configuration", "system.manage_users"],
        permissions: [
            { resource: "processes", actions: ["read", "create", "update", "delete"], scope: "all" },
            { resource: "users", actions: ["read", "create", "update", "delete"], scope: "all" },
            { resource: "events", actions: ["read", "create", "update", "delete"], scope: "all" },
            { resource: "reviews", actions: ["read", "create", "update", "delete"], scope: "all" },
            { resource: "departments", actions: ["read", "create", "update", "delete"], scope: "all" },
            { resource: "programs", actions: ["read", "create", "update", "delete"], scope: "all" },
            { resource: "roles", actions: ["read", "create", "update"], scope: "all" },
        ],
        allowedProcessTypes: ["recruitment", "recommitment", "survey", "loa_request"],
        defaultDashboardSlug: "admin_dashboard",
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
                    allowedProcessTypes: roleDef.allowedProcessTypes,
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
            // Fallback for hardcoded behavior if DB is empty
            if (user.systemRole === 'admin') return { role: 'admin', permissions: ['system.manage_configuration'] };
            return { role: user.systemRole, permissions: [] };
        }

        return {
            role: user.systemRole,
            permissions: roleConfig.uiPermissions
        };
    }
});
