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
            <p className="font-bold">{block.config.label || "Timesheet"}</p>
            <div className="grid grid-cols-7 gap-2 mt-2">
                {/* Simple 7 day grid */}
                {[...Array(7)].map((_, i) => (
                    <div key={i} className="border p-2 text-center">
                        <span className="text-xs">Day {i + 1}</span>
                        <input
                            type="number"
                            className="w-full border mt-1"
                            placeholder="0"
                            onChange={(e) => {
                                const newVal = { ...(value || {}), [i]: e.target.value };
                                onChange(newVal);
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export const ReviewerView: React.FC<ReviewerViewProps> = ({ applicantValue }) => {
    const total = Object.values(applicantValue || {}).reduce((a: any, b: any) => Number(a) + Number(b), 0);
    return <div>Total Hours: {String(total)}</div>;
};

export const validate = (value: any, config: any) => {
    if (config.required && (!value || Object.keys(value).length === 0)) return ["Hours required"];
    return [];
};
