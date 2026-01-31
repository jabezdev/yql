import React from "react";
import { type BlockConfigProps, type ApplicantViewProps, type ReviewerViewProps } from "../registry";
import { Gavel, CheckCircle, Ban, Clock } from "lucide-react";

// --- Configuration Editor ---
export const ConfigEditor: React.FC<BlockConfigProps> = ({ config, onChange }) => {
    return (
        <div className="space-y-4 animate-fade-in">
            <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded">
                This is an internal checking gate. Applicants will not see this block.
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Internal Instructions</label>
                <textarea
                    value={config.notes || ""}
                    onChange={e => onChange({ ...config, notes: e.target.value })}
                    className="w-full border p-2 rounded text-sm h-24"
                    placeholder="e.g. Verify GPA is above 3.0"
                />
            </div>
        </div>
    );
};

// --- Applicant View ---
export const ApplicantView: React.FC<ApplicantViewProps> = () => {
    return null;
};

// --- Reviewer View ---
export const ReviewerView: React.FC<ReviewerViewProps> = ({ block, reviewerValue, onChange, isEditable }) => {
    const { config } = block;
    const decision = reviewerValue?.decision; // 'approve' | 'reject' | 'waitlist'

    const handleDecide = (d: string) => {
        onChange({ decision: d, timestamp: new Date().toISOString() });
    };

    if (!isEditable) {
        return (
            <div className="mb-4 border-l-4 border-gray-300 pl-4 py-2 bg-gray-50">
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Decision Gate</div>
                <div className="font-bold flex items-center gap-2">
                    <Gavel size={16} /> {decision?.toUpperCase() || "PENDING"}
                </div>
            </div>
        );
    }

    return (
        <div className="mb-6 p-4 bg-white border rounded-lg shadow-sm">
            <h5 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Gavel className="text-gray-500" size={18} /> Decision Gate
            </h5>
            <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded">{config.notes || "No instructions."}</p>

            <div className="grid grid-cols-3 gap-3">
                <button
                    onClick={() => handleDecide('approve')}
                    className={`p-3 rounded-lg font-bold text-sm flex flex-col items-center gap-1 transition ${decision === 'approve' ? 'bg-green-100 text-green-700 border-2 border-green-200' : 'bg-gray-50 text-gray-500 hover:bg-green-50'}`}
                >
                    <CheckCircle size={20} /> Approve
                </button>
                <button
                    onClick={() => handleDecide('reject')}
                    className={`p-3 rounded-lg font-bold text-sm flex flex-col items-center gap-1 transition ${decision === 'reject' ? 'bg-red-100 text-red-700 border-2 border-red-200' : 'bg-gray-50 text-gray-500 hover:bg-red-50'}`}
                >
                    <Ban size={20} /> Reject
                </button>
                <button
                    onClick={() => handleDecide('waitlist')}
                    className={`p-3 rounded-lg font-bold text-sm flex flex-col items-center gap-1 transition ${decision === 'waitlist' ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-200' : 'bg-gray-50 text-gray-500 hover:bg-yellow-50'}`}
                >
                    <Clock size={20} /> Waitlist
                </button>
            </div>
        </div>
    );
};

// --- Validation ---
export const validate = () => null;
