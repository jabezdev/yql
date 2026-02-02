
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams, Link } from "react-router-dom";
import { Loader2, Plus, ArrowLeft, Settings, Layers, Lock } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function ProgramDesigner() {
    const { programId } = useParams<{ programId: string }>();
    const program = useQuery(api.programs.getProgram, { programId: programId as Id<"programs"> });
    const stages = useQuery(api.stages.getProgramStages, { programId: programId as Id<"programs"> });

    if (program === undefined || stages === undefined) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
    }

    if (!program) return <div>Program not found</div>;

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/dashboard/admin/programs" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {program.name} <span className="text-gray-400 font-normal">/ Process Design</span>
                    </h1>
                    <p className="text-gray-500 text-sm">Configure stages and blocks for this program</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Horizontal Scrolling Pipeline or Vertical List? Vertical is better for complex configs */}
                <div className="md:col-span-1 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">Stages</h3>
                        <button className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1">
                            <Plus size={12} /> Add
                        </button>
                    </div>

                    <div className="space-y-2">
                        {stages?.map((stage: any) => (
                            <div key={stage._id} className="bg-white border rounded p-3 hover:border-blue-400 cursor-pointer shadow-sm group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold text-sm">{stage.name}</div>
                                        <div className="text-xs text-gray-400 capitalize">{stage.type.replace('_', ' ')}</div>
                                    </div>
                                    <Settings size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 hover:text-gray-600" />
                                </div>
                                <div className="mt-2 text-xs flex gap-1">
                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 flex items-center gap-0.5">
                                        <Layers size={10} /> {stage.blockIds?.length || 0}
                                    </span>
                                    {stage.roleAccess && (
                                        <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded flex items-center gap-0.5" title="Access Rules Configured">
                                            <Lock size={10} /> Rules
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {stages?.length === 0 && (
                            <div className="text-sm text-gray-400 italic text-center py-4 border border-dashed rounded bg-gray-50">
                                No stages defined.
                            </div>
                        )}
                    </div>
                </div>

                <div className="md:col-span-3 bg-white rounded-lg shadow-sm border min-h-[500px] flex items-center justify-center text-gray-400">
                    <div className="text-center">
                        <Layers size={48} className="mx-auto mb-2 opacity-20" />
                        <p>Select a stage to configure its content and permissions.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
