import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Loader2, Sparkles, FolderOpen } from "lucide-react";
import { usePermissions } from "../../../core/hooks/usePermissions";
import { Link } from "react-router-dom";
import ProgramCard from "../../../core/components/ui/ProgramCard";

export default function UnifiedDashboard() {
    const { role, isLoading: permissionsLoading } = usePermissions();
    const user = useQuery(api.core.users.getMe);
    const programs = useQuery(api.engine.programs.getVisiblePrograms, {});

    const isAdmin = role === "admin";

    if (permissionsLoading || programs === undefined || user === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-brand-blue" size={32} />
            </div>
        );
    }

    const activePrograms = programs.filter(p => p.isActive);

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <header>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-darkBlue to-brand-lightBlue mb-2">
                    Welcome back, {user?.name?.split(" ")[0] || "User"}
                </h1>
                <p className="text-brand-textMuted text-lg">
                    {getRoleGreeting(role)}
                </p>
            </header>

            {/* Specialized Modules Section (Members Only) */}
            {role !== 'guest' && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Loader2 className="text-brand-blue" size={20} />
                        <h2 className="text-xl font-bold text-brand-text">My Modules</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Link to="/dashboard/timesheets" className="group p-6 bg-white rounded-2xl shadow-soft border border-brand-border hover:shadow-lg transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Loader2 size={24} />
                                </div>
                            </div>
                            <h3 className="font-bold text-lg mb-1">Timesheets</h3>
                            <p className="text-sm text-brand-textMuted">Log hours and manage shifts.</p>
                        </Link>

                        <Link to="/dashboard/goals" className="group p-6 bg-white rounded-2xl shadow-soft border border-brand-border hover:shadow-lg transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <Loader2 size={24} />
                                </div>
                            </div>
                            <h3 className="font-bold text-lg mb-1">My Goals</h3>
                            <p className="text-sm text-brand-textMuted">Track objectives and key results.</p>
                        </Link>

                        <Link to="/dashboard/shifts" className="group p-6 bg-white rounded-2xl shadow-soft border border-brand-border hover:shadow-lg transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                    <Loader2 size={24} />
                                </div>
                            </div>
                            <h3 className="font-bold text-lg mb-1">Shifts</h3>
                            <p className="text-sm text-brand-textMuted">Browse and book volunteer shifts.</p>
                        </Link>
                    </div>
                </section>
            )}

            {/* Active Programs Section */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="text-brand-blue" size={20} />
                    <h2 className="text-xl font-bold text-brand-text">Active Programs</h2>
                </div>

                {activePrograms.length === 0 ? (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 text-center">
                        <FolderOpen className="mx-auto text-brand-textMuted mb-4" size={48} />
                        <h3 className="text-lg font-semibold text-brand-text mb-2">No Active Programs</h3>
                        <p className="text-brand-textMuted">
                            {role === "guest"
                                ? "There are no recruitment programs open at this time. Check back later!"
                                : "No programs are currently active for your role."
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activePrograms.map(program => (
                            <ProgramCard
                                key={program._id}
                                program={program}
                                userRole={role}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Admin Quick Access */}
            {isAdmin && (
                <section className="mt-8 pt-8 border-t border-brand-border">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-red-100 text-brand-wine text-xs px-2 py-1 rounded font-bold uppercase">Admin</span>
                        <h2 className="text-xl font-bold text-brand-text">System Administration</h2>
                    </div>
                    <Link
                        to="/dashboard/admin"
                        className="inline-flex items-center gap-2 bg-white rounded-xl px-6 py-3 shadow-soft border border-brand-border/50 hover:shadow-lg hover:border-brand-blue/50 transition-all font-medium text-brand-text"
                    >
                        Go to Admin Panel →
                    </Link>
                </section>
            )}
        </div>
    );
}

function getRoleGreeting(role: string): string {
    switch (role) {
        case "guest":
            return "Explore opportunities and start your application.";
        case "contributor":
        case "alumni":
            return "Stay connected with the organization.";
        case "member":
            return "View your active programs and tasks.";
        case "manager":
            return "Manage your team and review processes.";
        case "lead":
            return "Oversee department activities and team performance.";
        case "admin":
            return "Full system access enabled.";
        default:
            return "Here's what's available for you.";
    }
}
