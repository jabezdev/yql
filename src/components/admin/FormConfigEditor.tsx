import { type FormField } from "../../components/dynamic/DynamicForm";
import { Trash2, Plus, Type, FileText, List, Mail, Hash, GripVertical } from "lucide-react";

interface FormConfigEditorProps {
    fields: FormField[];
    onChange: (newFields: FormField[]) => void;
}

export default function FormConfigEditor({ fields, onChange }: FormConfigEditorProps) {
    const addField = () => {
        const newField: FormField = {
            id: `field_${Date.now()}`,
            label: "New Question",
            type: "text",
            required: false,
            options: []
        };
        onChange([...fields, newField]);
    };

    const updateField = (index: number, updates: Partial<FormField>) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], ...updates };
        onChange(newFields);
    };

    const removeField = (index: number) => {
        const newFields = fields.filter((_, i) => i !== index);
        onChange(newFields);
    };

    return (
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200 mt-2">
            <h4 className="font-bold text-xs uppercase text-gray-500 tracking-wider mb-2">Form Questions</h4>

            {fields.length === 0 && <p className="text-sm text-center text-gray-400 italic py-4">No questions defined yet.</p>}

            {fields.map((field, idx) => (
                <div key={field.id} className="bg-white p-3 rounded border shadow-sm space-y-3 hover:border-brand-blue/30 transition group">
                    <div className="flex gap-2 items-start">
                        <div className="pt-2 text-gray-300 cursor-grab hover:text-gray-500">
                            <GripVertical size={16} />
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Question Label</label>
                                    <input
                                        className="w-full border p-1.5 rounded text-sm focus:border-brand-blue outline-none"
                                        value={field.label}
                                        onChange={(e) => updateField(idx, { label: e.target.value })}
                                        placeholder="e.g. Why do you want to join?"
                                    />
                                </div>
                                <div className="w-1/3">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Input Type</label>
                                    <div className="relative">
                                        <select
                                            className="w-full border p-1.5 rounded text-sm bg-gray-50 appearance-none focus:border-brand-blue outline-none"
                                            value={field.type}
                                            onChange={(e) => updateField(idx, { type: e.target.value })}
                                        >
                                            <option value="text">Short Text</option>
                                            <option value="textarea">Long Text (Paragraph)</option>
                                            <option value="select">Dropdown Selection</option>
                                            <option value="email">Email Address</option>
                                            <option value="number">Number</option>
                                            <option value="date">Date Picker</option>
                                            <option value="url">URL / Link</option>
                                        </select>
                                        <div className="absolute right-2 top-2 pointer-events-none text-gray-400">
                                            {field.type === 'text' && <Type size={14} />}
                                            {field.type === 'textarea' && <FileText size={14} />}
                                            {field.type === 'select' && <List size={14} />}
                                            {field.type === 'email' && <Mail size={14} />}
                                            {field.type === 'number' && <Hash size={14} />}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contextual Options */}
                            {field.type === 'select' && (
                                <div className="bg-blue-50 p-2 rounded border border-blue-100">
                                    <label className="text-[10px] font-bold text-blue-400 uppercase">Dropdown Options (Comma separated)</label>
                                    <input
                                        className="w-full border border-blue-200 p-1.5 rounded text-sm"
                                        placeholder="Option 1, Option 2, Option 3"
                                        value={field.options?.join(', ') || ""}
                                        onChange={(e) => updateField(idx, { options: e.target.value.split(',').map(s => s.trim()) })}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 items-center pl-6 pt-2 border-t border-gray-50">
                        <div className="flex-1">
                            <input
                                className="border-none bg-transparent text-xs text-gray-400 font-mono w-full focus:text-gray-600 outline-none"
                                value={field.id}
                                onChange={(e) => updateField(idx, { id: e.target.value })}
                                title="Field ID (Internal)"
                            />
                        </div>
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer select-none hover:bg-gray-100 px-2 py-1 rounded">
                            <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateField(idx, { required: e.target.checked })}
                                className="accent-brand-blue"
                            />
                            Required
                        </label>
                        <button
                            onClick={() => removeField(idx)}
                            className="text-gray-300 hover:text-red-500 transition p-1"
                            title="Remove Question"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}

            <button
                onClick={addField}
                className="w-full py-2 border border-dashed border-gray-300 rounded text-brand-blue hover:bg-blue-50 hover:border-brand-blue transition text-sm font-bold flex items-center justify-center gap-2"
            >
                <Plus size={16} /> Add Question
            </button>
        </div>
    );
}
