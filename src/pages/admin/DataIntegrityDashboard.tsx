import { Activity, Database, FileText, Loader2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function DataIntegrityDashboard() {
    const recentLogs = useQuery(api.auditLog.getRecentLogs, { limit: 10 });
    const stats = useQuery(api.auditLog.getAuditStats, { sinceDaysAgo: 7 });

    if (!recentLogs || !stats) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-8">
            <header>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-red-100 text-brand-wine rounded-full text-xs font-bold uppercase tracking-wider">
                        Admin Area
                    </span>
                </div>
                <h1 className="text-3xl font-bold text-brand-text mt-2 mb-2">
                    Data Integrity & Audit
                </h1>
                <p className="text-brand-textMuted text-lg">
                    Monitor system health, audit logs, and data consistency.
                </p>
            </header>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-soft border border-brand-border/50 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-100 text-brand-blue rounded-xl">
                            <Activity size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-brand-text">Activity (7d)</h3>
                    </div>
                    <p className="text-3xl font-bold font-lexend text-brand-darkBlue mb-1">
                        {stats.totalActions}
                    </p>
                    <p className="text-brand-textMuted text-sm">
                        Actions performed by {stats.uniqueActors} unique users.
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-soft border border-brand-border/50 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                            <FileText size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-brand-text">Audit Logs</h3>
                    </div>
                    <div className="space-y-2 mb-4 max-h-[120px] overflow-hidden relative">
                        {recentLogs.slice(0, 3).map(log => (
                            <div key={log._id} className="text-sm truncate">
                                <span className="font-mono text-xs bg-gray-100 px-1 rounded mr-2">
                                    {log.action}
                                </span>
                                <span className="text-gray-500">{new Date(log.createdAt).toLocaleTimeString()}</span>
                            </div>
                        ))}
                        <div className="absolute bottom-0 w-full h-8 bg-gradient-to-t from-white to-transparent"></div>
                    </div>
                    <button className="text-brand-blue font-medium hover:underline text-sm">
                        View All Logs →
                    </button>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-soft border border-brand-border/50 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                            <Database size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-brand-text">Storage</h3>
                    </div>
                    <p className="text-brand-textMuted">
                        No storage quota limits configured.
                    </p>
                </div>
            </div>

            {/* Detailed Logs Table Section Placeholder */}
            <section className="bg-white rounded-2xl p-6 border border-brand-border/50">
                <h3 className="font-bold text-lg mb-4">Recent Audit Log Entries</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                            <tr>
                                <th className="px-4 py-3">Time</th>
                                <th className="px-4 py-3">Actor</th>
                                <th className="px-4 py-3">Action</th>
                                <th className="px-4 py-3">Entity</th>
                                <th className="px-4 py-3">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentLogs.map(log => (
                                <tr key={log._id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                        {log.actorName}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-blue-50 text-blue-700 border border-blue-100">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        <span className="font-mono text-xs">{log.entityType}</span>:{log.entityId.slice(0, 8)}...
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 font-mono text-xs truncate max-w-[200px]">
                                        {JSON.stringify(log.changes || log.metadata || {})}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

        </div>
    );
}
