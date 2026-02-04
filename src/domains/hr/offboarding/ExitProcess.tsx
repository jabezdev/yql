import { useNavigate } from "react-router-dom";
import { CheckCircle, Circle, ArrowLeft } from "lucide-react";
import { Button } from "../../../core/components/ui/Button";

export default function ExitProcess() {
    const navigate = useNavigate();

    // Mock data for MVP
    const steps = [
        { id: 1, title: "Resignation Submitted", status: "completed", date: "Feb 3, 2026" },
        { id: 2, title: "Exit Interview", status: "pending", description: "Schedule with HR" },
        { id: 3, title: "Return Assets", status: "pending", description: "Laptop, ID Badge" },
        { id: 4, title: "Account Deactivation", status: "locked", description: "On last day" },
    ];

    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="mb-8">
                <Button variant="ghost" className="pl-0 mb-4" onClick={() => navigate("/dashboard")}>
                    <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">Offboarding Checklist</h1>
                <p className="text-gray-600">Please complete the following steps before your last day.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                    {steps.map((step) => (
                        <div key={step.id} className="relative flex items-start group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 shadow shrink-0 z-10">
                                {step.status === 'completed' ? (
                                    <CheckCircle className="text-green-500" size={20} />
                                ) : step.status === 'pending' ? (
                                    <Circle className="text-brand-blue" size={20} />
                                ) : (
                                    <Circle className="text-gray-300" size={20} />
                                )}
                            </div>
                            <div className="ml-6 w-full">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className={`text-lg font-semibold ${step.status === 'locked' ? 'text-gray-400' : 'text-gray-900'}`}>
                                        {step.title}
                                    </h3>
                                    {step.date && <span className="text-sm text-gray-500">{step.date}</span>}
                                </div>
                                <p className="text-gray-500 text-sm mb-4">{step.description}</p>

                                {step.status === 'pending' && step.id === 2 && (
                                    <Button size="sm" variant="ghost" className="border">Schedule Interview</Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
