import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Save, ArrowLeft } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function ProgramSettings() {
    const { programId } = useParams();
    const navigate = useNavigate();

    // Convert string param to ID or skip query if undefined
    const id = programId as Id<"programs">;
    const program = useQuery(api.engine.programs.getProgram, id ? { programId: id } : "skip");
    const updateProgram = useMutation(api.engine.programs.updateProgram);

    if (!program) return <div>Loading...</div>;

    const initialData = {
        name: program.name,
        slug: program.slug,
        isActive: program.isActive,
        programType: program.programType || "generic" as string
    };

    return (
        <ProgramSettingsForm
            initialData={initialData}
            onSave={async (data) => {
                await updateProgram({
                    programId: id,
                    name: data.name,
                    slug: data.slug,
                    isActive: data.isActive,
                    programType: data.programType
                });
                navigate("/dashboard/admin/programs");
            }}
            onBack={() => navigate(-1)}
        />
    );
}

function ProgramSettingsForm({ initialData, onSave, onBack }: {
    initialData: { name: string, slug: string, isActive: boolean, programType: string },
    onSave: (data: any) => void,
    onBack: () => void
}) {
    const [formData, setFormData] = useState(initialData);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold">Program Settings</h1>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Program Name</label>
                    <input
                        className="w-full border p-2 rounded"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Slug (URL Identifier)</label>
                    <input
                        className="w-full border p-2 rounded bg-gray-50"
                        value={formData.slug}
                        onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select
                        className="w-full border p-2 rounded"
                        value={formData.programType}
                        onChange={e => setFormData({ ...formData, programType: e.target.value })}
                    >
                        <option value="recruitment_cycle">Recruitment Cycle</option>
                        <option value="survey_campaign">Survey Campaign</option>
                        <option value="generic">Generic</option>
                    </select>
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <input
                        type="checkbox"
                        id="activeCheck"
                        className="w-5 h-5"
                        checked={formData.isActive}
                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <label htmlFor="activeCheck" className="font-medium">Is Active Program?</label>
                </div>
                <p className="text-sm text-gray-500 pl-8">
                    Only one program can be active at a time. Activating this will deactivate others.
                </p>

                <div className="pt-6 flex gap-3">
                    <button
                        onClick={() => onSave(formData)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                    >
                        <Save size={18} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
