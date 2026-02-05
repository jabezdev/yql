
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { ensureAdmin } from "./auth";
import { SYSTEM_ROLES, SYSTEM_ROLE_LIST, ROLE_HIERARCHY, type SystemRole } from "./constants";

// ============================================
// PERMISSION CALCULATION
// ============================================

export const getMyPermissions = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return {
                role: "guest",
                hrStatus: "candidate",
                specialRoles: [],
                permissions: [],
                roleLevel: 0,
                isSystemAdmin: false
            };
        }

        const user = await ctx.db.query("users").withIndex("by_tokenIdentifier", q => q.eq("tokenIdentifier", identity.tokenIdentifier)).first();
        if (!user) {
            return {
                role: "guest",
                hrStatus: "candidate",
                specialRoles: [],
                permissions: [],
                roleLevel: 0,
                isSystemAdmin: false
            };
        }

        const systemRole = (user.systemRole as SystemRole) || SYSTEM_ROLES.GUEST;
        const hrStatus = user.profile?.status || "candidate";

        // Get special role slugs
        const specialRoles: string[] = [];
        let additivePermissions: any[] = [];

        if (user.specialRoleIds && user.specialRoleIds.length > 0) {
            const fetchedRoles = await Promise.all(
                user.specialRoleIds.map(id => ctx.db.get(id))
            );

            for (const role of fetchedRoles) {
                if (role) {
                    specialRoles.push(role.slug);
                    if (role.permissions) {
                        additivePermissions = [...additivePermissions, ...role.permissions];
                    }
                }
            }
        }

        // Calculate role level for hierarchy checks
        // Use unified hierarchy from constants
        const roleLevel = ROLE_HIERARCHY[systemRole] ?? 0;

        return {
            role: systemRole,
            hrStatus,
            specialRoles,
            permissions: additivePermissions,
            roleLevel,
            isSystemAdmin: systemRole === SYSTEM_ROLES.ADMIN
        };
    }
});

// ============================================
// SYSTEM ROLE MANAGEMENT
// ============================================

export const setSystemRole = mutation({
    args: {
        userId: v.id("users"),
        roleSlug: v.string(), // Must be one of SYSTEM_ROLES
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        if (!SYSTEM_ROLE_LIST.includes(args.roleSlug as any)) {
            throw new Error(`Invalid System Role: ${args.roleSlug}`);
        }

        await ctx.db.patch(args.userId, { systemRole: args.roleSlug });
        return { success: true };
    }
});


// ============================================
// SPECIAL ROLE CRUD (Functional Roles)
// ============================================

/**
 * Get all special roles
 */
export const getAllSpecialRoles = query({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);
        return await ctx.db.query("special_roles").collect();
    },
});

/**
 * Create a new special role (e.g. "Recruiter")
 */
export const createSpecialRole = mutation({
    args: {
        slug: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        permissions: v.optional(v.array(v.object({
            resource: v.string(),
            actions: v.array(v.string()),
            scope: v.string(),
        }))),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        // Validate slug format
        if (!/^[a-z][a-z0-9_]*$/.test(args.slug)) {
            throw new Error("Slug must be lowercase, start with a letter, and contain only letters, numbers, and underscores");
        }

        // Check for existing role
        const existing = await ctx.db
            .query("special_roles")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();

        if (existing) {
            throw new Error(`Special Role with slug "${args.slug}" already exists`);
        }

        const roleId = await ctx.db.insert("special_roles", {
            slug: args.slug,
            name: args.name,
            description: args.description ?? "",
            permissions: args.permissions ?? [],
        });

        return roleId;
    },
});

/**
 * Update a special role
 */
export const updateSpecialRole = mutation({
    args: {
        roleId: v.id("special_roles"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        permissions: v.optional(v.array(v.object({
            resource: v.string(),
            actions: v.array(v.string()),
            scope: v.string(),
        }))),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        const role = await ctx.db.get(args.roleId);
        if (!role) throw new Error("Role not found");

        const { roleId, ...updates } = args;
        await ctx.db.patch(args.roleId, updates);
        return { success: true };
    },
});

/**
 * Delete a special role
 */
export const deleteSpecialRole = mutation({
    args: { roleId: v.id("special_roles") },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        // Check availability (optional: check if assigned to users)
        // For strictness we could check, but for now we allow deletion and just let the references date
        // Better: Remove from all users
        // This scan might be expensive if many users.

        await ctx.db.delete(args.roleId);
        return { success: true };
    },
});

// ============================================
// ASSIGNMENT
// ============================================

export const addSpecialRoleToUser = mutation({
    args: {
        userId: v.id("users"),
        roleSlug: v.string(),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        const role = await ctx.db.query("special_roles").withIndex("by_slug", q => q.eq("slug", args.roleSlug)).first();
        if (!role) throw new Error("Special Role not found");

        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const currentRoles = user.specialRoleIds || [];
        if (!currentRoles.includes(role._id)) {
            await ctx.db.patch(args.userId, {
                specialRoleIds: [...currentRoles, role._id]
            });
        }

        return { success: true };
    }
});

export const removeSpecialRoleFromUser = mutation({
    args: {
        userId: v.id("users"),
        roleSlug: v.string(),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        const role = await ctx.db.query("special_roles").withIndex("by_slug", q => q.eq("slug", args.roleSlug)).first();
        if (!role) throw new Error("Special Role not found");

        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const currentRoles = user.specialRoleIds || [];
        if (currentRoles.includes(role._id)) {
            await ctx.db.patch(args.userId, {
                specialRoleIds: currentRoles.filter(id => id !== role._id)
            });
        }

        return { success: true };
    }
});


// Legacy / Deprecated support if needed (empty)
export const seedRoles = mutation({
    args: {},
    handler: async () => {
        return "Seed not required for System Roles (Constants)";
    }
});
