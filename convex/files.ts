import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// =====================================
// UPLOAD LIMITS (Security)
// =====================================
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB default
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB for videos
export const MAX_UPLOADS_PER_DAY = 20;

// Helper: Get user's upload count for today
async function getUserDailyUploadCount(ctx: QueryCtx | MutationCtx, userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startTimestamp = startOfDay.getTime();

    const todaysUploads = await ctx.db
        .query("files")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .filter((q: any) => q.gte(q.field("createdAt"), startTimestamp))
        .collect();

    return todaysUploads.length;
}

// 1. Check upload limits before uploading
export const checkUploadLimits = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { allowed: false, reason: "Not authenticated" };
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user) {
            return { allowed: false, reason: "User not found" };
        }

        const uploadCount = await getUserDailyUploadCount(ctx, user._id);

        if (uploadCount >= MAX_UPLOADS_PER_DAY) {
            return {
                allowed: false,
                reason: `Daily upload limit reached (${MAX_UPLOADS_PER_DAY} files/day)`,
                currentCount: uploadCount,
                limit: MAX_UPLOADS_PER_DAY
            };
        }

        return {
            allowed: true,
            currentCount: uploadCount,
            limit: MAX_UPLOADS_PER_DAY,
            maxFileSizeMB: MAX_FILE_SIZE_BYTES / (1024 * 1024),
            maxVideoSizeMB: MAX_VIDEO_SIZE_BYTES / (1024 * 1024),
        };
    },
});

// 2. Generate Upload URL (Requires auth, checks rate limits)
export const generateUploadUrl = mutation(async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Unauthorized: Must be logged in to upload files");
    }

    const user = await ctx.db
        .query("users")
        .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .first();

    if (!user) {
        throw new Error("User not found");
    }

    // Check rate limit
    const uploadCount = await getUserDailyUploadCount(ctx, user._id);
    if (uploadCount >= MAX_UPLOADS_PER_DAY) {
        throw new Error(`Upload limit exceeded: Maximum ${MAX_UPLOADS_PER_DAY} files per day`);
    }

    return await ctx.storage.generateUploadUrl();
});

// 3. Save File Metadata (Must be called after upload)
export const saveFile = mutation({
    args: {
        storageId: v.string(),
        name: v.optional(v.string()),
        type: v.optional(v.string()),
        processId: v.optional(v.id("processes")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user) throw new Error("User not found");

        await ctx.db.insert("files", {
            storageId: args.storageId,
            userId: user._id,
            name: args.name,
            type: args.type,
            processId: args.processId,
            createdAt: Date.now(),
        });
    },
});

export const getFileUrl = query({
    args: { storageId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null; // No anon access

        const user = await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user) return null;

        // 1. Get File Metadata
        const file = await ctx.db
            .query("files")
            .withIndex("by_storageId", (q) => q.eq("storageId", args.storageId))
            .first();

        // 2. Security Check
        if (!file || file.isDeleted) return null;

        const isOwner = file.userId === user._id;
        const isAdminOrReviewer = ['admin', 'manager', 'lead', 'officer'].includes(user.systemRole || "");

        // If file metadata is missing (legacy uploads?), fallback to strict admin check or just allow if we want to be loose for legacy.
        // For new system: strict.
        if (file) {
            if (!isOwner && !isAdminOrReviewer) {
                return null; // Access Denied
            }
        } else {
            // Legacy/Untracked file? Allow only admins to be safe, or maybe the uploader if we can trust client (we can't).
            // Retaining permissive behavior for legacy dev files if needed, OR block it.
            // Let's block it to be secure.
            if (!isAdminOrReviewer) return null;
        }

        return await ctx.storage.getUrl(args.storageId);
    },
});

export const getFileMetadata = query({
    args: { storageId: v.string() },
    handler: async (ctx, args) => {
        // Same security logic as getFileUrl
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user) return null;

        const file = await ctx.db
            .query("files")
            .withIndex("by_storageId", (q) => q.eq("storageId", args.storageId))
            .first();

        if (!file || file.isDeleted) return null;

        const isOwner = file.userId === user._id;
        const isAdminOrReviewer = ['admin', 'manager', 'lead', 'officer'].includes(user.systemRole || "");

        if (!isOwner && !isAdminOrReviewer) return null;

        const url = await ctx.storage.getUrl(args.storageId);
        return { ...file, url };
    }
});

/**
 * Soft delete a file (Owner or Admin only)
 */
export const deleteFile = mutation({
    args: { storageId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user) throw new Error("User not found");

        const file = await ctx.db
            .query("files")
            .withIndex("by_storageId", (q) => q.eq("storageId", args.storageId))
            .first();

        if (!file || file.isDeleted) throw new Error("File not found");

        const isOwner = file.userId === user._id;
        const isAdmin = user.systemRole === 'admin';

        if (!isOwner && !isAdmin) throw new Error("Unauthorized to delete this file");

        await ctx.db.patch(file._id, {
            isDeleted: true,
            deletedAt: Date.now()
        });
    }
});

