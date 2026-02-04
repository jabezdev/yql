import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { User } from "lucide-react";
import type { ApplicantViewProps } from "../registry";

export const ParticipantView = ({ block, value, onChange, readOnly }: ApplicantViewProps<any, string>) => {
    const user = useQuery(api.core.users.getMe);
    const field = block.config?.field || "phone";
    const isCustom = block.config?.isCustomField || false;

    const [localValue, setLocalValue] = useState("");
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (initialized) return;

        if (value) {
            setLocalValue(value);
            setInitialized(true);
        } else if (user) {
            // Try to find value in user profile
            let profileValue = "";
            if (isCustom) {
                profileValue = user.profile?.customFields?.[field] || "";
            } else {
                profileValue = user.profile?.customFields?.[field] || "";
            }

            if (profileValue) {
                setLocalValue(profileValue);
                onChange(profileValue);
            }
            setInitialized(true);
        }
    }, [user, value, field, isCustom, onChange, initialized]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        onChange(newValue);
    };

    if (user === undefined) return <div className="h-10 bg-gray-100 animate-pulse rounded"></div>;

    return (
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {block.config?.label || field}
                {block.config?.required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={16} className="text-gray-400" />
                </div>
                <input
                    type="text"
                    value={localValue}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-blue focus:border-brand-blue sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder={block.config?.placeholder || `Enter your ${field}`}
                />
            </div>
            {block.config?.description && (
                <p className="mt-1 text-xs text-gray-500">{block.config.description}</p>
            )}
        </div>
    );
};

// Placeholder for Config and Review
export const ConfigEditor = () => <div className="p-4 bg-gray-100">Profile Input Config</div>;
export const ReviewerView = ({ value }: any) => <div className="p-2 border rounded">{value}</div>;
export const validate = (value: string, config: any) => {
    if (config?.required && !value?.trim()) return ["Field is required"];
    return null;
};
