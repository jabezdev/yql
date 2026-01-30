import { useState } from "react";
import DynamicForm, { type FormField } from "./DynamicForm";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface PipelineStage {
    id: string;
    name: string;
    type: string;
    description?: string;
    formConfig?: FormField[];
}

interface DynamicPipelineRendererProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    application: any; // The full application record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cohort: any;      // The full cohort record
}

export default function DynamicPipelineRenderer({ application, cohort }: DynamicPipelineRendererProps) {
    const updateApp = useMutation(api.applications.updateApplicationData);
    const updateStage = useMutation(api.applications.updateStage);
    const [isSaving, setIsSaving] = useState(false);

    // Find current stage config from cohort pipeline
    const currentStageConfig = cohort.pipeline.find((p: PipelineStage) => p.id === application.currentStageId);

    if (!currentStageConfig) {
        return <div className="p-4 text-red-500">Error: Invalid Stage Configuration</div>;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFormSubmit = async (data: any) => {
        setIsSaving(true);
        try {
            // Save form data into stageData keyed by stage ID
            const newStageData = {
                ...application.stageData,
                [currentStageConfig.id]: data
            };

            // 1. Save Data
            await updateApp({
                applicationId: application._id,
                stageData: newStageData
            });

            // 2. Auto-advance if it's a form? 
            // For now, let's just save. Maybe show a "Next Stage" button or auto-advance.
            // Let's implement a simple "Complete Stage" logic.

            // Find next stage
            const currentIndex = cohort.pipeline.findIndex((p: PipelineStage) => p.id === currentStageConfig.id);
            const nextStage = cohort.pipeline[currentIndex + 1];

            if (nextStage) {
                await updateStage({ applicationId: application._id, stage: nextStage.id });
            }

            // Reload or let React Query handle it
        } catch (err) {
            console.error(err);
            alert("Failed to save");
        } finally {
            setIsSaving(false);
        }
    };

    // Render based on type
    if (currentStageConfig.type === 'form' && currentStageConfig.formConfig) {
        // Get existing data for this stage
        const existingData = application.stageData?.[currentStageConfig.id] || {};

        return (
            <div>
                <h3 className="text-xl font-bold mb-2">{currentStageConfig.name}</h3>
                <p className="text-gray-600 mb-6">{currentStageConfig.description}</p>
                <DynamicForm
                    fields={currentStageConfig.formConfig}
                    initialData={existingData}
                    onSubmit={handleFormSubmit}
                    isLoading={isSaving}
                    submitLabel="Submit & Continue"
                    key={currentStageConfig.id}
                />
            </div>
        );
    }

    if (currentStageConfig.type === 'static' || currentStageConfig.type === 'interview') {
        return (
            <div className="text-center py-8">
                <h3 className="text-xl font-bold mb-2">{currentStageConfig.name}</h3>
                <p className="text-gray-600 mb-6 max-w-lg mx-auto">{currentStageConfig.description}</p>

                {/* For static stages, maybe an admin has to move them manually? 
                    Or the user clicks "I have completed this"? 
                    For MVP flexible arch, let's assume manual admin move for non-forms 
                    OR a simple "Done" button if self-paced.
                */}
                <div className="bg-blue-50 p-4 rounded text-blue-800 text-sm inline-block">
                    Please wait for an admin to review your application or for the next scheduled session.
                </div>
            </div>
        );
    }

    if (currentStageConfig.type === 'completed') {
        return (
            <div className="text-center py-10">
                <h3 className="text-3xl font-bold mb-4 text-green-600">You are an official YQL Volunteer!</h3>
                <p>Welcome to the team.</p>
            </div>
        );
    }

    return <div>Unknown Stage Type: {currentStageConfig.type}</div>;
}
