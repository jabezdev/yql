import { useState } from "react";
import DynamicForm, { type FormField } from "./DynamicForm";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getAuthUser } from "../../lib/auth";

interface PipelineStage {
    id: string;
    name: string;
    type: string;
    kind?: string;
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
    const submitStage = useMutation(api.applications.submitStage);
    const [isSaving, setIsSaving] = useState(false);
    const user = getAuthUser();

    // Find current stage config from cohort pipeline
    const currentStageConfig = cohort.pipeline.find((p: PipelineStage) => p.id === application.currentStageId);

    if (!currentStageConfig) {
        return <div className="p-4 text-red-500">Error: Invalid Stage Configuration</div>;
    }

    const handleFormSubmit = async (data: Record<string, unknown>) => {
        if (!user || !user.token) {
            alert("You are not logged in.");
            return;
        }
        setIsSaving(true);
        try {
            await submitStage({
                token: user.token,
                applicationId: application._id,
                stageId: currentStageConfig.id,
                data
            });
            // Result is handled by reactivity (application prop updates)
        } catch (err) {
            console.error(err);
            alert("Failed to save: " + (err instanceof Error ? err.message : "Unknown error"));
        } finally {
            setIsSaving(false);
        }
    };

    // Render based on type or kind
    const renderType = (currentStageConfig.kind || currentStageConfig.type);

    if (renderType === 'form' && currentStageConfig.formConfig) {
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

    if (renderType === 'static' || renderType === 'interview' || renderType === 'agreement') {
        return (
            <div className="text-center py-8">
                <h3 className="text-xl font-bold mb-2">{currentStageConfig.name}</h3>
                <p className="text-gray-600 mb-6 max-w-lg mx-auto whitespace-pre-line">{currentStageConfig.description}</p>

                {/* Status or completion button */}
                <div className="bg-blue-50 p-4 rounded text-blue-800 text-sm inline-block">
                    There are no forms to fill for this step. Please follow the instructions above or wait for admin review.
                </div>
            </div>
        );
    }

    if (renderType === 'completed') {
        return (
            <div className="text-center py-10">
                <h3 className="text-3xl font-bold mb-4 text-green-600">You are an official YQL Volunteer!</h3>
                <p>Welcome to the team.</p>
            </div>
        );
    }

    return <div>Unknown Stage Type: {renderType}</div>;
}
