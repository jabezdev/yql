import React from "react";
import { type BlockConfigProps, type ApplicantViewProps, type ReviewerViewProps } from "../registry";

// --- Configuration Editor ---
export const ConfigEditor: React.FC<BlockConfigProps> = ({ config, onChange }) => {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Label / Question</label>
                    <input
                        value={config.label || ""}
                        onChange={e => handleChange('label', e.target.value)}
                        className="w-full border p-2 rounded text-sm"
                        placeholder="e.g. What is your phone number?"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Field Type</label>
                    <select
                        value={config.inputType || "text"}
                        onChange={e => handleChange('inputType', e.target.value)}
                        className="w-full border p-2 rounded text-sm bg-white"
                    >
                        <option value="text">Short Text</option>
                        <option value="email">Email</option>
                        <option value="number">Number</option>
                        <option value="tel">Phone</option>
                        <option value="date">Date</option>
                        <option value="select">Dropdown Select</option>
                        <option value="multiselect">Multi-Select</option>
                    </select>
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

            {(config.inputType === 'select' || config.inputType === 'multiselect') && (
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Options (Comma separated)</label>
                    <input
                        value={Array.isArray(config.options) ? config.options.join(', ') : (config.options || "")}
                        onChange={e => handleChange('options', e.target.value.split(',').map((s: string) => s.trim()))}
                        className="w-full border p-2 rounded text-sm"
                        placeholder="Option A, Option B, Option C"
                    />
                </div>
            )}
        </div>
    );
};

// --- Applicant View ---
export const ParticipantView: React.FC<ApplicantViewProps> = ({ block, value, onChange, readOnly }) => {
    const { config } = block;
    const inputType = config.inputType || 'text';

    if (inputType === 'select') {
        return (
            <div className="mb-4">
                <label className="block font-bold text-gray-700 mb-2">
                    {config.label} {config.required && <span className="text-red-500">*</span>}
                </label>
                <select
                    value={value || ""}
                    onChange={e => onChange(e.target.value)}
                    disabled={readOnly}
                    className="w-full border p-3 rounded-lg bg-white focus:ring-2 focus:ring-brand-blue/20 outline-none disabled:bg-gray-100"
                >
                    <option value="">Select an option...</option>
                    {(config.options || []).map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </div>
        );
    }

    return (
        <div className="mb-4">
            <label className="block font-bold text-gray-700 mb-2">
                {config.label} {config.required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={inputType}
                value={value || ""}
                onChange={e => onChange(e.target.value)}
                disabled={readOnly}
                placeholder={config.placeholder}
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-brand-blue/20 outline-none disabled:bg-gray-100"
            />
        </div>
    );
};

// --- Reviewer View ---
export const ReviewerView: React.FC<ReviewerViewProps> = ({ block, applicantValue }) => {
    const { config } = block;
    return (
        <div className="mb-4">
            <div className="text-xs font-bold text-gray-400 uppercase mb-1">{config.label}</div>
            <div className="text-gray-800 font-medium">
                {applicantValue || <span className="text-gray-400 italic">No answer provided</span>}
            </div>
        </div>
    );
};

// --- Validation ---
export const validate = (value: any, config: any) => {
    if (config.required && !value) return ["This field is required."];
    return null;
};
