import { Navigate, useLocation } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";
import { Loader2 } from "lucide-react";

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles?: string[];       // Exact match (any of these roles)
    minimumRole?: string;          // Hierarchy check (>= this role level)
    requiredSpecialRole?: string;  // Must have this special role
    requireActive?: boolean;       // Must have HR_STATUS = active
    requiredPermission?: string;   // Legacy, deprecated
}

export default function RoleGuard({
    children,
    allowedRoles,
    minimumRole,
    requiredSpecialRole,
    requireActive = false,
    requiredPermission
}: RoleGuardProps) {
    const { role, isLoading, isBlocked, isActive, hasMinRole, hasSpecialRole } = usePermissions();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-blue" />
            </div>
        );
    }

    // Block blocked users first (highest priority)
    if (isBlocked) {
        console.warn("Access denied: User account is blocked");
        return <Navigate to="/" replace state={{ from: location, reason: "blocked" }} />;
    }

    // Check if active status is required
    if (requireActive && !isActive) {
        console.warn(`Access denied: Active status required (current status: not active)`);
        return <Navigate to="/" replace state={{ from: location, reason: "inactive" }} />;
    }

    // Check minimum role (hierarchy-based)
    if (minimumRole && !hasMinRole(minimumRole)) {
        console.warn(`Access denied: Requires at least ${minimumRole} role (current: ${role})`);
        return <Navigate to="/" replace state={{ from: location }} />;
    }

    // Check allowed roles (exact match, any of)
    if (allowedRoles && !allowedRoles.includes(role)) {
        console.warn(`Access denied for role: ${role}. Required: ${allowedRoles.join(", ")}`);
        return <Navigate to="/" replace state={{ from: location }} />;
    }

    // Check special role requirement
    if (requiredSpecialRole && !hasSpecialRole(requiredSpecialRole)) {
        console.warn(`Access denied: Missing special role: ${requiredSpecialRole}`);
        return <Navigate to="/" replace state={{ from: location }} />;
    }

    // Legacy permission check (deprecated)
    if (requiredPermission) {
        console.warn("requiredPermission is deprecated in RoleGuard. Use minimumRole or allowedRoles.");
    }

    return <>{children}</>;
}
