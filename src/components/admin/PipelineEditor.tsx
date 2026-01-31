import { useState } from "react";
import FormConfigEditor from "./FormConfigEditor";
import { type FormField } from "../../components/dynamic/DynamicForm";
import { GripVertical, ChevronDown, ChevronUp, Trash2, Edit2, Save, Download } from "lucide-react";
import * as Icons from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

import { STAGE_TYPE_LIST } from "../../constants/stages";

interface PipelineStage {
    id: string;
    name: string;
    type: string;
    // Store metadata for rendering without lookup
    kind?: string;
    icon?: any; // changed string to any to support icon component or string from earlier
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
    const templates = useQuery(api.stages.listTemplates);
    const saveTemplate = useMutation(api.stages.createTemplate);
    const [showTemplates, setShowTemplates] = useState(false);

    // Use hardcoded constants
    const effectiveTypes = STAGE_TYPE_LIST;

    const addStage = () => {
        const defaultType = effectiveTypes[0] || { key: 'static', kind: 'static', icon: Icons.LayoutTemplate };
        // We only store persistable data. Kind/Icon are derived from type.
        const newStage: PipelineStage = {
            id: `stage_${Date.now()}`,
            name: "New Stage",
            type: defaultType.key,
            description: "",
            formConfig: []
        };
        onChange([...pipeline, newStage]);
        setExpandedStageId(newStage.id);
    };

    const addFromTemplate = (template: any) => {
        const newStage: PipelineStage = {
            id: `stage_${Date.now()}`,
            name: template.name,
            type: template.type,
            description: template.description || "",
            formConfig: template.config?.formConfig || [],
            // Copy other props if needed
        };
        onChange([...pipeline, newStage]);
        setExpandedStageId(newStage.id);
        setShowTemplates(false);
    };

    const handleSaveTemplate = async (stage: PipelineStage) => {
        const name = prompt("Enter a name for this template:", stage.name);
        if (!name) return;

        try {
            await saveTemplate({
                name,
                type: stage.type,
                description: stage.description,
                config: { formConfig: stage.formConfig },
                // automations
            });
            alert("Template saved!");
        } catch (e) {
            alert("Error saving template: " + e);
        }
    };

    const updateStage = (index: number, updates: Partial<PipelineStage>) => {
        const newPipeline = [...pipeline];
        newPipeline[index] = { ...newPipeline[index], ...updates };

        // If type changed, update description if needed, but don't store kind/icon
        if (updates.type) {
            const typeDef = effectiveTypes.find(t => t.key === updates.type);
            if (typeDef) {
                // Update description if it's empty
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

    const getIcon = (icon: any) => {
        if (!icon) return <Icons.LayoutTemplate size={16} className="text-gray-500" />;

        // If it's a string (legacy from DB), look it up
        if (typeof icon === 'string') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const Icon = (Icons as any)[icon] || Icons.LayoutTemplate;
            return <Icon size={16} className="text-gray-500" />;
        }

        // If it's a component (from constants)
        const Icon = icon;
        return <Icon size={16} className="text-gray-500" />;
    }

    return (
        <div className="space-y-4">
            {pipeline.map((stage, idx) => {
                const typeDef = effectiveTypes.find(t => t.key === stage.type);
                const derivedIcon = typeDef?.icon || stage.icon;
                const derivedKind = typeDef?.kind || stage.kind || 'static';

                return (
                    <div key={stage.id} className={`border rounded-lg bg-white shadow-sm overflow-hidden transition-all ${expandedStageId === stage.id ? 'ring-2 ring-brand-blue ring-offset-1' : ''}`}>
                        {/* Header / Summary Row */}
                        <div className="p-3 bg-white flex items-center gap-4 border-b border-gray-100 hover:bg-gray-50">
                            <div className="cursor-grab text-gray-300 hover:text-gray-500"><GripVertical size={18} /></div>
                            <div className="font-bold text-gray-400 w-6 text-sm">{idx + 1}.</div>
                            <div className="flex-1">
                                <div className="font-bold text-gray-800 flex items-center gap-2">
                                    {getIcon(derivedIcon)}
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
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-xs font-bold text-gray-500 uppercase">Stage Name</label>
                                            <button
                                                onClick={() => handleSaveTemplate(stage)}
                                                className="text-xs text-brand-blue hover:underline flex items-center gap-1"
                                                title="Save as reusable template"
                                            >
                                                <Save size={12} /> Save as Template
                                            </button>
                                        </div>
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
                                            Kind: <span className="font-mono">{derivedKind}</span>
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
                                {(derivedKind === 'form' || stage.type === 'form') && (
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
                );
            })}

            <div className="flex gap-2">
                <button
                    onClick={addStage}
                    className="flex-1 py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-brand-blue hover:text-brand-blue hover:bg-blue-50 font-bold transition flex items-center justify-center gap-2 group"
                >
                    <div className="bg-gray-200 text-gray-500 rounded-full p-1 group-hover:bg-brand-blue group-hover:text-white transition"><Icons.Plus size={20} /></div>
                    Add New Stage
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowTemplates(!showTemplates)}
                        className="h-full px-6 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-brand-orange hover:text-brand-orange hover:bg-orange-50 font-bold transition flex items-center justify-center gap-2"
                        title="Load from Template"
                    >
                        <Download size={20} /> Templates
                    </button>

                    {showTemplates && (
                        <div className="absolute bottom-full right-0 mb-2 w-64 bg-white shadow-xl rounded-lg border p-2 z-20">
                            <h4 className="font-bold text-xs text-gray-500 uppercase px-2 py-1 mb-1">Available Templates</h4>
                            {templates?.map(t => (
                                <button
                                    key={t._id}
                                    onClick={() => addFromTemplate(t)}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm font-medium flex items-center justify-between group"
                                >
                                    {t.name}
                                    <span className="text-xs text-gray-400 group-hover:text-brand-blue">{t.type}</span>
                                </button>
                            ))}
                            {(!templates || templates.length === 0) && (
                                <div className="px-3 py-2 text-xs text-gray-400 italic">No templates saved yet.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
