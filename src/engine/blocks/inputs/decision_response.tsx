import React from "react";
import { type BlockConfigProps, type ApplicantViewProps, type ReviewerViewProps } from "../registry";
import { ThumbsDown, PartyPopper } from "lucide-react";

// --- Configuration Editor ---
export const ConfigEditor: React.FC<BlockConfigProps> = ({ config, onChange }) => {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Offer Title</label>
                <input
                    value={config.title || "Offer Decision"}
                    onChange={e => handleChange('title', e.target.value)}
                    className="w-full border p-2 rounded text-sm"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Offer Details (Markdown)</label>
                <textarea
                    value={config.content || ""}
                    onChange={e => handleChange('content', e.target.value)}
                    className="w-full border p-2 rounded text-sm h-24 font-mono"
                    placeholder="We are pleased to offer you..."
                />
            </div>
        </div>
    );
};

// --- Applicant View ---
export const ParticipantView: React.FC<ApplicantViewProps> = ({ block, value, onChange, readOnly }) => {
    const { config } = block;
    const decision = value; // 'accept' | 'decline'

    if (decision === 'accept') {
        return (
            <div className="mb-6 p-8 bg-green-50 border border-green-100 rounded-xl text-center">
                <PartyPopper size={48} className="mx-auto text-green-500 mb-4 animate-bounce" />
                <h3 className="text-xl font-bold text-green-800 mb-2">Offer Accepted!</h3>
                <p className="text-green-700 mb-4">You have accepted the offer. We are thrilled to have you!</p>
                <button onClick={() => onChange(null)} className="text-xs text-green-600 underline" disabled={readOnly}>Change My Mind</button>
            </div>
        );
    }

    if (decision === 'decline') {
        return (
            <div className="mb-6 p-8 bg-gray-50 border border-gray-200 rounded-xl text-center grayscale">
                <ThumbsDown size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">Offer Declined</h3>
                <p className="text-gray-500 mb-4">You have declined the offer.</p>
                <button onClick={() => onChange(null)} className="text-xs text-gray-400 underline" disabled={readOnly}>Undo</button>
            </div>
        );
    }

    return (
        <div className="mb-6 border-t pt-6">
            <div className="prose prose-sm max-w-none text-gray-600 mb-6">
                <h3>{config.title || "Your Decision"}</h3>
                <p className="whitespace-pre-wrap">{config.content}</p>
            </div>
            <div className="flex gap-4">
                <button
                    onClick={() => onChange('accept')}
                    disabled={readOnly}
                    className="flex-1 bg-brand-blue text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-600 shadow-lg shadow-blue-200 transition transform hover:-translate-y-1"
                >
                    Accept Offer
                </button>
                <button
                    onClick={() => onChange('decline')}
                    disabled={readOnly}
                    className="px-6 py-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition"
                >
                    Decline
                </button>
            </div>
        </div>
    );
};

// --- Reviewer View ---
export const ReviewerView: React.FC<ReviewerViewProps> = ({ block: _block, applicantValue }) => {
    return (
        <div className="mb-4">
            <div className="text-xs font-bold text-gray-400 uppercase mb-1">Applicant Decision</div>
            <div className={`font-bold ${applicantValue === 'accept' ? 'text-green-600' : 'text-gray-500'}`}>
                {applicantValue ? applicantValue.toUpperCase() : "PENDING"}
            </div>
        </div>
    );
};

// --- Validation ---
export const validate = (value: any) => {
    if (!value) return ["Please select a decision."];
    return null;
};
