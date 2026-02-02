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
            <p className="font-bold">{block.config.label || "Goals"}</p>
            <div className="mt-2">
                <p className="text-sm text-gray-500">Goal Editor Placeholder</p>
                {/* List of goals UI */}
                <button
                    onClick={() => onChange([...(value || []), { title: "New Goal", description: "" }])}
                    className="bg-blue-500 text-white px-3 py-1 text-sm rounded mt-2"
                >
                    Add Goal
                </button>
            </div>
        </div>
    );
};

export const ReviewerView: React.FC<ReviewerViewProps> = ({ applicantValue }) => {
    return (
        <div>
            <p className="font-bold">Submitted Goals:</p>
            <pre className="text-xs bg-gray-100 p-2">{JSON.stringify(applicantValue, null, 2)}</pre>
        </div>
    );
};

export const validate = (value: any, config: any) => {
    if (config.required && (!value || value.length === 0)) return ["At least one goal required"];
    return [];
};
