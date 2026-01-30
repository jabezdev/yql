import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import FormConfigEditor from "./FormConfigEditor";
import { type FormField } from "../../components/dynamic/DynamicForm";
import { GripVertical, ChevronDown, ChevronUp, Trash2, Edit2 } from "lucide-react";
import * as Icons from "lucide-react";
import { STAGE_TYPES as FALLBACK_TYPES } from "../../constants/pipeline";

interface PipelineStage {
    id: string;
    name: string;
    type: string;
    // Store metadata for rendering without lookup
    kind?: string;
    icon?: string;
    description?: string;
    formConfig?: FormField[];
    assignees?: string[];
}

interface PipelineEditorProps {
    pipeline: PipelineStage[];
    onChange: (newPipeline: PipelineStage[]) => void;
}

export default function PipelineEditor({ pipeline, onChange }: PipelineEditorProps) {
    const [expandedStageId, setExpandedStageId] = useState<string | null>(null);
    const dbTypes = useQuery(api.stageTypes.getAll);

    // Merge DB types with fallbacks if DB is empty or loading (though loading returns undefined)
    const availableTypes = dbTypes || [];
    // If DB is empty, maybe use fallbacks? Or maybe seedDefaults takes care of it.
    // Let's assume seedDefaults runs. But for safety, if availableTypes is empty, use fallbacks mapped.
    const effectiveTypes = availableTypes.length > 0 ? availableTypes : FALLBACK_TYPES.map(t => ({
        key: t.value,
        label: t.label,
        kind: t.value === 'form' ? 'form' : t.value === 'completed' ? 'completed' : 'static',
        icon: t.value === 'form' ? 'FileText' : t.value === 'interview' ? 'Mic' : 'LayoutTemplate',
        description: ''
    }));

    const addStage = () => {
        const defaultType = effectiveTypes[0] || { key: 'static', kind: 'static', icon: 'LayoutTemplate' };
        const newStage: PipelineStage = {
            id: `stage_${Date.now()}`,
            name: "New Stage",
            type: defaultType.key,
            kind: defaultType.kind,
            icon: defaultType.icon,
            description: "",
            formConfig: []
        };
        onChange([...pipeline, newStage]);
        setExpandedStageId(newStage.id);
    };

    const updateStage = (index: number, updates: Partial<PipelineStage>) => {
        const newPipeline = [...pipeline];
        newPipeline[index] = { ...newPipeline[index], ...updates };

        // If type changed, update metadata
        if (updates.type) {
            const typeDef = effectiveTypes.find(t => t.key === updates.type);
            if (typeDef) {
                newPipeline[index].kind = typeDef.kind;
                newPipeline[index].icon = typeDef.icon;
                if (!newPipeline[index].description && typeDef.description) {
                    newPipeline[index].description = typeDef.description;
                }
            }
        }
        onChange(newPipeline);
    };

    const removeStage = (index: number) => {
        if (!confirm("Delete this stage?")) return;
        const newPipeline = pipeline.filter((_, i) => i !== index);
        onChange(newPipeline);
    };

    const moveStage = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === pipeline.length - 1) return;

        const newPipeline = [...pipeline];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        const temp = newPipeline[swapIndex];
        newPipeline[swapIndex] = newPipeline[index];
        newPipeline[index] = temp;
        onChange(newPipeline);
    };

    const getIcon = (iconName?: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Icon = (Icons as any)[iconName || 'LayoutTemplate'] || Icons.LayoutTemplate;
        return <Icon size={16} className="text-gray-500" />;
    }

    return (
        <div className="space-y-4">
            {pipeline.map((stage, idx) => (
                <div key={stage.id} className={`border rounded-lg bg-white shadow-sm overflow-hidden transition-all ${expandedStageId === stage.id ? 'ring-2 ring-brand-blue ring-offset-1' : ''}`}>
                    {/* Header / Summary Row */}
                    <div className="p-3 bg-white flex items-center gap-4 border-b border-gray-100 hover:bg-gray-50">
                        <div className="cursor-grab text-gray-300 hover:text-gray-500"><GripVertical size={18} /></div>
                        <div className="font-bold text-gray-400 w-6 text-sm">{idx + 1}.</div>
                        <div className="flex-1">
                            <div className="font-bold text-gray-800 flex items-center gap-2">
                                {getIcon(stage.icon)}
                                {stage.name}
                            </div>
                        </div>
                        <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase tracking-wide font-medium">{stage.type}</div>

                        <div className="flex items-center gap-1 border-l pl-3 ml-2">
                            <button onClick={() => moveStage(idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 text-gray-500"><ChevronUp size={16} /></button>
                            <button onClick={() => moveStage(idx, 'down')} disabled={idx === pipeline.length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 text-gray-500"><ChevronDown size={16} /></button>
                            <button
                                onClick={() => setExpandedStageId(expandedStageId === stage.id ? null : stage.id)}
                                className={`px-3 py-1 text-xs font-bold border rounded transition ml-2 flex items-center gap-1 ${expandedStageId === stage.id ? 'bg-brand-blue text-white border-brand-blue' : 'text-brand-blue border-brand-blue hover:bg-blue-50'}`}
                            >
                                <Edit2 size={12} /> {expandedStageId === stage.id ? "Done" : "Edit"}
                            </button>
                            <button onClick={() => removeStage(idx)} className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded ml-1"><Trash2 size={16} /></button>
                        </div>
                    </div>

                    {/* Detailed Editor (Collapsible) */}
                    {expandedStageId === stage.id && (
                        <div className="p-6 bg-gray-50/50 space-y-6 animate-fadeIn">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Stage Name</label>
                                    <input
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-brand-blue/20 outline-none"
                                        value={stage.name}
                                        onChange={(e) => updateStage(idx, { name: e.target.value })}
                                        placeholder="e.g. Initial Interview"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Stage Type</label>
                                    <select
                                        className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-brand-blue/20 outline-none"
                                        value={stage.type}
                                        onChange={(e) => updateStage(idx, { type: e.target.value })}
                                    >
                                        {effectiveTypes.map(t => (
                                            <option key={t.key} value={t.key}>{t.label}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Kind: <span className="font-mono">{stage.kind || 'static'}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Stage ID (URL Slug)</label>
                                    <input
                                        className="w-full border p-2 rounded font-mono text-sm bg-white"
                                        value={stage.id}
                                        onChange={(e) => updateStage(idx, { id: e.target.value })}
                                    />
                                </div>
                                <div>
                                    {/* Placeholder for future automations */}
                                    <div className="text-xs text-gray-400 mt-6 flex items-center gap-1">
                                        <div className="h-2 w-2 rounded-full bg-green-400"></div> Automations Config (Coming Soon)
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Description / User Instructions</label>
                                <textarea
                                    className="w-full border p-2 rounded h-24 focus:ring-2 focus:ring-brand-blue/20 outline-none"
                                    value={stage.description || ""}
                                    placeholder="Enter instructions for the applicant here..."
                                    onChange={(e) => updateStage(idx, { description: e.target.value })}
                                />
                            </div>

                            {/* Render Form Editor if Type is Form or Kind is Form */}
                            {(stage.kind === 'form' || stage.type === 'form') && (
                                <div className="border-t border-gray-200 pt-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-1 bg-blue-100 rounded text-brand-blue"><Icons.FileText size={16} /></div>
                                        <h5 className="font-bold text-gray-800">Form Configuration</h5>
                                    </div>
                                    <FormConfigEditor
                                        fields={stage.formConfig || []}
                                        onChange={(newFields) => updateStage(idx, { formConfig: newFields })}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}

            <button
                onClick={addStage}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-brand-blue hover:text-brand-blue hover:bg-blue-50 font-bold transition flex items-center justify-center gap-2 group"
            >
                <div className="bg-gray-200 text-gray-500 rounded-full p-1 group-hover:bg-brand-blue group-hover:text-white transition"><Icons.Plus size={20} /></div>
                Add Pipeline Stage
            </button>
        </div>
    );
}
