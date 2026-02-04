import { Settings, Shield, Sliders, Database } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
    return (
        <div className="space-y-8">
            <header>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-red-100 text-brand-wine rounded-full text-xs font-bold uppercase tracking-wider">System Admin</span>
                </div>
                <h1 className="text-3xl font-bold text-brand-text mt-2 mb-2">
                    System Configuration
                </h1>
                <p className="text-brand-textMuted text-lg">
                    Manage global settings, roles, and schema configurations.
                </p>
            </header>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link to="/dashboard/admin/org" className="group">
                    <div className="bg-white rounded-2xl p-6 shadow-soft border border-brand-border/50 h-full hover:shadow-lg hover:border-brand-blue/50 transition-all duration-300">
                        <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-darkBlue group-hover:text-white transition-colors">
                            <Database size={24} />
                            {/* Using Database icon as placeholder, ideally FolderTree */}
                        </div>
                        <h3 className="text-lg font-bold text-brand-text mb-2">Organization</h3>
                        <p className="text-sm text-brand-textMuted">Departments and hierarchy.</p>
                    </div>
                </Link>

                <Link to="/dashboard/admin/users" className="group">
                    <div className="bg-white rounded-2xl p-6 shadow-soft border border-brand-border/50 h-full hover:shadow-lg hover:border-brand-blue/50 transition-all duration-300">
                        <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-darkBlue group-hover:text-white transition-colors">
                            <Shield size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-brand-text mb-2">Staff & Matrix</h3>
                        <p className="text-sm text-brand-textMuted">Manage staff and reporting lines.</p>
                    </div>
                </Link>

                <Link to="/dashboard/admin/roles" className="group">
                    <div className="bg-white rounded-2xl p-6 shadow-soft border border-brand-border/50 h-full hover:shadow-lg hover:border-brand-blue/50 transition-all duration-300">
                        <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-darkBlue group-hover:text-white transition-colors">
                            <Shield size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-brand-text mb-2">Roles</h3>
                        <p className="text-sm text-brand-textMuted">Permissions and access control.</p>
                    </div>
                </Link>

                <Link to="/dashboard/admin/programs" className="group">
                    <div className="bg-white rounded-2xl p-6 shadow-soft border border-brand-border/50 h-full hover:shadow-lg hover:border-brand-blue/50 transition-all duration-300">
                        <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-darkBlue group-hover:text-white transition-colors">
                            <Sliders size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-brand-text mb-2">Pipelines</h3>
                        <p className="text-sm text-brand-textMuted">Configure recruitment and process pipelines.</p>
                    </div>
                </Link>

                <Link to="/dashboard/admin/settings" className="group">
                    <div className="bg-white rounded-2xl p-6 shadow-soft border border-brand-border/50 h-full hover:shadow-lg hover:border-brand-blue/50 transition-all duration-300">
                        <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-darkBlue group-hover:text-white transition-colors">
                            <Settings size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-brand-text mb-2">Global Settings</h3>
                        <p className="text-sm text-brand-textMuted">Application-wide configuration variables.</p>
                    </div>
                </Link>

                <Link to="/dashboard/admin/integrity" className="group">
                    <div className="bg-white rounded-2xl p-6 shadow-soft border border-brand-border/50 h-full hover:shadow-lg hover:border-brand-blue/50 transition-all duration-300">
                        <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-darkBlue group-hover:text-white transition-colors">
                            <Database size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-brand-text mb-2">Data Integrity</h3>
                        <p className="text-sm text-brand-textMuted">View audit logs and system health.</p>
                    </div>
                </Link>

            </div>
        </div>
    );
}
