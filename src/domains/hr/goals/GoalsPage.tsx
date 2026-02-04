
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Target, Loader2 } from "lucide-react";

export default function GoalsPage() {
    const goals = useQuery(api.domains.hr.goals.getMyGoals, {});

    if (goals === undefined) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-slate-800">My Goals</h1>
                <p className="text-slate-500">Track your personal and professional objectives.</p>
            </header>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Active Goals */}
                {goals.map((goal) => (
                    <div key={goal._id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <Target size={20} />
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${goal.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                {goal.status.replace('_', ' ')}
                            </span>
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-1">{goal.title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2">{goal.description}</p>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                            <span className="text-slate-400">Due {new Date(goal.dueDate || Date.now()).toLocaleDateString()}</span>
                            <span className="font-mono text-slate-600">{goal.progress || 0}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div
                                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${goal.progress || 0}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
