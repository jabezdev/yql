import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getAuthUser } from "../../lib/auth";
import DynamicPipelineRenderer from "../../components/dynamic/DynamicPipelineRenderer";
import { Rocket } from "lucide-react";

export default function ApplicantDashboard() {
    const user = getAuthUser();
    const application = useQuery(api.applications.getApplication, user ? { token: user.token, userId: user._id } : "skip");
    const cohort = useQuery(api.cohorts.getActiveCohort);
    const recommit = useMutation(api.users.recommitToActiveCohort);

    const handleRecommit = async () => {
        try {
            await recommit({ token: user?.token || "" });
            window.location.reload();
        } catch (e) {
            alert("Error: " + (e instanceof Error ? e.message : "Unknown error"));
        }
    }

    if (!cohort) return <div className="p-8 text-center">No active cohort currently accepting applications. Check back later!</div>;

    if (!application) {
        return (
            <div className="p-8 max-w-2xl mx-auto bg-white rounded-xl shadow border border-brand-blue/20 text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 text-brand-blue rounded-full flex items-center justify-center mx-auto mb-4">
                    <Rocket size={32} />
                </div>
                <h2 className="text-3xl font-bold text-brand-blueDark">{cohort.name} is now open!</h2>
                <p className="text-gray-600 text-lg">
                    You can now apply or recommit to the newest cohort.
                    {user?.role === 'applicant' ? " Since you have an account, you can fast-track your application." : ""}
                </p>
                <button
                    onClick={handleRecommit}
                    className="bg-brand-blue text-white text-lg font-bold px-8 py-4 rounded-full shadow-lg hover:bg-brand-blueDark hover:scale-105 transition transform"
                >
                    Apply for {cohort.name}
                </button>
                <p className="text-xs text-gray-400 mt-4">By clicking apply, you will start the application process.</p>
            </div>
        );
    }

    // Calculate active step index from dynamic pipeline
    interface PipelineStage { id: string; name: string; }
    const currentStepIndex = cohort.pipeline.findIndex((p: PipelineStage) => p.id === application.currentStageId);
    // If not found (e.g. completed), handling might differ, but assuming valid ids
    const activeStep = currentStepIndex !== -1 ? currentStepIndex : 0;
    const totalSteps = cohort.pipeline.length;

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Your Application Journey</h2>
                {/* Dynamic Progress Bar */}
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
                    <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-orange -z-10 transition-all duration-500"
                        style={{ width: `${(activeStep / (totalSteps - 1)) * 100}%` }}
                    ></div>

                    {cohort.pipeline.map((step: PipelineStage, idx: number) => (
                        <div key={step.id} className={`flex flex-col items-center gap-2 bg-gray-50 px-2`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx <= activeStep ? 'bg-brand-orange text-white' : 'bg-gray-300 text-gray-600'
                                }`}>
                                {idx + 1}
                            </div>
                            <span className={`text-xs ${idx <= activeStep ? 'text-brand-blueDark font-bold' : 'text-gray-500'}`}>{step.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <DynamicPipelineRenderer application={application} cohort={cohort} />
            </div>
        </div>
    );
}
