import React from "react";
import { type BlockConfigProps, type ApplicantViewProps, type ReviewerViewProps } from "../registry";
import { Calculator } from "lucide-react";

// --- Configuration Editor ---
export const ConfigEditor: React.FC<BlockConfigProps> = () => {
    return (
        <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded border border-blue-200">
            <Calculator className="mb-2" />
            <p className="font-bold">Auto-Scoring Enabled</p>
            <p className="mt-1">This block will automatically sum up the scores from all Quiz blocks in this stage.</p>
        </div>
    );
};

// --- Applicant View ---
export const ParticipantView: React.FC<ApplicantViewProps> = () => {
    // Hidden from applicant
    return null;
};

// --- Reviewer View ---
export const ReviewerView: React.FC<ReviewerViewProps> = ({ block: _block, applicantValue: _applicantValue, isEditable: _isEditable }) => {
    // For now, allow Reviewer to trigger a calculation? 
    // Or we rely on backend. Ideally backend.
    // But since we are client-side hacking for the demo:
    return (
        <div className="mb-4">
            <div className="text-xs font-bold text-gray-400 uppercase mb-1">Auto Score</div>
            <div className="text-gray-500 italic text-sm">
                Score calculation is performed on submission.
            </div>
        </div>
    );
};

// --- Validation ---
export const validate = () => null;
