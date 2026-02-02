import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Plus, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/Button";

export default function TimesheetLog() {
    const timesheets = useQuery(api.timesheets.getMyTimesheets);
    const logHours = useMutation(api.timesheets.logHours);

    const [isLogging, setIsLogging] = useState(false);
    const [duration, setDuration] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await logHours({
                date: Date.now(), // Simplified for MVP
                durationMinutes: parseInt(duration),
                activityDescription: description
            });
            setDuration("");
            setDescription("");
            setIsLogging(false);
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (timesheets === undefined) return <div className="p-8">Loading logs...</div>;

    const totalMinutes = timesheets.reduce((acc, t) => acc + t.durationMinutes, 0);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
                    <p className="text-gray-600">Log your volunteer hours.</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500 uppercase tracking-wide font-bold">Total Hours</p>
                    <p className="text-3xl font-bold text-brand-blue">{totalHours}</p>
                </div>
            </div>

            <div className="mb-8">
                {!isLogging ? (
                    <Button onClick={() => setIsLogging(true)}>
                        <Plus size={16} className="mr-2" />
                        Log Hours
                    </Button>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Minutes)</label>
                                <input
                                    type="number"
                                    required
                                    value={duration}
                                    onChange={e => setDuration(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:outline-none"
                                    placeholder="e.g. 120"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <CalendarIcon size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        disabled
                                        value={new Date().toLocaleDateString()}
                                        className="w-full pl-10 px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg text-gray-500"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Description</label>
                            <textarea
                                required
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:outline-none"
                                rows={3}
                                placeholder="What did you work on?"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsLogging(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting && <Loader2 size={16} className="animate-spin mr-2" />}
                                Submit Log
                            </Button>
                        </div>
                    </form>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 font-medium text-gray-500">
                        <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Activity</th>
                            <th className="px-6 py-4">Hours</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {timesheets.map((log) => (
                            <tr key={log._id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4 text-gray-600">
                                    {new Date(log.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">{log.activityDescription}</td>
                                <td className="px-6 py-4 text-gray-600">{(log.durationMinutes / 60).toFixed(1)} hrs</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                        ${log.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            log.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}
                                    `}>
                                        {log.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {timesheets.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No logs found.
                    </div>
                )}
            </div>
        </div>
    );
}
