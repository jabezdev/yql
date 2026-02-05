import React from "react";
import type { BlockConfigProps, ApplicantViewProps, ReviewerViewProps } from "../registry";
// import { useQuery } from "convex/react";


interface ProcessListProps {
    title: string;
    processes?: any[]; // Replace 'any' with Doc<"processes"> if available, but 'any' is safe for now to avoid extensive imports
    emptyMessage?: string;
}

export const ProcessList: React.FC<ProcessListProps> = ({ title, processes = [], emptyMessage = "No active processes found." }) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-semibold text-gray-900">{title}</h3>
            </div>
            <div className="divide-y divide-gray-100">
                {processes.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        {emptyMessage}
                    </div>
                ) : (
                    processes.map((process) => (
                        <div key={process._id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-gray-900 capitalize">
                                            {process.type?.replace("_", " ")}
                                        </span>
                                        <StatusBadge status={process.status} />
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        Last updated {new Date(process.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                                    View Details &rarr;
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
        in_progress: "bg-blue-100 text-blue-800",
        approved: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
        completed: "bg-purple-100 text-purple-800",
        pending_review: "bg-yellow-100 text-yellow-800",
    };

    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}>
            {status?.replace("_", " ")}
        </span>
    );
};

// Legacy exports for registry compatibility (if needed temporarily)
export const ConfigEditor: React.FC<any> = () => <div>Deprecated</div>;
export const ParticipantView: React.FC<any> = ({ block }) => <ProcessList title={block.config.title} processes={[]} emptyMessage="Widget deprecated" />;
export const ReviewerView = ParticipantView;
export const validate = () => null;

