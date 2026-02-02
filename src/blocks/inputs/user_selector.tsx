import type { BlockConfigProps, ApplicantViewProps, ReviewerViewProps } from "../registry";
import React from "react";

export const ConfigEditor: React.FC<BlockConfigProps> = ({ config, onChange }) => {
    return (
        <div>
            <label>Label</label>
            <input
                value={config.label || ""}
                onChange={(e) => onChange({ ...config, label: e.target.value })}
                className="border p-1 w-full"
            />
        </div>
    );
};

export const ParticipantView: React.FC<ApplicantViewProps> = ({ block, value, onChange }) => {
    return (
        <div className="p-4 border rounded">
            <p className="font-bold">{block.config.label || "Select User"}</p>
            <select
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="border p-2 w-full mt-2"
            >
                <option value="">Select User...</option>
                {/* Dynamically fetch users here */}
            </select>
        </div>
    );
};

export const ReviewerView: React.FC<ReviewerViewProps> = ({ applicantValue }) => {
    return <div>Selected User ID: {applicantValue}</div>;
};

export const validate = (value: any, config: any) => {
    if (config.required && !value) return ["User selection required"];
    return [];
};
