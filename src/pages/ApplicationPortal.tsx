import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Container, Button } from "../components/ui";

export default function ApplicationPortal() {
    const { programId } = useParams();
    const navigate = useNavigate();

    const program = useQuery(api.programs.getProgram, { programId: programId as Id<"programs"> });

    // Correct mutation: createProcess
    const createProcess = useMutation(api.processes.createProcess);

    // Check if process already exists
    // We can use getProcess with programId to check if one exists for this user
    // Note: getProcess args need to be aligned with backend


    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // If program is not found or not recruiting
    if (program === undefined) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-brand-blue" /></div>;
    if (program === null) return <div className="p-10 text-center">Program not found or access denied.</div>;

    const handleStartApplication = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const processId = await createProcess({
                programId: program._id,
                type: program.programType || "recruitment",
                // departmentId: optional, not used for general recruitment yet
            });

            // Redirect to the Process View (to fill forms)
            navigate(`/dashboard/process/${processId}`);

        } catch (err) {
            const msg = (err as Error).message;
            if (msg.includes("already exists")) {
                // If already exists, we should probably find it and redirect.
                // For now, show error
                setError("You already have an active application for this program. check your dashboard.");
            } else {
                setError(msg);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container className="py-12">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
                <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
            </Button>

            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-brand-border">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-brand-darkBlue mb-2">{program.name}</h1>
                        <p className="text-brand-textMuted">{program.description}</p>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-8">
                        <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <CheckCircle2 size={20} /> Application Overview
                        </h3>
                        <ul className="space-y-2 text-blue-800/80 text-sm">
                            <li>• This application consists of multiple stages.</li>
                            <li>• You can save your progress and return later.</li>
                            <li>• Please ensure your profile information is up to date.</li>
                        </ul>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2">
                            <AlertCircle size={20} /> {error}
                        </div>
                    )}

                    <div className="flex justify-center">
                        <Button
                            size="lg"
                            variant="geometric-primary"
                            onClick={handleStartApplication}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Starting..." : "Start Application"}
                        </Button>
                    </div>
                </div>
            </div>
        </Container>
    );
}
