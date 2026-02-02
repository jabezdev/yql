import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { User } from "lucide-react";

interface ProfileInputBlockProps {
    block: Doc<"block_instances">;
    value: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
}

export function ProfileInputBlock({ block, value, onChange, readOnly }: ProfileInputBlockProps) {
    const user = useQuery(api.users.getMe);
    const field = block.config?.field || "phone"; // e.g. "phone", "address", "emergencyContact"
    const isCustom = block.config?.isCustomField || false;

    // Local state to manage input
    // If value is provided (from process data), usage that.
    // If not, try to pre-fill from user profile.
    const [localValue, setLocalValue] = useState("");
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (initialized) return; // Only populate once to avoid overwriting user edits if re-render happens

        if (value) {
            setLocalValue(value);
            setInitialized(true);
        } else if (user) {
            // Try to find value in user profile
            let profileValue = "";
            if (isCustom) {
                profileValue = user.profile?.customFields?.[field] || "";
            } else {
                // Direct mapping if properties existed on profile, but currently profile is flexible.
                // We'll map standard fields to customFields for now unless we add them to schema.
                // Or maybe we map 'name' and 'email' (though usually read-only).
                // Let's assume most onboarding fields are custom fields for now (Address, Phone).
                profileValue = user.profile?.customFields?.[field] || "";
            }

            if (profileValue) {
                setLocalValue(profileValue);
                onChange(profileValue); // Sync to form
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
}
