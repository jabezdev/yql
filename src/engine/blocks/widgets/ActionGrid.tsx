import React from "react";
import type { BlockConfigProps, ApplicantViewProps, ReviewerViewProps } from "../registry";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface ActionItem {
    label: string;
    link: string;
    variant?: "primary" | "secondary";
    permission?: string; // Optional permission check
}

interface ActionGridConfig {
    actions: ActionItem[];
}

export const ConfigEditor: React.FC<BlockConfigProps<ActionGridConfig>> = ({ config, onChange }) => {
    // Simplified editor for speed
    const addAction = () => {
        onChange({
            actions: [...(config.actions || []), { label: "New Action", link: "#" }]
        });
    };

    return (
        <div>
            {config.actions?.map((action, i) => (
                <div key={i} className="flex gap-2 mb-2">
                    <input value={action.label} className="border p-1" onChange={e => {
                        const newActions = [...config.actions];
                        newActions[i].label = e.target.value;
                        onChange({ actions: newActions });
                    }} />
                    <input value={action.link} className="border p-1" onChange={e => {
                        const newActions = [...config.actions];
                        newActions[i].link = e.target.value;
                        onChange({ actions: newActions });
                    }} />
                </div>
            ))}
            <button onClick={addAction} className="text-sm text-blue-500">+ Add Action</button>
        </div>
    );
};

export const ParticipantView: React.FC<ApplicantViewProps<ActionGridConfig>> = ({ block }) => {
    const { actions } = block.config;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {actions?.map((action, i) => (
                <Link
                    key={i}
                    to={action.link}
                    className={`
                        group flex items-center justify-between p-6 rounded-xl border transition-all hover:shadow-md
                        ${action.variant === 'primary'
                            ? 'bg-gradient-to-br from-brand-blue/5 to-transparent border-brand-blue/20 hover:border-brand-blue/50'
                            : 'bg-white border-gray-200 hover:border-gray-300'}
                    `}
                >
                    <span className="font-medium text-gray-900">{action.label}</span>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-blue transition-colors" />
                </Link>
            ))}
        </div>
    );
};

export const ReviewerView: React.FC<ReviewerViewProps<ActionGridConfig>> = ({ block }) => {
    return <ParticipantView block={block} value={null} onChange={() => { }} />;
};

export const validate = () => null;
