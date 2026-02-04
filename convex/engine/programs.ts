import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { ensureAdmin, getViewer, ensureReviewer } from "../core/auth";
import { createAuditLog } from "../core/auditLog";
import { isValidProgramType, PROGRAM_TYPES } from "../lib/constants";

/**
 * Gets the currently active program
 */
export const getActiveProgram = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("programs")
            .withIndex("by_active", (q) => q.eq("isActive", true))
            .first();
    },
});

/**
 * Gets all programs (officer+ access)
 */
export const getAllPrograms = query({
    args: { programType: v.optional(v.string()) },
    handler: async (ctx, args) => {
        // Require at least officer/staff level to view all programs
        await ensureReviewer(ctx); // Throws if not authorized


        if (args.programType) {
            return await ctx.db
                .query("programs")
                .withIndex("by_type", (q) => q.eq("programType", args.programType))
                .collect();
        }
        return await ctx.db.query("programs").collect();
    }
});

/**
 * Creates a new program
 */
export const createProgram = mutation({
    args: {
        name: v.string(),
        slug: v.string(),
        programType: v.optional(v.string()), // recruitment_cycle, survey_campaign, etc.
        startDate: v.number(),
        endDate: v.optional(v.number()),
        config: v.optional(v.any()), // Type-specific configuration
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        // Validate program type if provided
        if (args.programType && !isValidProgramType(args.programType)) {
            throw new Error(`Invalid program type: ${args.programType}`);
        }

        // Enforce uniqueness of slug
        const existing = await ctx.db
            .query("programs")
            .withIndex("by_slug", q => q.eq("slug", args.slug))
            .first();
        if (existing) throw new Error("Program slug already exists.");

        const programId = await ctx.db.insert("programs", {
            ...args,
            programType: args.programType || PROGRAM_TYPES.GENERIC,
            isActive: false,
            stageIds: []
        });

        // Audit Log
        await createAuditLog(ctx, {
            userId: admin._id,
            action: "program.create",
            entityType: "programs",
            entityId: programId,
            changes: { after: args }
        });

        return programId;
    }
});

/**
 * Updates a program
 */
export const updateProgram = mutation({
    args: {
        programId: v.id("programs"),
        isActive: v.optional(v.boolean()),
        name: v.optional(v.string()),
        slug: v.optional(v.string()),
        programType: v.optional(v.string()),
        startDate: v.optional(v.number()),
        config: v.optional(v.any()), // Type-specific configuration
        automations: v.optional(v.array(v.object({
            trigger: v.string(), // "status_change", "stage_submission"
            conditions: v.optional(v.any()), // e.g. { status: "approved" }
            actions: v.array(v.object({
                type: v.string(), // "send_email", "update_role", "update_status"
                payload: v.any() // { template: "...", role: "member" }
            }))
        }))),
        allowStartBy: v.optional(v.array(v.string())), // Role slugs allowed to START this process
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);
        const { programId, ...updates } = args;

        const program = await ctx.db.get(programId);
        if (!program) throw new Error("Program not found");

        // Validate program type if being updated
        if (args.programType && !isValidProgramType(args.programType)) {
            throw new Error(`Invalid program type: ${args.programType}`);
        }

        // If activating, deactivate others (only one active at a time)
        if (args.isActive) {
            const others = await ctx.db
                .query("programs")
                .withIndex("by_active", q => q.eq("isActive", true))
                .collect();
            for (const c of others) {
                if (c._id !== programId) {
                    await ctx.db.patch(c._id, { isActive: false });
                }
            }
        }

        await ctx.db.patch(programId, updates);

        // Audit Log
        await createAuditLog(ctx, {
            userId: admin._id,
            action: "program.update",
            entityType: "programs",
            entityId: programId,
            changes: {
                before: { isActive: program.isActive },
                after: updates
            }
        });
    }
});

/**
 * Update a program's viewConfig (role-based visibility settings)
 */
export const updateProgramViewConfig = mutation({
    args: {
        programId: v.id("programs"),
        viewConfig: v.any(), // { roleSlug: { visible: bool, dashboardLocation: string, ... } }
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        const program = await ctx.db.get(args.programId);
        if (!program) throw new Error("Program not found");

        const previousViewConfig = program.viewConfig;

        await ctx.db.patch(args.programId, {
            viewConfig: args.viewConfig
        });

        // Audit Log
        await createAuditLog(ctx, {
            userId: admin._id,
            action: "program.update_view_config",
            entityType: "programs",
            entityId: args.programId,
            changes: {
                before: { viewConfig: previousViewConfig },
                after: { viewConfig: args.viewConfig }
            }
        });
    }
});

/**
 * Get a single program filtered by current user's role visibility
 */
export const getProgramForRole = query({
    args: { programId: v.id("programs") },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user) return null;

        const program = await ctx.db.get(args.programId);
        if (!program) return null;

        const roleSlug = user.systemRole || "guest";

        // Check viewConfig
        if (program.viewConfig) {
            const roleConfig = program.viewConfig[roleSlug];
            // If role is explicitly configured and visible is false, deny access
            if (roleConfig && roleConfig.visible === false) {
                return null;
            }
        }

        // Admin always has access
        if (user.systemRole === 'admin') {
            return program;
        }

        return program;
    }
});

/**
 * Get all programs visible to the current user based on their role
 */
export const getVisiblePrograms = query({
    args: { programType: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const user = await getViewer(ctx);
        if (!user) return [];

        const roleSlug = user.systemRole || "guest";
        const isAdmin = user.systemRole === 'admin';

        let programs;
        if (args.programType) {
            programs = await ctx.db
                .query("programs")
                .withIndex("by_type", (q) => q.eq("programType", args.programType))
                .collect();
        } else {
            programs = await ctx.db.query("programs").collect();
        }

        // Filter by viewConfig visibility
        return programs.filter(program => {
            // Admin sees all
            if (isAdmin) return true;

            // If no viewConfig, default visible
            if (!program.viewConfig) return true;

            const roleConfig = program.viewConfig[roleSlug];
            // If role not configured, default visible
            if (!roleConfig) return true;

            // Check explicit visibility
            return roleConfig.visible !== false;
        });
    }
});

/**
 * Get a single program (Admin or public if needed, but here simple fetch)
 */
export const getProgram = query({
    args: { programId: v.id("programs") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.programId);
    }
});
