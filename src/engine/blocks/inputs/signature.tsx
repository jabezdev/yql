import { useState, useEffect } from "react";

import { Check, PenTool } from "lucide-react";
import type { ApplicantViewProps } from "../registry";

// Type definition for signature value
export interface SignatureValue {
    signed: boolean;
    name: string;
    date: number;
}

export const ParticipantView = ({ block, value, onChange, readOnly }: ApplicantViewProps<any, SignatureValue | null>) => {
    const [signed, setSigned] = useState(value?.signed || false);
    const [name, setName] = useState(value?.name || "");

    useEffect(() => {
        if (value) {
            setSigned(value.signed);
            setName(value.name);
        }
    }, [value]);

    const handleCheck = (checked: boolean) => {
        setSigned(checked);
        updateValue(checked, name);
    };

    const handleNameChange = (newName: string) => {
        setName(newName);
        updateValue(signed, newName);
    };

    const updateValue = (s: boolean, n: string) => {
        if (s && n.trim().length > 0) {
            onChange({
                signed: s,
                name: n,
                date: Date.now()
            });
        } else {
            onChange(null);
        }
    };

    return (
        <div className="mb-6 p-6 bg-gray-50 border border-gray-200 rounded-xl">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <PenTool size={20} className="text-brand-blue" />
                {block.config?.label || "Signature Required"}
            </h3>

            {/* Display Contract Content if provided in config */}
            {block.config?.content && (
                <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 max-h-48 overflow-y-auto">
                    {block.config.content}
                </div>
            )}

            <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                    <div className="relative flex items-center">
                        <input
                            type="checkbox"
                            className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm checked:border-brand-blue checked:bg-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                            checked={signed}
                            onChange={(e) => !readOnly && handleCheck(e.target.checked)}
                            disabled={readOnly}
                        />
                        <Check
                            size={14}
                            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100"
                        />
                    </div>
                    <span className="text-sm text-gray-700 pt-0.5">
                        {block.config?.agreementText || "I have read and agree to the above terms and the Code of Conduct."}
                    </span>
                </label>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type Full Name to Sign
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue disabled:bg-gray-100 disabled:text-gray-500"
                        disabled={readOnly}
                    />
                </div>
            </div>
        </div>
    );
};

// Placeholder for Config and Review
export const ConfigEditor = () => (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded text-center text-gray-500">
        Payment Configuration (Coming Soon)
    </div>
);
export const ReviewerView = () => (
    <div className="text-sm text-gray-500 italic">No payment details available</div>
);

export const validate = () => {
    return null;
};
