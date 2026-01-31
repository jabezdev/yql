// import React from "react";
import { type BlockConfigProps, type ApplicantViewProps, type ReviewerViewProps } from "../registry";

// --- Configuration Editor ---
export const ConfigEditor: React.FC<BlockConfigProps> = ({ config, onChange }) => {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Label / Prompt</label>
                <input
                    value={config.label || ""}
                    onChange={e => handleChange('label', e.target.value)}
                    className="w-full border p-2 rounded text-sm"
                    placeholder="e.g. Tell us about yourself..."
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Min Words</label>
                    <input
                        type="number"
                        value={config.minWords || ""}
                        onChange={e => handleChange('minWords', parseInt(e.target.value))}
                        className="w-full border p-2 rounded text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Words</label>
                    <input
                        type="number"
                        value={config.maxWords || ""}
                        onChange={e => handleChange('maxWords', parseInt(e.target.value))}
                        className="w-full border p-2 rounded text-sm"
                    />
                </div>
            </div>
            <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-600 font-medium cursor-pointer">
                    <input
                        type="checkbox"
                        checked={!!config.required}
                        onChange={e => handleChange('required', e.target.checked)}
                        className="rounded text-brand-blue focus:ring-brand-blue"
                    />
                    Required Field
                </label>
            </div>
        </div>
    );
};

// --- Applicant View ---
export const ParticipantView: React.FC<ApplicantViewProps> = ({ block, value, onChange, readOnly }) => {
    const { config } = block;
    const text = value || "";
    const wordCount = text.trim().split(/\s+/).filter((w: string) => w.length > 0).length;

    return (
        <div className="mb-6">
            <label className="block font-bold text-gray-700 mb-2">
                {config.label} {config.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
                value={text}
                onChange={e => onChange(e.target.value)}
                disabled={readOnly}
                rows={6}
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-brand-blue/20 outline-none disabled:bg-gray-100"
                placeholder="Type your answer here..."
            />
            <div className="flex justify-end gap-4 mt-1 text-xs text-gray-400">
                {config.minWords && <span className={wordCount < config.minWords ? "text-orange-500" : "text-green-600"}>Min: {config.minWords}</span>}
                {config.maxWords && <span className={wordCount > config.maxWords ? "text-red-500" : ""}>Max: {config.maxWords}</span>}
                <span>Words: {wordCount}</span>
            </div>
        </div>
    );
};

// --- Reviewer View ---
export const ReviewerView: React.FC<ReviewerViewProps> = ({ block, applicantValue }) => {
    const { config } = block;
    return (
        <div className="mb-4">
            <div className="text-xs font-bold text-gray-400 uppercase mb-1">{config.label}</div>
            <div className="text-gray-800 p-3 bg-gray-50 rounded border whitespace-pre-wrap text-sm">
                {applicantValue || <span className="text-gray-400 italic">No answer provided</span>}
            </div>
        </div>
    );
};

// --- Validation ---
export const validate = (value: any, config: any) => {
    if (config.required && !value) return ["This field is required."];

    if (value) {
        const wordCount = value.trim().split(/\s+/).length;
        if (config.minWords && wordCount < config.minWords) return [`Must be at least ${config.minWords} words.`];
        if (config.maxWords && wordCount > config.maxWords) return [`Must be under ${config.maxWords} words.`];
    }
    return null;
};
