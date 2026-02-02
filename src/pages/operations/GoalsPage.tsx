import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Plus, Target, Check, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import type { Id } from "../../../convex/_generated/dataModel";

export default function GoalsPage() {
    const goals = useQuery(api.goals.getMyGoals, {});
    const createGoal = useMutation(api.goals.createGoal);
    const updateGoal = useMutation(api.goals.updateGoal);
    const deleteGoal = useMutation(api.goals.deleteGoal);

    const [isCreating, setIsCreating] = useState(false);
    const [newGoalTitle, setNewGoalTitle] = useState("");

    const handleCreate = async () => {
        if (!newGoalTitle.trim()) return;
        await createGoal({ title: newGoalTitle });
        setNewGoalTitle("");
        setIsCreating(false);
    };

    const handleUpdateProgress = async (goalId: Id<"goals">, currentProgress: number) => {
        // Simple toggle for MVP: 0 -> 100 or 100 -> 0
        const newProgress = currentProgress === 100 ? 0 : 100;
        const status = newProgress === 100 ? "completed" : "in_progress";
        await updateGoal({ goalId, progress: newProgress, status });
    };

    if (goals === undefined) return <div className="p-8">Loading goals...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Goals</h1>
                    <p className="text-gray-600">Track your objectives and key results.</p>
                </div>
                <Button onClick={() => setIsCreating(true)}>
                    <Plus size={16} className="mr-2" />
                    New Goal
                </Button>
            </div>

            {isCreating && (
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200 flex gap-2">
                    <input
                        type="text"
                        value={newGoalTitle}
                        onChange={(e) => setNewGoalTitle(e.target.value)}
                        placeholder="What do you want to achieve?"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        autoFocus
                    />
                    <Button onClick={handleCreate}>Save</Button>
                    <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                </div>
            )}

            <div className="space-y-4">
                {goals.map((goal) => (
                    <div key={goal._id} className="group bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-brand-blue transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => handleUpdateProgress(goal._id, goal.progress || 0)}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${goal.status === 'completed'
                                    ? "bg-green-500 border-green-500 text-white"
                                    : "border-gray-300 hover:border-brand-blue text-transparent"
                                    }`}
                            >
                                <Check size={12} />
                            </button>
                            <div>
                                <h3 className={`font-medium text-gray-900 ${goal.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                                    {goal.title}
                                </h3>
                                {goal.dueDate && (
                                    <p className="text-xs text-gray-500">Due {new Date(goal.dueDate).toLocaleDateString()}</p>
                                )}
                            </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => deleteGoal({ goalId: goal._id })}
                                className="text-gray-400 hover:text-red-500 p-2"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}

                {goals.length === 0 && !isCreating && (
                    <div className="text-center py-12 text-gray-500">
                        <Target size={48} className="mx-auto text-gray-300 mb-4" />
                        <p>No goals set yet. Set a goal to track your progress!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
