import React from "react";
import { type BlockConfigProps, type ApplicantViewProps, type ReviewerViewProps } from "../registry";
import { Link } from "lucide-react";

// --- Configuration Editor ---
export const ConfigEditor: React.FC<BlockConfigProps> = ({ config, onChange }) => {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Label</label>
                <input
                    value={config.label || "External Link"}
                    onChange={e => handleChange('label', e.target.value)}
                    className="w-full border p-2 rounded text-sm"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Allowed Domains (Optional)</label>
                <input
                    value={config.allowedDomains || ""}
                    onChange={e => handleChange('allowedDomains', e.target.value)}
                    className="w-full border p-2 rounded text-sm"
                    placeholder="e.g. github.com, linkedin.com"
                />
                <p className="text-xs text-gray-400 mt-1">Comma separated list of allowed domains.</p>
            </div>
            <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-600 font-medium cursor-pointer">
                    <input
                        type="checkbox"
                        checked={!!config.required}
                        onChange={e => handleChange('required', e.target.checked)}
                        className="rounded text-brand-blue focus:ring-brand-blue"
                    />
                    Required
                </label>
            </div>
        </div>
    );
};

// --- Applicant View ---
export const ApplicantView: React.FC<ApplicantViewProps> = ({ block, value, onChange, readOnly }) => {
    const { config } = block;

    return (
        <div className="mb-6">
            <label className="block font-bold text-gray-700 mb-2">{config.label} {config.required && <span className="text-red-500">*</span>}</label>
            <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                    <Link size={18} />
                </div>
                <input
                    type="url"
                    value={value || ""}
                    onChange={e => onChange(e.target.value)}
                    disabled={readOnly}
                    className="w-full border p-3 pl-10 rounded-lg focus:ring-2 focus:ring-brand-blue/20 outline-none disabled:bg-gray-100"
                    placeholder="https://..."
                />
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
            <div className="text-gray-800">
                {applicantValue ? (
                    <a href={applicantValue} target="_blank" rel="noreferrer" className="text-brand-blue underline flex items-center gap-1">
                        <Link size={14} /> {applicantValue}
                    </a>
                ) : <span className="text-gray-400 italic">No link provided</span>}
            </div>
        </div>
    );
};

// --- Validation ---
export const validate = (value: any, config: any) => {
    if (config.required && !value) return ["Link is required."];
    if (value) {
        try {
            const url = new URL(value);
            if (config.allowedDomains) {
                const domains = config.allowedDomains.split(',').map((d: string) => d.trim().toLowerCase());
                if (!domains.some((d: string) => url.hostname.includes(d))) {
                    return [`Domain must be one of: ${config.allowedDomains}`];
                }
            }
        } catch {
            return ["Invalid URL format."];
        }
    }
    return null;
};
