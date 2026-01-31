import { useState } from "react";
import DynamicForm from "./DynamicForm";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";



interface DynamicPipelineRendererProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    application: any; // The full application record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stages: any[];    // List of stages
}

export default function DynamicPipelineRenderer({ application, stages }: DynamicPipelineRendererProps) {
    const submitStage = useMutation(api.processes.submitStage);
    const [isSaving, setIsSaving] = useState(false);

    // Find current stage config from pipeline/stages
    const currentStageConfig = stages.find((p: any) =>
        (p._id && p._id === application.currentStageId) ||
        (p.originalStageId && p.originalStageId === application.currentStageId)
    );

    if (!currentStageConfig) {
        return <div className="p-4 text-red-500">Error: Invalid Stage Configuration</div>;
    }

    const handleFormSubmit = async (data: Record<string, unknown>) => {
        setIsSaving(true);
        try {
            await submitStage({
                processId: application._id,
                stageId: currentStageConfig._id || currentStageConfig.id,
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
        // Use logic consistent with submission: check new ID first, then legacy/original
        const stageIdKey = currentStageConfig._id || currentStageConfig.id;
        const existingData = application.stageData?.[stageIdKey] || application.stageData?.[currentStageConfig.originalStageId] || {};

        return (
            <div>
                <h3 className="text-xl font-bold mb-2">{currentStageConfig.name}</h3>
                <p className="text-gray-600 mb-6">{currentStageConfig.description}</p>
                <DynamicForm
                    fields={currentStageConfig.config?.formConfig || currentStageConfig.formConfig} // generic config or legacy
                    initialData={existingData}
                    onSubmit={handleFormSubmit}
                    isLoading={isSaving}
                    submitLabel="Submit & Continue"
                    key={currentStageConfig.id || currentStageConfig._id}
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
