
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function usePermissions() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = useQuery(api.roles.getMyPermissions) as { role: string, permissions: string[] } | undefined;

    const hasPermission = (permission: string) => {
        if (!data) return false;
        return data.permissions.includes(permission);
    };

    const hasRole = (roleMetadata: string) => {
        if (!data) return false;
        return data.role === roleMetadata;
    };

    return {
        role: data?.role || 'guest',
        permissions: data?.permissions || [],
        hasPermission,
        hasRole,
        isLoading: data === undefined
    };
}
