import React, { useState } from "react";
import { type BlockConfigProps, type ApplicantViewProps, type ReviewerViewProps } from "../registry";
import { Lock, Unlock, Loader, AlertCircle } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

// --- Configuration Editor ---
export const ConfigEditor: React.FC<BlockConfigProps> = ({ config, onChange }) => {
    return (
        <div className="space-y-4 animate-fade-in">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Required Passcode</label>
                <input
                    type="password"
                    value={config.passcode || ""}
                    onChange={e => onChange({ ...config, passcode: e.target.value })}
                    className="w-full border p-2 rounded text-sm font-mono"
                    placeholder="SecretCode123"
                />
                <p className="text-xs text-gray-400 mt-1">This passcode is stored securely and never exposed to applicants.</p>
            </div>
        </div>
    );
};

// --- Applicant View ---
// Security: Passcode validation happens SERVER-SIDE only
// The value stored is { unlocked: boolean } - we never store or compare the actual passcode client-side
export const ParticipantView: React.FC<ApplicantViewProps> = ({ block, value, onChange, readOnly }) => {
    const [input, setInput] = useState("");
    const [validating, setValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validatePasscode = useMutation(api.accessGate.validatePasscode);

    // value is { unlocked: boolean } or undefined
    const unlocked = value?.unlocked === true;

    const handleSubmit = async () => {
        if (!input.trim()) {
            setError("Please enter an access code.");
            return;
        }

        setValidating(true);
        setError(null);

        try {
            const result = await validatePasscode({
                blockId: block._id,
                passcode: input,
            });

            if (result.success) {
                // Store only the unlock status, never the passcode
                onChange({ unlocked: true });
                setInput(""); // Clear input for security
            } else {
                setError("Incorrect access code. Please try again.");
            }
        } catch (err) {
            console.error("Validation error:", err);
            setError("Failed to validate. Please try again.");
        } finally {
            setValidating(false);
        }
    };

    return (
        <div className={`mb-6 p-6 border rounded-xl transition-all ${unlocked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-full ${unlocked ? 'bg-green-200 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    {unlocked ? <Unlock size={20} /> : <Lock size={20} />}
                </div>
                <h4 className="font-bold text-gray-700">{unlocked ? "Access Granted" : "Restricted Access"}</h4>
            </div>

            {!unlocked && (
                <div>
                    <p className="text-sm text-gray-500 mb-2">Please enter the access code to continue.</p>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            value={input}
                            onChange={e => {
                                setInput(e.target.value);
                                setError(null);
                            }}
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                            disabled={readOnly || validating}
                            className="flex-1 border p-2 rounded text-sm outline-none focus:ring-2 focus:ring-brand-blue/20"
                            placeholder="Enter code..."
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={readOnly || validating || !input.trim()}
                            className="px-4 py-2 bg-brand-blue text-white rounded font-bold text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {validating ? <Loader size={14} className="animate-spin" /> : null}
                            {validating ? "Checking..." : "Unlock"}
                        </button>
                    </div>
                    {error && (
                        <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Reviewer View ---
export const ReviewerView: React.FC<ReviewerViewProps> = ({ applicantValue }) => {
    const unlocked = applicantValue?.unlocked === true;

    return (
        <div className="mb-4">
            <div className="text-xs font-bold text-gray-400 uppercase mb-1">Gate Status</div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${unlocked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {unlocked ? <Unlock size={14} /> : <Lock size={14} />}
                {unlocked ? "Unlocked" : "Locked"}
            </div>
        </div>
    );
};

// --- Validation ---
// Server-side validation is authoritative - we check the stored unlock status
export const validate = (value: { unlocked?: boolean } | undefined) => {
    if (!value?.unlocked) {
        return ["Access code required to continue."];
    }
    return null;
};
