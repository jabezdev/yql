import React, { useState, useEffect } from "react";
import { type BlockConfigProps, type ApplicantViewProps, type ReviewerViewProps } from "../registry";

// --- Configuration Editor ---
export const ConfigEditor: React.FC<BlockConfigProps> = ({ config, onChange }) => {
    // items: [{ label: string, maxScore: number }]
    const [newItem, setNewItem] = useState("");

    const addItem = () => {
        if (!newItem) return;
        const items = config.items || [];
        onChange({ ...config, items: [...items, { label: newItem, maxScore: 5 }] });
        setNewItem("");
    };

    const updateItem = (idx: number, updates: any) => {
        const items = [...(config.items || [])];
        items[idx] = { ...items[idx], ...updates };
        onChange({ ...config, items });
    };

    const removeItem = (idx: number) => {
        const items = (config.items || []).filter((_: any, i: number) => i !== idx);
        onChange({ ...config, items });
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rubric Criteria</label>
                <div className="space-y-2 mb-2">
                    {(config.items || []).map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center">
                            <input
                                value={item.label}
                                onChange={e => updateItem(idx, { label: e.target.value })}
                                className="flex-1 border p-1 rounded text-sm"
                            />
                            <input
                                type="number"
                                value={item.maxScore}
                                onChange={e => updateItem(idx, { maxScore: parseInt(e.target.value) })}
                                className="w-16 border p-1 rounded text-sm"
                                title="Max Score"
                            />
                            <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-500 text-xs">Rm</button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        value={newItem}
                        onChange={e => setNewItem(e.target.value)}
                        placeholder="New Criteria (e.g. Communication)"
                        className="flex-1 border p-1 rounded text-sm"
                        onKeyDown={e => e.key === 'Enter' && addItem()}
                    />
                    <button onClick={addItem} className="bg-gray-100 px-3 py-1 rounded text-xs font-bold hover:bg-gray-200">Add</button>
                </div>
            </div>
        </div>
    );
};

// --- Applicant View (Hidden) ---
export const ParticipantView: React.FC<ApplicantViewProps> = () => {
    return null; // Applicant sees nothing
};

// --- Reviewer View (Interactive) ---
export const ReviewerView: React.FC<ReviewerViewProps> = ({ block, reviewerValue, onChange, isEditable }) => {
    const { config } = block;
    const items = config.items || [];
    // reviewerValue = { [label]: score }

    const scores = reviewerValue || {};

    const handleScore = (label: string, score: number) => {
        if (onChange) onChange({ ...scores, [label]: score });
    };

    if (!isEditable) {
        // Show scores read-only
        return (
            <div className="mb-4 border p-4 rounded bg-gray-50">
                <h5 className="font-bold text-gray-700 mb-2">Rubric Score</h5>
                {items.map((item: any) => (
                    <div key={item.label} className="flex justify-between text-sm mb-1">
                        <span>{item.label}</span>
                        <span className="font-mono font-bold">{scores[item.label] || 0} / {item.maxScore}</span>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="mb-4 border p-4 rounded bg-white shadow-sm">
            <h5 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                📝 Scoring Rubric
            </h5>
            <div className="space-y-4">
                {items.map((item: any) => (
                    <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{item.label}</span>
                            <span className="font-bold text-brand-blue">{scores[item.label] || 0} / {item.maxScore}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max={item.maxScore}
                            value={scores[item.label] || 0}
                            onChange={e => handleScore(item.label, parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Validation ---
export const validate = () => null; // Internal block, validation optional
