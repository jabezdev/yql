import React from "react";
import { type BlockConfigProps, type ApplicantViewProps, type ReviewerViewProps } from "../registry";

// --- Configuration Editor ---
export const ConfigEditor: React.FC<BlockConfigProps> = ({ config, onChange }) => {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Content (Markdown)</label>
                <textarea
                    value={config.content || ""}
                    onChange={e => handleChange('content', e.target.value)}
                    className="w-full border p-2 rounded text-sm h-32 font-mono"
                    placeholder="# Heading\n\nWrite instructions here..."
                />
                <p className="text-xs text-gray-400 mt-1">Supports Markdown</p>
            </div>
        </div>
    );
};

// --- Applicant View ---
export const ParticipantView: React.FC<ApplicantViewProps> = ({ block }) => {
    return (
        <div className="mb-6 prose prose-blue max-w-none">
            {/* Extremely simple markdown rendering for now, could use a library later */}
            <div className="whitespace-pre-wrap font-sans text-gray-700">
                {block.config.content}
            </div>
        </div>
    );
};

// --- Reviewer View ---
export const ReviewerView: React.FC<ReviewerViewProps> = ({ block }) => {
    // Reviewer sees the same content as applicant
    return <ParticipantView block={block} value={null} onChange={() => { }} />;
};

// --- Validation ---
export const validate = () => null; // No validation needed for static content
