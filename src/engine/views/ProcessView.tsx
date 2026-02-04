import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Container, Button } from "../../core/components/ui";
import { Loader2, ArrowRight } from "lucide-react";
import StageRenderer from "../../core/components/renderer/StageRenderer";
import { AdminProcessControls } from "../../core/components/admin/AdminProcessControls";

export default function ProcessView() {
    const { processId } = useParams();


    // 1. Get Process and Access
    const processData = useQuery(api.engine.processes.getProcessWithAccess, { processId: processId as Id<"processes"> });

    // 2. We need the current stage details. 
    // Since getProcessWithAccess returns the process, we can get programId.
    // Then we fetch visible stages to find the specific one.
    // Ideally we would have `getStage(id)` but we'll fetch all visible for now (good for nav anyway).
    const rawStages = useQuery(
        api.engine.stages.getVisibleProgramStages,
        processData?.process.programId ? { programId: processData.process.programId } : "skip"
    );
    const stages = rawStages?.filter((s): s is typeof s & { stage: NonNullable<typeof s.stage> } => !!s.stage);

    const submitStage = useMutation(api.engine.processes.submitStage);


    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Effect to sync existing data for the stage
    const currentStageId = processData?.process.currentStageId;
    const currentStageObj = stages?.find(s => s.stage?._id === currentStageId);

    useEffect(() => {
        if (processData?.process.data && currentStageId) {
            // Check if we have data for this stage
            const existing = processData.process.data[currentStageId];
            if (existing) {
                setFormData(existing);
            } else {
                setFormData({});
            }
        }
    }, [currentStageId, processData]);

    if (processData === undefined || stages === undefined) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-blue" /></div>;
    }

    if (processData === null) {
        return <div className="p-8 text-center bg-gray-50 m-8 rounded-xl">Process not found or access denied.</div>;
    }

    if (!currentStageObj) {
        return <div className="p-8 text-center text-red-500 m-8 bg-red-50 rounded-xl">Current stage configuration not found.</div>;
    }

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            await submitStage({
                processId: processData.process._id,
                stageId: currentStageObj.stage._id,
                data: formData
            });
            // On success, the UI will reactively update because `processData` query will return new currentStageId
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const canAdminister = processData.access.canApprove; // or canAdmin? 
    // `getProcessAccessMask` logic:
    // canApprove usually implies reviewer/admin rights.

    return (
        <Container className="py-8">
            <div className="max-w-4xl mx-auto">
                {/* Progress Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Progress</h1>

                    {/* Status Badge */}
                    <div className="mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide 
                            ${processData.process.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                processData.process.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                    processData.process.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100'
                            }`}>
                            {processData.process.status.replace('_', ' ')}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        {stages.map((s, idx) => {
                            const isCurrent = s.stage._id === currentStageId;
                            const isPast = stages.findIndex(st => st.stage._id === currentStageId) > idx;
                            // This generic index find might be flawed if stages aren't ordered, but getVisibleProgramStages ensures order if backend does.
                            // Backend `getVisibleProgramStages` relies on `program.stageIds` order.

                            return (
                                <div key={s.stage._id} className={`h-2 flex-1 rounded-full ${isCurrent ? 'bg-brand-blue' : isPast ? 'bg-blue-200' : 'bg-gray-200'}`} />
                            );
                        })}
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-gray-500">
                        <span>{currentStageObj.stage.name}</span>
                        <span>Step {stages.findIndex(s => s.stage._id === currentStageId) + 1} of {stages.length}</span>
                    </div>
                </div>



                <div className="bg-white p-8 rounded-xl border border-brand-border shadow-sm">
                    <StageRenderer
                        stage={currentStageObj.stage}
                        initialData={formData}
                        onDataChange={setFormData}
                        readOnly={isSubmitting || !currentStageObj.access.canSubmit || processData.process.status !== 'in_progress'}
                    />

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Hide Save button if not in progress */}
                    {processData.process.status === 'in_progress' && (
                        <div className="mt-8 flex justify-end">
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !currentStageObj.access.canSubmit}
                                size="lg"
                                variant="geometric-primary" // Use brand button
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="animate-spin mr-2" size={16} /> Saving...</>
                                ) : (
                                    <>Save & Continue <ArrowRight className="ml-2" size={16} /></>
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Admin Controls */}
                {canAdminister && (
                    <AdminProcessControls process={processData.process} />
                )}
            </div>
        </Container>
    );
}
