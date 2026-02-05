import React from "react";
import { type BlockConfigProps, type ApplicantViewProps, type ReviewerViewProps } from "../registry";

interface BannerConfig {
    title: string;
    message: string;
    variant?: "info" | "warning" | "success" | "error";
}

export const ConfigEditor: React.FC<BlockConfigProps<BannerConfig>> = ({ config, onChange }) => {
    return (
        <div className="space-y-2">
            <input
                className="w-full border p-2 rounded"
                value={config.title}
                onChange={e => onChange({ ...config, title: e.target.value })}
                placeholder="Title"
            />
            <textarea
                className="w-full border p-2 rounded"
                value={config.message}
                onChange={e => onChange({ ...config, message: e.target.value })}
                placeholder="Message"
            />
        </div>
    );
};

export const ParticipantView: React.FC<ApplicantViewProps<BannerConfig>> = ({ block }) => {
    const { title, message, variant = "info" } = block.config;

    // Variant styles
    const styles = {
        info: "bg-blue-50 border-blue-200 text-blue-800",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
        success: "bg-green-50 border-green-200 text-green-800",
        error: "bg-red-50 border-red-200 text-red-800"
    };

    return (
        <div className={`p-6 rounded-lg border ${styles[variant]} mb-4`}>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm opacity-90">{message}</p>
        </div>
    );
};

// Admin/Reviewer view is same as participant for read-only widgets usually, or similar
export const ReviewerView: React.FC<ReviewerViewProps<BannerConfig>> = ({ block }) => {
    return <ParticipantView block={block} value={null} onChange={() => { }} />;
};

export const validate = () => null;
