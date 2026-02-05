import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { usePermissions } from "../../core/hooks/usePermissions";
import { ProcessList } from "../blocks/widgets/ProcessList";
import { ProgramList } from "../blocks/widgets/ProgramList";
import { Loader2, LayoutDashboard, Users, Shield, UserCircle } from "lucide-react";

export default function DashboardView() {
    const { role, isStaff, isAdmin, isLoading: isLoadingPerms } = usePermissions();
    const [activeTab, setActiveTab] = useState<"overview" | "management" | "admin" | "profile">("overview");

    // Fetch Data
    const myProcesses = useQuery(api.engine.processes.getMyProcesses);
    const visiblePrograms = useQuery(api.engine.programs.getVisiblePrograms, {});

    // Only fetch team processes if staff
    const teamProcesses = useQuery(api.engine.processes.getTeamProcesses);

    if (isLoadingPerms || myProcesses === undefined || visiblePrograms === undefined) {
        return (
            <div className="flex h-full items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    const tabs = [
        { id: "overview", label: "Overview", icon: LayoutDashboard, show: true },
        { id: "management", label: "Management", icon: Users, show: isStaff },
        { id: "admin", label: "Admin", icon: Shield, show: isAdmin },
        { id: "profile", label: "Profile", icon: UserCircle, show: true },
    ] as const;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500">Welcome back, {role}.</p>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200 mb-8">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.filter(t => t.show).map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                                    ${isActive
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }
                                `}
                            >
                                <Icon className={`-ml-0.5 mr-2 h-5 w-5 ${isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {activeTab === "overview" && (
                    <>
                        {/* 1. Show Available Programs (if any) - e.g. "Apply Now" */}
                        <ProgramList programs={visiblePrograms} role={role} />

                        {/* 2. Show Active Processes */}
                        <ProcessList
                            title="My Active Tasks"
                            processes={myProcesses || []}
                            emptyMessage="You have no active applications or tasks."
                        />
                    </>
                )}

                {activeTab === "management" && isStaff && (
                    <>
                        <ProcessList
                            title="Team Tasks & Approvals"
                            processes={teamProcesses || []}
                            emptyMessage="No team activity found."
                        />
                    </>
                )}

                {activeTab === "admin" && isAdmin && (
                    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center bg-gray-50/50">
                        <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="font-medium text-gray-900">System Administration</h3>
                        <p className="text-gray-500 mb-6">Manage users, programs, and system settings.</p>
                        <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                            Go to Admin Panel
                        </button>
                    </div>
                )}

                {activeTab === "profile" && (
                    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center bg-gray-50/50">
                        <UserCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="font-medium text-gray-900">User Profile</h3>
                        <p className="text-gray-500">Profile settings are coming soon.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
