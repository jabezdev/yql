
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

/**
 * Creates a staff member with elevated access.
 * More generic than the old "createReviewer" - can be used for any staff role.
 */
export const createStaffMember = mutation({
    args: {
        email: v.string(),
        name: v.string(),
        title: v.optional(v.string()),
        departmentId: v.optional(v.id("departments")),
        clearanceLevel: v.optional(v.number()), // Default 3 (Officer)
        systemRole: v.optional(v.string()), // Default "member"
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

        if (args.departmentId) {
            const department = await ctx.db.get(args.departmentId);
            if (!department) throw new Error("Invalid departmentId");
        }

        const userId = await ctx.db.insert("users", {
            email: args.email,
            name: args.name,
            systemRole: args.systemRole || "member",
            clearanceLevel: args.clearanceLevel ?? 3, // Default officer level
            profile: {
                positions: args.title ? [{
                    title: args.title,
                    departmentId: args.departmentId,
                    isPrimary: true
                }] : [],
                status: "active",
                joinDate: Date.now(),
            },
        });

        // Audit Log
        const admin = await ensureAdmin(ctx);
        await createAuditLog(ctx, {
            userId: admin._id,
            action: "user.create",
            entityType: "users",
            entityId: userId,
            metadata: { method: "manual_creation", type: "staff_member" }
        });

        return userId;
    },
});

/**
 * Gets staff members with officer-level access (clearanceLevel >= 3).
 * Can filter by department for scoped access.
 */
export const getStaffMembers = query({
    args: { departmentId: v.optional(v.id("departments")) },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);

        // Get all users with clearanceLevel >= 3 (officers and above)
        const allUsers = await ctx.db.query("users").collect();
        const staffMembers = allUsers.filter(u => (u.clearanceLevel ?? 0) >= 3 && !u.isDeleted);

        if (args.departmentId) {
            // Filter by department membership
            return staffMembers.filter(u => {
                if (!u.profile?.positions) return false;
                return u.profile.positions.some(
                    p => p.departmentId === args.departmentId
                );
            });
        }
        return staffMembers;
    }
});

export const getUser = query({
    args: { id: v.id("users") },
    handler: async (ctx, args) => {
        const requestor = await getViewer(ctx);
        if (!requestor) throw new Error("Unauthorized");

        if (requestor._id === args.id) return requestor;

        if ((requestor.clearanceLevel ?? 0) >= 3 || requestor.systemRole === "admin") {
            const user = await ctx.db.get(args.id);
            if (!user || user.isDeleted) return null;
            return user;
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



/**
 * Onboards a user to a specific program/process.
 * Creates user if they don't exist, and creates or updates their process.
 */
export const onboardUser = mutation({
    args: {
        email: v.string(),
        name: v.string(),
        targetStageId: v.id("stages"),
        programId: v.id("programs"),
        type: v.optional(v.string()), // Process type, defaults to context-appropriate type
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
                userId: userId,
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

        // Determine process type
        const processType = args.type || "onboarding"; // Generic default instead of "recruitment"

        if (existingProcess) {
            await ctx.db.patch(existingProcess._id, {
                currentStageId: args.targetStageId,
                updatedAt: Date.now()
            });
        } else {
            await ctx.db.insert("processes", {
                userId,
                programId: args.programId,
                type: processType,
                currentStageId: args.targetStageId,
                status: "in_progress",
                updatedAt: Date.now(),
                data: {}
            });
        }

        return userId;
    }
});

