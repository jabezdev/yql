import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getBlockDefinition } from "../../blocks/registry";
import { AlertTriangle, Loader } from "lucide-react";
import ErrorBoundary from "../ui/ErrorBoundary";
import type { Id } from "../../../convex/_generated/dataModel";

interface BlockRendererProps {
    stageId: string; // The ID of the stage instance
    initialData: Record<string, unknown>; // The entire stage submission data (e.g. { [blockId]: val })
    onChange: (data: Record<string, unknown>) => void;
    readOnly?: boolean;
}

// Fallback component shown when a block crashes
function BlockErrorFallback({ blockType, blockId }: { blockType: string; blockId: string }) {
    return (
        <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
            <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-orange-500 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-orange-800">Block failed to render</p>
                    <p className="text-xs text-orange-600 mt-1">
                        Type: {blockType} • ID: {blockId}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function BlockRenderer({ stageId, initialData, onChange, readOnly }: BlockRendererProps) {
    // We need to fetch the resolved blocks (type, config) from the DB
    // Ideally this data is pre-fetched by parent, but fetching here for safety/cache
    const blocks = useQuery(api.blocks.getStageBlocks, { stageId: stageId as Id<"stages"> });

    // Local state for answers
    const [answers, setAnswers] = useState<Record<string, unknown>>(initialData || {});

    // NOTE: We rely on the parent component to change the 'key' prop of BlockRenderer
    // when switching stages, which forces a remount and state reset.
    // Syncing state via useEffect (setAnswers) caused infinite loops/warnings.

    const handleBlockChange = (blockId: string, value: unknown) => {
        const newAnswers = { ...answers, [blockId]: value };
        setAnswers(newAnswers);
        onChange(newAnswers);
    };

    if (blocks === undefined) { // Loading
        return <div className="p-8 flex justify-center"><Loader className="animate-spin text-gray-400" /></div>;
    }

    if (!blocks || blocks.length === 0) {
        return <div className="text-gray-500 italic text-center p-8">No content defined for this stage.</div>;
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            {blocks.map((block) => {
                const def = getBlockDefinition(block.type as Parameters<typeof getBlockDefinition>[0]);
                if (!def) {
                    return (
                        <div key={block._id} className="p-4 border border-red-200 bg-red-50 rounded text-red-600 text-sm flex gap-2">
                            <AlertTriangle size={16} className="mt-0.5" />
                            <div>
                                <strong>Unknown Block Type:</strong> {block.type}
                                <div className="text-xs mt-1">ID: {block._id}</div>
                            </div>
                        </div>
                    );
                }

                const ParticipantComponent = def.ParticipantView;
                if (!ParticipantComponent) return null; // Internal block with no participant view

                return (
                    <ErrorBoundary
                        key={block._id}
                        fallback={<BlockErrorFallback blockType={block.type} blockId={block._id} />}
                    >
                        <div id={`block-${block._id}`} className="scroll-mt-24">
                            <ParticipantComponent
                                block={block}
                                value={answers[block._id]}
                                onChange={(val: unknown) => handleBlockChange(block._id, val)}
                                readOnly={readOnly}
                                allValues={answers}
                            />
                        </div>
                    </ErrorBoundary>
                );
            })}
        </div>
    );
}

