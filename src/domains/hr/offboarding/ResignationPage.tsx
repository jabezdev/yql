import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Loader2, LogOut, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "../../../core/components/ui/Button";
import { useNavigate } from "react-router-dom";

export default function ResignationPage() {
    const navigate = useNavigate();
    const submitResignation = useMutation(api.domains.hr.memberLifecycle.submitResignation);

    const [reason, setReason] = useState("");
    const [date, setDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<"confirm" | "form">("confirm");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date || !reason) return;

        setIsSubmitting(true);
        try {
            await submitResignation({
                reason,
                intendedExitDate: new Date(date).getTime()
            });
            alert("Resignation submitted.");
            navigate("/dashboard"); // Or to offboarding process view if we had one ready
        } catch (error) {
            console.error(error);
            alert("Failed to submit resignation. Please contact HR manually if this persists.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === "confirm") {
        return (
            <div className="max-w-2xl mx-auto p-8 mt-10 bg-white rounded-xl border border-red-100 shadow-sm text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <LogOut size={32} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Are you sure you want to resign?</h1>
                <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                    We'll be sad to see you go. Submitting your resignation will initiate the offboarding process.
                    Please ensure you have discussed this with your manager first.
                </p>
                <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
                    <Button variant="destructive" onClick={() => setStep("form")}>
                        Proceed to Resignation
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto p-6 mt-8 bg-white rounded-xl border border-gray-200 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <LogOut size={20} className="text-gray-400" />
                Submit Resignation
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Working Day</label>
                    <input
                        type="date"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]} // Can't resign in part
                    />
                    <p className="text-xs text-gray-500 mt-1">Typically 2 weeks notice is required.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Leaving</label>
                    <textarea
                        required
                        className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
                        placeholder="Please share why you are leaving..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>

                <div className="bg-amber-50 p-4 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-amber-800">
                        Once submitted, your manager and HR will be notified immediately. This action initiates the formal offboarding checklist.
                    </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setStep("confirm")}>Back</Button>
                    <Button type="submit" variant="destructive" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <ArrowRight className="mr-2" size={16} />}
                        Submit Final Resignation
                    </Button>
                </div>
            </form>
        </div>
    );
}
