
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getViewer, ensureAdmin } from "./auth";
import { createAuditLog } from "./auditLog";

/**
 * Syncs the Clerk user to the Convex users table.
 * Should be called on app load.
 */
export const storeUser = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called storeUser without authentication present");
        }

        // Check by tokenIdentifier
        const user = await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (user !== null) {
            // Update metadata if needed
            if (user.name !== identity.name || user.email !== identity.email) {
                await ctx.db.patch(user._id, { name: identity.name!, email: identity.email! });
            }
            return user._id;
        }

        // Check by email (migration/linking)
        const userByEmail = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (userByEmail !== null) {
            // Link account
            await ctx.db.patch(userByEmail._id, { tokenIdentifier: identity.tokenIdentifier });
            return userByEmail._id;
        }

        // Create the user record
        const userId = await ctx.db.insert("users", {
            name: identity.name!,
            email: identity.email!,
            tokenIdentifier: identity.tokenIdentifier,
            systemRole: "guest",
            clearanceLevel: 0,
            profile: {
                positions: [],
                status: "candidate", // generic status
                joinDate: Date.now(),
            }
        });

        // Audit Log (New User)
        await createAuditLog(ctx, {
            userId: userId,
            action: "user.create",
            entityType: "users",
            entityId: userId,
            metadata: { method: "oauth_signup" }
        });

        return userId;
    },
});

export const createReviewer = mutation({
    args: {
        email: v.string(),
        name: v.string(),
        title: v.optional(v.string()),
        department: v.optional(v.string()),
        assignToProgramId: v.optional(v.id("programs")),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (existingUser) {
            throw new Error("User already exists");
        }

        const userId = await ctx.db.insert("users", {
            email: args.email,
            name: args.name,
            systemRole: "member", // Default to member with high clearance
            clearanceLevel: 3,
            profile: {
                positions: args.title ? [{ title: args.title, department: args.department, isPrimary: true }] : [],
                status: "active",
                joinDate: Date.now(),
            },
            linkedCohortIds: args.assignToProgramId ? [args.assignToProgramId] : [],
        });

        // Audit Log
        const admin = await ensureAdmin(ctx);
        await createAuditLog(ctx, {
            userId: admin._id,
            action: "user.create",
            entityType: "users",
            entityId: userId,
            metadata: { method: "manual_creation", type: "reviewer" }
        });

        return userId;
    },
});

export const getReviewers = query({
    args: { programId: v.optional(v.id("programs")) },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        // "reviewer" role is gone. Users with clearanceLevel >= 3 are reviewers/officers.
        const reviewers = await ctx.db.query("users")
            .withIndex("by_system_role", q => q.eq("systemRole", "member")) // Approximation
            .filter(q => q.gte(q.field("clearanceLevel"), 3))
            .collect();

        if (args.programId) {
            return reviewers.filter(r => {
                if (!r.linkedCohortIds || r.linkedCohortIds.length === 0) return true;
                return r.linkedCohortIds.includes(args.programId!);
            });
        }
        return reviewers;
    }
});

export const getUser = query({
    args: { id: v.id("users") },
    handler: async (ctx, args) => {
        const requestor = await getViewer(ctx);
        if (!requestor) throw new Error("Unauthorized");

        if (requestor._id === args.id) return requestor;

        if ((requestor.clearanceLevel ?? 0) >= 3 || requestor.systemRole === "admin") {
            return await ctx.db.get(args.id);
        }

        throw new Error("Unauthorized access to user data");
    }
});

export const getMe = query({
    args: {},
    handler: async (ctx) => {
        return await getViewer(ctx);
    },
});

export const seedAdmin = mutation({
    args: {
        email: v.string(),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const existingAdmin = await ctx.db
            .query("users")
            .withIndex("by_system_role", (q) => q.eq("systemRole", "admin"))
            .first();

        if (existingAdmin) {
            if (existingAdmin.email === args.email) {
                return existingAdmin._id;
            }
            throw new Error("Admin user already exists. Cannot seed.");
        }

        const userId = await ctx.db.insert("users", {
            email: args.email,
            name: args.name,
            systemRole: "admin",
            clearanceLevel: 5,
            profile: {
                positions: [{ title: "System Administrator", isPrimary: true }],
                status: "active",
                joinDate: Date.now(),
            },
            linkedCohortIds: [],
        });

        // Audit Log
        await createAuditLog(ctx, {
            userId: userId,
            action: "user.create",
            entityType: "users",
            entityId: userId,
            metadata: { method: "seed_admin" }
        });

        return userId;
    },
});

export const onboardUser = mutation({
    args: {
        email: v.string(),
        name: v.string(),
        targetStageId: v.id("stages"),
        programId: v.id("programs")
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        let userId;
        const existingUser = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", args.email)).first();

        if (existingUser) {
            userId = existingUser._id;
        } else {
            userId = await ctx.db.insert("users", {
                email: args.email,
                name: args.name,
                systemRole: "guest",
                clearanceLevel: 0,
                profile: { positions: [], status: "candidate", joinDate: Date.now() }
            });

            // Audit Log
            await createAuditLog(ctx, {
                userId: userId, // New user
                action: "user.create",
                entityType: "users",
                entityId: userId,
                metadata: { method: "onboard_user", adminId: (await getViewer(ctx))?._id }
            });
        }

        // Check if process exists
        const existingProcess = await ctx.db.query("processes")
            .withIndex("by_user", q => q.eq("userId", userId))
            .filter(q => q.eq(q.field("programId"), args.programId))
            .first();

        if (existingProcess) {
            await ctx.db.patch(existingProcess._id, {
                currentStageId: args.targetStageId,
                updatedAt: Date.now()
            });
        } else {
            await ctx.db.insert("processes", {
                userId,
                programId: args.programId,
                type: "recruitment", // Default
                currentStageId: args.targetStageId,
                status: "in_progress",
                updatedAt: Date.now(),
                data: {}
            });
        }

        return userId;
    }
});
