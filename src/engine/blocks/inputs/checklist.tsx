import React, { useState } from "react";
import { type BlockConfigProps, type ApplicantViewProps, type ReviewerViewProps } from "../registry";
import { Check, Plus, Trash2 } from "lucide-react";

// --- Configuration Editor ---
export const ConfigEditor: React.FC<BlockConfigProps> = ({ config, onChange }) => {
    const [newItem, setNewItem] = useState("");

    const addItem = () => {
        if (!newItem) return;
        const items = config.items || [];
        onChange({ ...config, items: [...items, newItem] });
        setNewItem("");
    };

    const removeItem = (idx: number) => {
        const items = (config.items || []).filter((_: any, i: number) => i !== idx);
        onChange({ ...config, items });
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Checklist Items</label>
                <div className="space-y-2 mb-2">
                    {(config.items || []).map((item: string, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center bg-white p-2 border rounded">
                            <span className="flex-1 text-sm">{item}</span>
                            <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        value={newItem}
                        onChange={e => setNewItem(e.target.value)}
                        placeholder="New Checklist Item..."
                        className="flex-1 border p-2 rounded text-sm"
                        onKeyDown={e => e.key === 'Enter' && addItem()}
                    />
                    <button onClick={addItem} className="bg-gray-100 px-3 py-1 rounded font-bold hover:bg-gray-200">
                        <Plus size={16} /> Add
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Applicant View ---
export const ParticipantView: React.FC<ApplicantViewProps> = ({ block, value, onChange, readOnly }) => {
    const { config } = block;
    // value = { [itemIdx]: boolean }
    const checks = value || {};

    const toggle = (idx: number) => {
        onChange({ ...checks, [idx]: !checks[idx] });
    };

    return (
        <div className="mb-6 p-4 bg-white border rounded-xl shadow-sm">
            <h4 className="font-bold text-gray-700 mb-4">{config.label || "Checklist"}</h4>
            <div className="space-y-3">
                {(config.items || []).map((item: string, idx: number) => (
                    <label key={idx} className="flex items-start gap-3 cursor-pointer select-none">
                        <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${checks[idx] ? 'bg-brand-blue border-brand-blue text-white' : 'bg-white border-gray-300'}`}>
                            {checks[idx] && <Check size={12} strokeWidth={4} />}
                        </div>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={!!checks[idx]}
                            onChange={() => toggle(idx)}
                            disabled={readOnly}
                        />
                        <span className={`text-sm ${checks[idx] ? 'text-gray-500 line-through' : 'text-gray-700'}`}>{item}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

// --- Reviewer View ---
export const ReviewerView: React.FC<ReviewerViewProps> = ({ block, applicantValue }) => {
    const { config } = block;
    const checks = applicantValue || {};
    const items = config.items || [];
    const completed = items.filter((_: any, i: number) => checks[i]).length;

    return (
        <div className="mb-4">
            <div className="text-xs font-bold text-gray-400 uppercase mb-1">Checklist Progress</div>
            <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${(completed / items.length) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-600">{completed}/{items.length}</span>
            </div>
        </div>
    );
};

// --- Validation ---
export const validate = (value: any, config: any) => {
    const items = config.items || [];
    const checks = value || {};
    // If stricly required, all must be checked? Or just at least one?
    // Usually checklists in apps mean "Do all these things".
    const allChecked = items.every((_: any, i: number) => checks[i]);
    if (!allChecked) return ["Please complete all items in the checklist."];
    return null;
};
