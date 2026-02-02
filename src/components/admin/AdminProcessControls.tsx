import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "../ui/Button";
import { XCircle, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

interface AdminProcessControlsProps {
    process: Doc<"processes">;
}

export function AdminProcessControls({ process }: AdminProcessControlsProps) {
    const updateStatus = useMutation(api.processes.updateStatus);
    const [isLoading, setIsLoading] = useState(false);
    const [confirmAction, setConfirmAction] = useState<string | null>(null);

    const handleStatusUpdate = async (newStatus: string) => {
        setIsLoading(true);
        try {
            await updateStatus({
                processId: process._id,
                status: newStatus
            });
            setConfirmAction(null);
        } catch (error) {
            console.error(error);
            alert("Failed to update status");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-gray-500" /></div>;
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-8">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={20} />
                Admin Controls
            </h3>

            <div className="flex flex-wrap gap-4">
                {process.status !== "rejected" && (
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Negative Actions</span>
                        <Button
                            onClick={() => setConfirmAction("rejected")}
                            variant="secondary"
                            className="text-red-600 border border-red-200 bg-white hover:bg-red-50"
                        >
                            <XCircle size={16} className="mr-2" /> Reject Candidate
                        </Button>
                    </div>
                )}

                {process.status !== "accepted" && (
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Positive Actions</span>
                        <Button
                            onClick={() => setConfirmAction("accepted")}
                            variant="secondary"
                            className="text-green-600 border border-green-200 bg-white hover:bg-green-50"
                        >
                            <CheckCircle size={16} className="mr-2" /> Accept & Offer
                        </Button>
                    </div>
                )}

                {/* Reset Status */}
                {["rejected", "accepted"].includes(process.status) && (
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Corrective Actions</span>
                        <Button
                            onClick={() => handleStatusUpdate("in_progress")}
                            variant="ghost"
                        >
                            Reset to In Progress
                        </Button>
                    </div>
                )}
            </div>

            {/* Confirmation Modal / Area */}
            {confirmAction && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2">
                    <p className="font-medium text-gray-900 mb-2">
                        Are you sure you want to mark this candidate as
                        <span className={confirmAction === "rejected" ? "text-red-600 font-bold mx-1" : "text-green-600 font-bold mx-1"}>
                            {confirmAction.toUpperCase()}
                        </span>?
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                        This will trigger automated emails and update the candidate's dashboard.
                    </p>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => handleStatusUpdate(confirmAction)}
                            variant={confirmAction === "rejected" ? "secondary" : "primary"} // Assuming primary is green-ish or standard
                            className={confirmAction === "rejected" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
                        >
                            Confirm {confirmAction}
                        </Button>
                        <Button onClick={() => setConfirmAction(null)} variant="ghost">
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
