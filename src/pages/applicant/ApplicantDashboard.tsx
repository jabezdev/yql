import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import DynamicPipelineRenderer from "../../components/dynamic/DynamicPipelineRenderer";
import { Rocket } from "lucide-react";

export default function ApplicantDashboard() {
    // getApplication now relies on authenticated user identity if userId is skipped or not provided
    // But getApplication query args: { userId: v.optional(v.id("users")) }
    // If we pass skipped userId, it defaults to caller.
    const application = useQuery(api.applications.getApplication, {});
    const cohort = useQuery(api.cohorts.getActiveCohort);
    const stages = useQuery(api.stages.getCohortStages, cohort ? { cohortId: cohort._id } : "skip");
    const recommit = useMutation(api.users.recommitToActiveCohort);

    const handleRecommit = async () => {
        try {
            await recommit({});
            window.location.reload();
        } catch (e) {
            alert("Error: " + (e instanceof Error ? e.message : "Unknown error"));
        }
    }

    if (!cohort) return (
        <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-gray-100 max-w-lg mx-auto mt-10">
            <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Rocket size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">No Applications Open</h2>
            <p className="text-gray-500">There are currently no active cohorts accepting applications. Please check back later for upcoming batches.</p>
        </div>
    );

    if (!application) {
        return (
            <div className="p-8 max-w-2xl mx-auto bg-white rounded-xl shadow border border-brand-blue/20 text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 text-brand-blue rounded-full flex items-center justify-center mx-auto mb-4">
                    <Rocket size={32} />
                </div>
                <h2 className="text-3xl font-bold text-brand-blueDark">{cohort.name} is now open!</h2>
                <p className="text-gray-600 text-lg">
                    You can now apply or recommit to the newest cohort.
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

    // Calculate active step index from stages
    // Fallback to empty array if stages not loaded yet
    const pipeline = stages || (cohort.pipeline || []);

    // Check if we are using the new stages system or legacy pipeline
    // The migration should have run, but strictly speaking we might have a gap.
    // Ideally we rely on 'stages'.

    const currentStepIndex = pipeline.findIndex((p: any) =>
        (p._id && p._id === application.currentStageId) || // For new stages (ID match)
        (p.id && p.id === application.currentStageId) ||   // For legacy pipeline (string id match)
        (p.originalStageId && p.originalStageId === application.currentStageId) // For migrated stages (reference match)
    );

    const activeStep = currentStepIndex !== -1 ? currentStepIndex : 0;
    const totalSteps = pipeline.length;

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

                    {pipeline.map((step: any, idx: number) => (
                        <div key={step._id || step.id} className={`flex flex-col items-center gap-2 bg-gray-50 px-2`}>
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
                {currentStepIndex !== -1 ? (
                    <DynamicPipelineRenderer application={application} stages={pipeline} />
                ) : (
                    <div className="text-center py-8">
                        <p className="text-red-500 font-bold mb-2">Stage Configuration Error</p>
                        <p className="text-gray-500 text-sm">Your application is at a stage ID "{application.currentStageId}" which no longer exists in this cohort's pipeline. Please contact support.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
