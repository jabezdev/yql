import { usePermissions } from "../hooks/usePermissions";
import { useClerk } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Settings,
    LogOut,
    Menu,
    X,
    Shield,
    Calendar,
    Target,
    Clock,
    Star,
    GraduationCap
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface SidebarLink {
    label: string;
    path: string;
    icon: React.ElementType;
    permission?: string;
    roles?: string[];
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { role, hasPermission } = usePermissions();
    const { signOut } = useClerk();
    const user = useQuery(api.core.users.getMe);
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Simplified sidebar links - let backend control content visibility
    const links: SidebarLink[] = [
        // Main Dashboard - accessible to all
        {
            label: "Dashboard",
            path: "/dashboard",
            icon: LayoutDashboard,
        },

        // Admin Panel
        {
            label: "Admin Panel",
            path: "/dashboard/admin",
            icon: Shield,
            roles: ["admin"]
        },

        // Operations & Engagement
        {
            label: "Shifts",
            path: "/dashboard/shifts",
            icon: Calendar,
        },
        {
            label: "Goals",
            path: "/dashboard/goals",
            icon: Target,
        },
        {
            label: "Timesheets",
            path: "/dashboard/timesheets",
            icon: Clock,
        },

        // Performance
        {
            label: "Performance",
            path: "/dashboard/performance",
            icon: Star,
        },

        {
            label: "Alumni",
            path: "/dashboard/alumni",
            icon: GraduationCap,
        },

        // Settings - accessible to all
        {
            label: "Settings",
            path: "/dashboard/settings",
            icon: Settings,
        }
    ];

    const filteredLinks = links.filter(link => {
        if (link.roles && !link.roles.includes(role)) return false;
        if (link.permission && !hasPermission(link.permission)) return false;
        return true;
    });

    const roleLabels: Record<string, string> = {
        guest: "Guest",
        contributor: "Contributor",
        alumni: "Alumni",
        member: "Member",
        manager: "Manager",
        lead: "Team Lead",
        admin: "Admin"
    };

    return (
        <div className="min-h-screen bg-bg-light flex flex-col md:flex-row font-sans text-brand-text">
            {/* Mobile Header */}
            <div className="md:hidden bg-white/80 backdrop-blur-md border-b border-white/50 p-4 flex justify-between items-center sticky top-0 z-20">
                <span className="font-bold text-xl text-brand-darkBlue tracking-tight">HR Core</span>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-brand-textMuted hover:text-brand-darkBlue">
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-10 w-64 bg-white/90 backdrop-blur-xl border-r border-white/50 shadow-glass transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="h-full flex flex-col p-6">
                    <div className="mb-10 hidden md:block">
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-darkBlue to-brand-lightBlue">
                            HR Core
                        </h1>
                        <p className="text-xs text-brand-textMuted mt-1 uppercase tracking-wider font-semibold">Talent Development</p>
                    </div>

                    <div className="flex-1 space-y-2">
                        {filteredLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = location.pathname === link.path ||
                                (link.path !== "/dashboard" && location.pathname.startsWith(`${link.path}/`));

                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                                        ${isActive
                                            ? 'bg-brand-blue/10 text-brand-darkBlue font-semibold shadow-sm'
                                            : 'text-brand-textMuted hover:bg-white hover:text-brand-darkBlue hover:shadow-soft'
                                        }
                                    `}
                                >
                                    <Icon size={20} className={`transition-colors ${isActive ? 'text-brand-blue' : 'text-brand-textMuted group-hover:text-brand-blue'}`} />
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="mt-auto pt-6 border-t border-brand-border">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-lightBlue to-brand-darkBlue flex items-center justify-center text-white font-bold text-sm shadow-md">
                                {user?.name?.charAt(0) || "U"}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-semibold truncate text-brand-text">{user?.name}</p>
                                <p className="text-xs text-brand-textMuted uppercase truncate font-bold">
                                    {roleLabels[role] || role}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-brand-wine hover:bg-red-50 rounded-lg transition-colors font-medium"
                        >
                            <LogOut size={16} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)] md:h-screen">
                <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12 animate-fade-in">
                    {children}
                </div>
            </main>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-0 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
}
