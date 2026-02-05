import React from "react";
import type { BlockConfigProps, ApplicantViewProps, ReviewerViewProps } from "../registry";
import { Activity, AlertCircle, FileText, Users, type LucideIcon } from "lucide-react";

// Icon mapping
const ICONS: Record<string, LucideIcon> = {
    activity: Activity,
    "alert-circle": AlertCircle,
    "file-text": FileText,
    users: Users
};

interface StatItem {
    label: string;
    dataKey: string;
    icon?: string;
}

interface StatCardConfig {
    items: StatItem[];
}

export const ConfigEditor: React.FC<BlockConfigProps<StatCardConfig>> = ({ config: _config }) => {
    return <div>Stat Card Config (Read Only for now)</div>;
};

export const ParticipantView: React.FC<ApplicantViewProps<StatCardConfig>> = ({ block }) => {
    const { items } = block.config;

    // TODO: Connect to real data source
    // For now, we mock based on dataKey to demonstrate
    const getMockValue = (key: string) => {
        if (key.includes("count")) return Math.floor(Math.random() * 5);
        if (key.includes("total")) return 142;
        return 0;
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {items?.map((item, i) => {
                const Icon = item.icon ? ICONS[item.icon] : Activity;
                return (
                    <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gray-50 rounded-lg">
                                <Icon className="w-5 h-5 text-gray-500" />
                            </div>
                            <span className="text-sm text-gray-500 font-medium">{item.label}</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 pl-1">
                            {getMockValue(item.dataKey)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export const ReviewerView: React.FC<ReviewerViewProps<StatCardConfig>> = ({ block }) => {
    return <ParticipantView block={block} value={null} onChange={() => { }} />;
};

export const validate = () => null;
