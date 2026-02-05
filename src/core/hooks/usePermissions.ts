
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface PermissionsData {
    role: string;
    hrStatus: string;
    specialRoles: string[];
    permissions: any[];
    roleLevel: number;
    isSystemAdmin: boolean;
}

const ROLE_LEVELS: Record<string, number> = {
    guest: 0,
    member: 10,
    manager: 20,
    lead: 30,
    admin: 100,
};

export function usePermissions() {
    const data = useQuery(api.core.roles.getMyPermissions) as PermissionsData | undefined;

    // Check if user has at least the minimum role (hierarchy-based)
    const hasMinRole = (minRole: string): boolean => {
        if (!data) return false;
        const userLevel = data.roleLevel ?? ROLE_LEVELS[data.role] ?? 0;
        const requiredLevel = ROLE_LEVELS[minRole] ?? 0;
        return userLevel >= requiredLevel;
    };

    // Check if user has an exact role match
    const hasRole = (roleSlug: string): boolean => {
        return data?.role === roleSlug;
    };

    // Check if user has a specific special role
    const hasSpecialRole = (slug: string): boolean => {
        return data?.specialRoles?.includes(slug) ?? false;
    };

    // Legacy hasPermission for backwards compatibility (deprecated)
    const hasPermission = (_permission: string): boolean => {
        console.warn("hasPermission is deprecated. Use hasMinRole or hasSpecialRole.");
        return false;
    };

    return {
        // Core user info
        role: data?.role || 'guest',
        hrStatus: data?.hrStatus || 'candidate',
        specialRoles: data?.specialRoles || [],
        roleLevel: data?.roleLevel ?? 0,

        // Helper functions
        hasMinRole,
        hasRole,
        hasSpecialRole,
        hasPermission, // deprecated

        // Convenience flags
        isLoading: data === undefined,
        isBlocked: data?.hrStatus === 'blocked',
        isActive: data?.hrStatus === 'active',
        isAdmin: data?.isSystemAdmin ?? false,
        isStaff: hasMinRole('manager'),
    };
}
