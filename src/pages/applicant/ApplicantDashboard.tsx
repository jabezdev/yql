import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getAuthUser } from "../../lib/auth";
import DynamicPipelineRenderer from "../../components/dynamic/DynamicPipelineRenderer";

export default function ApplicantDashboard() {
    const user = getAuthUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const application = useQuery(api.applications.getApplication, { userId: user?._id as any });
    const cohort = useQuery(api.cohorts.getActiveCohort);

    if (!application || !cohort) return <div>Loading application status...</div>;

    // Calculate active step index from dynamic pipeline
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentStepIndex = cohort.pipeline.findIndex((p: any) => p.id === application.currentStageId);
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

                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {cohort.pipeline.map((step: any, idx: number) => (
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
