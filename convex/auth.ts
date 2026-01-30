import type { QueryCtx, MutationCtx } from "./_generated/server";
import { hashSync, compareSync } from "bcryptjs";

const SESSION_DURATION = 1000 * 60 * 60 * 24 * 7; // 7 days

/**
 * Creates a new session for a user.
 */
export async function createSession(ctx: MutationCtx, userId: any) {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    await ctx.db.insert("sessions", {
        userId,
        token,
        expiresAt: Date.now() + SESSION_DURATION,
    });
    return token;
}

/**
 * Validates a session token and returns the user.
 * Throws if invalid.
 */
export async function authenticate(ctx: QueryCtx | MutationCtx, token: string) {
    const session = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", token))
        .first();

    if (!session || session.expiresAt < Date.now()) {
        throw new Error("Unauthorized: Invalid or expired session");
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
        throw new Error("Unauthorized: User not found");
    }

    return user;
}

/**
 * Ensures the user is an admin.
 */
export async function ensureAdmin(ctx: QueryCtx | MutationCtx, token: string) {
    const user = await authenticate(ctx, token);
    if (user.role !== "admin") {
        throw new Error("Forbidden: Admin access only");
    }
    return user;
}

/**
 * Ensures the user is a reviewer or admin.
 */
export async function ensureReviewer(ctx: QueryCtx | MutationCtx, token: string) {
    const user = await authenticate(ctx, token);
    if (user.role !== "admin" && user.role !== "reviewer") {
        throw new Error("Forbidden: Reviewer access only");
    }
    return user;
}

/**
 * Hashes a password using bcrypt (synchronously for Convex).
 */
export async function hashPassword(password: string): Promise<string> {
    return hashSync(password, 10);
}

/**
 * Verifies a password against a hash (synchronously for Convex).
 */
export async function verifyPassword(password: string, hashStr: string): Promise<boolean> {
    return compareSync(password, hashStr);
}
