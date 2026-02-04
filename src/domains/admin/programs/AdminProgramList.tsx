
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { Plus, Edit, Layout, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import type { Doc } from "../../../../convex/_generated/dataModel";

export default function AdminProgramList() {
    const programs = useQuery(api.engine.programs.getAllPrograms, {});
    const createProgram = useMutation(api.engine.programs.createProgram);
    const [isCreating, setIsCreating] = useState(false);
    const [newItemName, setNewItemName] = useState("");

    const handleCreate = async () => {
        if (!newItemName) return;
        await createProgram({
            name: newItemName,
            slug: newItemName.toLowerCase().replace(/\s+/g, "-"),
            startDate: Date.now(),
            programType: "generic",
        });
        setNewItemName("");
        setIsCreating(false);
    };

    if (programs === undefined) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Programs</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    <Plus size={16} /> New Program
                </button>
            </div>

            {isCreating && (
                <div className="bg-white p-4 rounded shadow border flex gap-2">
                    <input
                        className="border p-2 rounded flex-1"
                        placeholder="Program Name"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                    />
                    <button onClick={handleCreate} className="bg-green-600 text-white px-4 py-2 rounded">Create</button>
                    <button onClick={() => setIsCreating(false)} className="text-gray-500 px-4 py-2">Cancel</button>
                </div>
            )}

            <div className="grid gap-4">
                {programs.map((program: Doc<"programs">) => (
                    <div key={program._id} className="bg-white p-4 rounded-lg shadow border flex justify-between items-center hover:border-blue-300 transition-colors">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">{program.name}</h3>
                                {program.isActive ? (
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Active</span>
                                ) : (
                                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Draft</span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 flex items-center gap-4 mt-1">
                                <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(program.startDate).toLocaleDateString()}</span>
                                <span className="text-xs font-mono bg-gray-50 px-1 rounded">{program.slug}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                to={`/dashboard/admin/programs/${program._id}/design`}
                                className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded hover:bg-indigo-100 text-sm font-medium"
                            >
                                <Layout size={14} /> Design Process
                            </Link>
                            <Link
                                to={`/dashboard/admin/programs/${program._id}/settings`}
                                className="p-2 text-gray-400 hover:text-blue-600 rounded bg-gray-50 hover:bg-blue-50"
                            >
                                <Edit size={16} />
                            </Link>
                        </div>
                    </div>
                ))}

                {programs.length === 0 && (
                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded border border-dashed">
                        No programs found. Create one to get started.
                    </div>
                )}
            </div>
        </div>
    );
}
