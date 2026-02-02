import { v } from "convex/values";
import { query } from "./_generated/server";
import { getViewer } from "./auth";
import type { Doc } from "./_generated/dataModel";

// ============================================
// PRIVACY LEVELS
// ============================================

export const PRIVACY_LEVELS = [
    "public",       // Visible to everyone (including guests)
    "members_only", // Visible to active members
    "leads_only",   // Visible to officers and above
    "private",      // Visible only to self and admins
] as const;

export type PrivacyLevel = typeof PRIVACY_LEVELS[number];

// ============================================
// HELPERS
// ============================================

/**
 * Check if viewer can see a user's full profile
 */
function canViewFullProfile(
    viewer: Doc<"users">,
    target: Doc<"users">
): boolean {
    // Always can view own profile
    if (viewer._id === target._id) return true;

    // Admins (admin) can see everything
    if (viewer.systemRole === 'admin') return true;

    const privacyLevel = target.profile?.privacyLevel ?? "members_only";

    // Helper to determine "level" from role for hierarchy comparison (simplified)
    const getRoleLevel = (role?: string) => {
        if (role === 'admin') return 4;
        if (role === 'manager') return 3; // or lead
        if (role === 'lead') return 3;
        if (role === 'officer') return 3;
        if (role === 'member') return 2;
        if (role === 'guest') return 0;
        return 1; // default
    };

    const viewerLevel = getRoleLevel(viewer.systemRole);

    switch (privacyLevel) {
        case "public":
            return true;
        case "members_only":
            // Member (level 2+) can view
            return viewerLevel >= 2;
        case "leads_only":
            // Officer (level 3+) can view
            return viewerLevel >= 3;
        case "private":
            // Only self and admins (handled above)
            return false;
        default:
            return viewerLevel >= 2;
    }
}

/**
 * Filter user data based on viewer's access level
 */
function filterUserData(
    viewer: Doc<"users">,
    target: Doc<"users">,
    canViewFull: boolean
): Record<string, unknown> {
    // Basic public info (always visible)
    const publicData = {
        _id: target._id,
        name: target.name,
        systemRole: target.systemRole,
    };

    if (!canViewFull) {
        return publicData;
    }

    // Full profile for authorized viewers
    return {
        ...publicData,
        email: target.email,
        // Removed clearanceLevel
        profile: target.profile ? {
            positions: target.profile.positions,
            status: target.profile.status,
            joinDate: target.profile.joinDate,
            // Don't expose exit details unless admin
            ...((viewer.systemRole === 'admin') && {
                exitDate: target.profile.exitDate,
                exitReason: target.profile.exitReason,
            }),
        } : undefined,
    };
}

// ============================================
// QUERIES
// ============================================

/**
 * Get member directory with privacy filtering
 */
export const getDirectory = query({
    args: {
        status: v.optional(v.string()),        // Filter by status
        departmentId: v.optional(v.id("departments")),
        limit: v.optional(v.number()),
        includeInactive: v.optional(v.boolean()), // For admins
    },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        // Guests cannot access directory
        if (viewer.systemRole === 'guest' || viewer.systemRole === 'candidate') {
            throw new Error("Directory access requires member status");
        }

        let users = await ctx.db.query("users").collect();

        // Filter out deleted users
        users = users.filter((u) => !u.isDeleted);

        // Filter by active status unless admin requesting inactive
        if (!args.includeInactive || viewer.systemRole !== 'admin') {
            users = users.filter((u) => {
                const status = u.profile?.status;
                return status === "active" || status === "probation";
            });
        }

        // Apply status filter
        if (args.status) {
            users = users.filter((u) => u.profile?.status === args.status);
        }

        // Apply department filter
        if (args.departmentId) {
            users = users.filter((u) => {
                if (!u.profile?.positions) return false;
                return u.profile.positions.some(
                    (p) => p.departmentId === args.departmentId
                );
            });
        }

        // Apply limit
        const limit = args.limit ?? 100;
        users = users.slice(0, limit);

        // Map to privacy-filtered results
        return users.map((user) => {
            const canViewFull = canViewFullProfile(viewer, user);
            return filterUserData(viewer, user, canViewFull);
        });
    },
});

/**
 * Search members by name or email
 */
export const searchMembers = query({
    args: {
        query: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        if (viewer.systemRole === 'guest' || viewer.systemRole === 'candidate') {
            throw new Error("Search requires member status");
        }

        const searchTerm = args.query.toLowerCase().trim();
        if (searchTerm.length < 2) {
            return []; // Require at least 2 characters
        }

        let users = await ctx.db.query("users").collect();

        // Filter deleted and inactive
        users = users.filter((u) => {
            if (u.isDeleted) return false;
            const status = u.profile?.status;
            return status === "active" || status === "probation";
        });

        // Search by name or email
        users = users.filter((u) => {
            const nameMatch = u.name.toLowerCase().includes(searchTerm);
            // Only search email if viewer is officer+ (or admin/manager/lead)
            const isOfficerPlus = ['admin', 'manager', 'lead', 'officer'].includes(viewer.systemRole || "");
            const emailMatch = isOfficerPlus &&
                u.email.toLowerCase().includes(searchTerm);
            return nameMatch || emailMatch;
        });

        // Limit results
        const limit = args.limit ?? 20;
        users = users.slice(0, limit);

        // Map to privacy-filtered results
        return users.map((user) => {
            const canViewFull = canViewFullProfile(viewer, user);
            return filterUserData(viewer, user, canViewFull);
        });
    },
});

/**
 * Get a specific member's profile (privacy-aware)
 */
export const getMemberProfile = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        const user = await ctx.db.get(args.userId);
        if (!user || user.isDeleted) {
            return null;
        }

        const canViewFull = canViewFullProfile(viewer, user);

        // Enrich with department info
        const baseData = filterUserData(viewer, user, canViewFull);

        if (canViewFull && user.profile?.positions) {
            const positionsWithDept = await Promise.all(
                user.profile.positions.map(async (pos) => {
                    if (!pos.departmentId) return pos;
                    const dept = await ctx.db.get(pos.departmentId);
                    return {
                        ...pos,
                        departmentName: dept?.name ?? "Unknown",
                    };
                })
            );

            return {
                ...baseData,
                profile: {
                    ...(baseData.profile as Record<string, unknown> || {}),
                    positions: positionsWithDept,
                },
            };
        }

        return baseData;
    },
});

/**
 * Get directory stats (for dashboards)
 */
export const getDirectoryStats = query({
    args: {},
    handler: async (ctx) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        // Require officer level for stats (Admin, Manager, Lead)
        if (!['admin', 'manager', 'lead', 'officer'].includes(viewer.systemRole || "")) {
            throw new Error("Stats require officer access");
        }

        const users = await ctx.db.query("users").collect();
        const activeUsers = users.filter((u) => !u.isDeleted);

        const statusCounts: Record<string, number> = {};
        for (const user of activeUsers) {
            const status = user.profile?.status ?? "unknown";
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        }

        // Count by department
        const deptCounts: Record<string, number> = {};
        for (const user of activeUsers) {
            if (!user.profile?.positions) continue;
            for (const pos of user.profile.positions) {
                if (pos.departmentId && pos.isPrimary) {
                    const key = pos.departmentId;
                    deptCounts[key] = (deptCounts[key] || 0) + 1;
                }
            }
        }

        // Enrich department names
        const departments = await ctx.db.query("departments").collect();
        const deptMap = new Map(departments.map((d) => [d._id, d.name]));

        const departmentStats = Object.entries(deptCounts).map(([id, count]) => ({
            departmentId: id,
            departmentName: deptMap.get(id as any) ?? "Unknown",
            count,
        }));

        return {
            total: activeUsers.length,
            byStatus: statusCounts,
            byDepartment: departmentStats,
        };
    },
});
