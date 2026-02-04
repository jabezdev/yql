import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Calendar, Clock, Plus, Loader2 } from "lucide-react";

export default function TimesheetsPage() {
    const timesheets = useQuery(api.domains.hr.timesheets.getMyTimesheets, {});
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    if (timesheets === undefined) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">My Timesheets</h1>
                    <p className="text-slate-500">Track your volunteer hours and shifts.</p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={18} />
                    Log Hours
                </button>
            </header>

            {/* Timesheet List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {timesheets.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <Clock className="mx-auto mb-4 opacity-50" size={48} />
                        <p>No timesheets logged yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {timesheets.map((entry) => (
                            <div key={entry._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-800">
                                            {entry.activityDescription || "Volunteer Activity"}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {new Date(entry.date).toLocaleDateString()} • {entry.durationMinutes} minutes
                                        </p>
                                    </div>
                                </div>
                                <StatusBadge status={entry.status} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal (Simplified for demo) */}
            {isCreateOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Log Volunteer Hours</h2>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Date</label>
                                <input type="date" className="w-full border rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Duration (Minutes)</label>
                                <input type="number" className="w-full border rounded-lg p-2" placeholder="60" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea className="w-full border rounded-lg p-2" rows={3} placeholder="What did you do?" />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Submit Log
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        pending: "bg-yellow-100 text-yellow-700",
        approved: "bg-green-100 text-green-700",
        rejected: "bg-red-100 text-red-700",
    }[status] || "bg-slate-100 text-slate-700";

    const label = status.charAt(0).toUpperCase() + status.slice(1);

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}>
            {label}
        </span>
    );
}
