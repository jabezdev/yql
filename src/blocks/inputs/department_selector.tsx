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
            {/* Additional config fields can be added here */}
        </div>
    );
};

export const ParticipantView: React.FC<ApplicantViewProps> = ({ block, value, onChange }) => {
    return (
        <div className="p-4 border rounded">
            <p className="font-bold">{block.config.label || "Select Department"}</p>
            <select
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="border p-2 w-full mt-2"
            >
                <option value="">Select...</option>
                {/* Dynamically fetch departments here */}
                <option value="dept-1">Example Dept 1</option>
                <option value="dept-2">Example Dept 2</option>
            </select>
        </div>
    );
};

export const ReviewerView: React.FC<ReviewerViewProps> = ({ applicantValue }) => {
    return <div>Selected Department ID: {applicantValue}</div>;
};

export const validate = (value: any, config: any) => {
    if (config.required && !value) return ["Selection required"];
    return [];
};
