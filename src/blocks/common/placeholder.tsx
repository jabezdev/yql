import React from "react";
import { type BlockConfigProps, type ApplicantViewProps, type ReviewerViewProps } from "../registry";
import { Construction } from "lucide-react";

// --- Configuration Editor ---
export const ConfigEditor: React.FC<BlockConfigProps> = () => {
    return (
        <div className="p-4 bg-gray-50 border border-dashed rounded text-center text-gray-500 text-sm">
            <Construction className="mx-auto mb-2 opacity-50" />
            Configuration for this block type is under development.
        </div>
    );
};

// --- Applicant View ---
export const ApplicantView: React.FC<ApplicantViewProps> = ({ block }) => {
    return (
        <div className="p-6 bg-gray-50 border rounded-xl text-center">
            <h4 className="font-bold text-gray-600 mb-1">{block.name || "Coming Soon"}</h4>
            <p className="text-sm text-gray-400">This feature is currently under construction.</p>
        </div>
    );
};

// --- Reviewer View ---
export const ReviewerView: React.FC<ReviewerViewProps> = ({ block }) => {
    return (
        <div className="mb-4">
            <div className="text-xs font-bold text-gray-400 uppercase mb-1">{block.name}</div>
            <div className="text-gray-400 italic text-sm">No data display available.</div>
        </div>
    );
};

// --- Validation ---
export const validate = () => null;
