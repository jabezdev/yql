import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Loader2 } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { usePermissions } from "../hooks/usePermissions";

export default function CoreDashboard() {
    const user = useQuery(api.users.getMe);
    const { signOut } = useClerk();
    const { hasPermission, role } = usePermissions();

    if (!user) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-blue" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">HR Core</h1>
                    <p className="text-sm text-gray-500">Welcome back, {user.name}</p>
                </div>
                <button
                    onClick={() => signOut()}
                    className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                    Sign Out
                </button>
            </header>

            <main className="flex-1 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Welcome Section */}
                    <div className="bg-white rounded-lg shadow sm:p-6 p-4">
                        <h2 className="text-lg font-semibold mb-2">My Dashboard</h2>
                        <p className="text-gray-600">
                            Current Role: <span className="font-mono bg-blue-50 text-brand-blue px-2 py-0.5 rounded text-sm font-bold uppercase">{role}</span>
                        </p>
                    </div>

                    {/* Guest / Applicant View - Mapped to 'view_recruitment' */}
                    {hasPermission('dashboard.view_recruitment') && (
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-brand-blue">
                                <h3 className="font-bold text-lg mb-2">Recruitment Application</h3>
                                <p className="text-sm text-gray-500 mb-4">Start or continue your application to join the organization.</p>
                                <button className="bg-brand-blue text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-600">
                                    View Application
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Member View - Mapped to 'view_member_portal' */}
                    {hasPermission('dashboard.view_member_portal') && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Member Portal</h3>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition cursor-pointer">
                                    <h4 className="font-bold text-gray-800 mb-1">Active Cycles</h4>
                                    <p className="text-xs text-gray-500">View current organizational programs.</p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition cursor-pointer">
                                    <h4 className="font-bold text-gray-800 mb-1">Surveys & Forms</h4>
                                    <p className="text-xs text-gray-500">Participate in feedback and data collection.</p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition cursor-pointer">
                                    <h4 className="font-bold text-gray-800 mb-1">Recommitment</h4>
                                    <p className="text-xs text-gray-500">Update your active status for the new term.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Admin View - Mapped to 'system.manage_configuration' */}
                    {hasPermission('system.manage_configuration') && (
                        <div className="mt-8 pt-8 border-t">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">ADMIN</span>
                                System Configuration
                            </h3>
                            <div className="grid md:grid-cols-4 gap-4">
                                <div className="bg-white border rounded p-4 text-center hover:bg-gray-50 cursor-pointer">
                                    Manage Users
                                </div>
                                <div className="bg-white border rounded p-4 text-center hover:bg-gray-50 cursor-pointer">
                                    Pipelines & Stages
                                </div>
                                <div className="bg-white border rounded p-4 text-center hover:bg-gray-50 cursor-pointer">
                                    Programs
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
