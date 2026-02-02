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
            <label>Program ID (Source)</label>
            <input
                value={config.programId || ""}
                onChange={(e) => onChange({ ...config, programId: e.target.value })}
                className="border p-1 w-full"
            />
        </div>
    );
};

export const ParticipantView: React.FC<ApplicantViewProps> = ({ block, value, onChange }) => {
    return (
        <div className="p-4 border rounded">
            <p className="font-bold">{block.config.label || "Select Shifts"}</p>
            <div className="mt-2 space-y-2">
                {/* Dynamic Shift List Placeholder */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={value?.includes("shift-a") || false}
                        onChange={(e) => {
                            const current = value || [];
                            if (e.target.checked) onChange([...current, "shift-a"]);
                            else onChange(current.filter((s: string) => s !== "shift-a"));
                        }}
                    />
                    <span>Shift A: 9:00 AM - 12:00 PM</span>
                </div>
            </div>
        </div>
    );
};

export const ReviewerView: React.FC<ReviewerViewProps> = ({ applicantValue }) => {
    return <div>Selected Shifts: {JSON.stringify(applicantValue)}</div>;
};

export const validate = (value: any, config: any) => {
    if (config.required && (!value || value.length === 0)) return ["Shift selection required"];
    return [];
};
