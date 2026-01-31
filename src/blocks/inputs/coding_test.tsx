import React from "react";
import { type BlockConfigProps, type ApplicantViewProps, type ReviewerViewProps } from "../registry";
import { Terminal } from "lucide-react";

// --- Configuration Editor ---
export const ConfigEditor: React.FC<BlockConfigProps> = ({ config, onChange }) => {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Problem Title</label>
                <input
                    value={config.label || "Coding Challenge"}
                    onChange={e => handleChange('label', e.target.value)}
                    className="w-full border p-2 rounded text-sm"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Problem Description (Markdown)</label>
                <textarea
                    value={config.description || ""}
                    onChange={e => handleChange('description', e.target.value)}
                    className="w-full border p-2 rounded h-24 font-mono text-xs"
                    placeholder="Describe the function signature and expected output..."
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Language</label>
                <select
                    value={config.language || "python"}
                    onChange={e => handleChange('language', e.target.value)}
                    className="w-full border p-2 rounded text-sm bg-white"
                >
                    <option value="python">Python 3</option>
                    <option value="javascript">JavaScript / TypeScript</option>
                    <option value="sql">SQL</option>
                    <option value="html">HTML/CSS</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Starter Code Template</label>
                <textarea
                    value={config.template || ""}
                    onChange={e => handleChange('template', e.target.value)}
                    className="w-full border p-2 rounded h-32 font-mono bg-gray-900 text-green-400 text-xs"
                    placeholder="def solve(input):..."
                />
            </div>
        </div>
    );
};

// --- Applicant View ---
export const ParticipantView: React.FC<ApplicantViewProps> = ({ block, value, onChange, readOnly }) => {
    const { config } = block;
    const code = value !== undefined ? value : (config.template || "");

    return (
        <div className="mb-6 border rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 p-4 border-b">
                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                    <Terminal size={18} className="text-brand-blue" />
                    {config.label}
                </h4>
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{config.description}</p>
            </div>
            <div className="relative">
                <div className="absolute top-0 right-0 p-2 text-xs text-gray-400 bg-gray-900 rounded-bl font-mono">
                    {config.language || "python"}
                </div>
                <textarea
                    value={code}
                    onChange={e => onChange(e.target.value)}
                    disabled={readOnly}
                    className="w-full h-64 bg-gray-900 text-gray-100 font-mono text-sm p-4 outline-none resize-y"
                    spellCheck={false}
                />
            </div>
            <div className="bg-gray-100 p-2 text-xs text-center text-gray-500">
                Code is auto-saved. Output is verified by human reviewers.
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
            <div className="bg-gray-900 text-gray-300 p-3 rounded font-mono text-sm whitespace-pre-wrap border border-gray-700">
                {applicantValue || <span className="text-gray-500 italic">No code submitted</span>}
            </div>
        </div>
    );
};

// --- Validation ---
export const validate = (value: any, config: any) => {
    // Basic check: did they change it from template or is it empty?
    if (!value || (config.template && value.trim() === config.template.trim())) {
        return ["Please write your solution code."];
    }
    return null;
};
