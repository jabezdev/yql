import { Navigate, useLocation } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";
import { Loader2 } from "lucide-react";

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles?: string[];
    requiredPermission?: string;
}

export default function RoleGuard({ children, allowedRoles, requiredPermission }: RoleGuardProps) {
    const { role, hasPermission, isLoading } = usePermissions();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-blue" />
            </div>
        );
    }

    // 1. Check Role Access
    if (allowedRoles && !allowedRoles.includes(role)) {
        // Redirect to their default dashboard if they try to access a forbidden area
        // Or generic "Unauthorized" page. For now, redirect to root dashboard handles dispatch.
        console.warn(`Access denied for role: ${role}. Required: ${allowedRoles.join(", ")}`);
        return <Navigate to="/dashboard" replace state={{ from: location }} />;
    }

    // 2. Check Permission Access
    if (requiredPermission && !hasPermission(requiredPermission)) {
        console.warn(`Access denied. Missing permission: ${requiredPermission}`);
        return <Navigate to="/dashboard" replace state={{ from: location }} />;
    }

    return <>{children}</>;
}
