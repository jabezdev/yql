import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { getAuthUser } from "../../../lib/auth";
import { Plus, Trash2, Edit2, Save } from "lucide-react";
import * as Icons from "lucide-react";

import { useEffect } from "react";


const IconPicker = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
    // Limited set for now, or use a fuzzy search
    const commons = ["LayoutTemplate", "FileText", "Mic", "PenTool", "CheckCircle2", "Video", "Terminal", "Code", "Camera", "Calendar", "Headphones", "MapPin"];
    const IconMap = Icons as unknown as Record<string, React.ElementType>;

    return (
        <div className="flex gap-2 flex-wrap mt-1">
            {commons.map(iconName => {
                const Icon = IconMap[iconName];
                if (!Icon) return null;
                return (
                    <button
                        key={iconName}
                        type="button"
                        onClick={() => onChange(iconName)}
                        className={`p-2 rounded border hover:bg-gray-50 ${value === iconName ? 'bg-blue-50 border-brand-blue text-brand-blue' : 'text-gray-500'}`}
                        title={iconName}
                    >
                        <Icon size={18} />
                    </button>
                )
            })}
        </div>
    )
}

export default function StageTypeManager() {
    const user = getAuthUser();
    const types = useQuery(api.stageTypes.getAll);
    const createType = useMutation(api.stageTypes.create);
    const updateType = useMutation(api.stageTypes.update);
    const removeType = useMutation(api.stageTypes.remove);
    const seed = useMutation(api.stageTypes.seedDefaults);

    useEffect(() => {
        if (types && types.length === 0) {
            seed({ token: user?.token || "" });
        }
    }, [types, seed, user]);

    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [key, setKey] = useState("");
    const [label, setLabel] = useState("");
    const [kind, setKind] = useState("static");
    const [icon, setIcon] = useState("LayoutTemplate");
    const [desc, setDesc] = useState("");

    if (!types) return <div>Loading stage types...</div>;

    if (!types) return <div>Loading stage types...</div>;

    // IconPicker moved outside to avoid re-creation on render
    // logic below


    const resetForm = () => {
        setKey(""); setLabel(""); setKind("static"); setIcon("LayoutTemplate"); setDesc("");
        setIsCreating(false); setEditingId(null);
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await updateType({ token: user?.token || "", id: editingId as any, label, kind, icon, description: desc });
            } else {
                await createType({ token: user?.token || "", key, label, kind, icon, description: desc });
            }
            resetForm();
        } catch (err: any) {
            alert("Error: " + err.message);
        }
    }

    const startEdit = (t: any) => {
        setEditingId(t._id);
        setKey(t.key); // Key cannot be changed on edit usually, but shown
        setLabel(t.label);
        setKind(t.kind);
        setIcon(t.icon);
        setDesc(t.description || "");
        setIsCreating(true);
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Stage Types</h2>
                    <p className="text-gray-500">Define the building blocks available for your pipelines.</p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => { resetForm(); setIsCreating(true); }}
                        className="bg-brand-blue text-white px-4 py-2 rounded font-bold hover:bg-brand-blueDark transition flex items-center gap-2"
                    >
                        <Plus size={18} /> New Type
                    </button>
                )}
            </div>

            {isCreating && (
                <div className="bg-gray-50 border p-6 rounded-lg mb-8 animate-fade-in shadow-sm">
                    <h3 className="font-bold mb-4 text-brand-blueDark flex items-center gap-2">
                        {editingId ? <Edit2 size={16} /> : <Plus size={16} />}
                        {editingId ? `Edit ${key}` : "Create New Stage Type"}
                    </h3>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unique Key</label>
                                <input
                                    className="w-full border p-2 rounded text-sm font-mono"
                                    value={key}
                                    onChange={e => setKey(e.target.value)}
                                    disabled={!!editingId}
                                    placeholder="e.g. video-interview"
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">Used in code and database references. Cannot change once set.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Display Label</label>
                                <input className="w-full border p-2 rounded text-sm" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Video Interview" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Base Behavior (Kind)</label>
                                <select className="w-full border p-2 rounded text-sm" value={kind} onChange={e => setKind(e.target.value)}>
                                    <option value="static">Static (Info / Instructions)</option>
                                    <option value="form">Form (Data Collection)</option>
                                    <option value="completed">Completed (End State)</option>
                                </select>
                                <p className="text-xs text-gray-400 mt-1">Determines how the system renders this stage.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Icon</label>
                                <IconPicker value={icon} onChange={setIcon} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description Template</label>
                            <textarea
                                className="w-full border p-2 rounded text-sm h-20"
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                                placeholder="Default description instructions..."
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-bold">Cancel</button>
                            <button type="submit" className="bg-brand-blue text-white px-6 py-2 rounded font-bold hover:bg-brand-blueDark transition flex items-center gap-2">
                                <Save size={16} /> Save Type
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {types.map((t) => {
                    const IconMap = Icons as unknown as Record<string, React.ElementType>;
                    const Icon = IconMap[t.icon] || Icons.LayoutTemplate;
                    return (
                        <div key={t._id} className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition group relative">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-2 bg-blue-50 text-brand-blue rounded-lg">
                                    <Icon size={24} />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                    <button onClick={() => startEdit(t)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-brand-blue"><Edit2 size={14} /></button>
                                    <button
                                        onClick={() => { if (confirm("Delete this type?")) removeType({ token: user?.token || "", id: t._id }); }}
                                        className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-red-500"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <h4 className="font-bold text-gray-800">{t.label}</h4>
                            <div className="flex items-center gap-2 mt-1 mb-2">
                                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{t.key}</code>
                                <span className="text-xs text-gray-400 capitalize">• {t.kind}</span>
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-2">{t.description}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
