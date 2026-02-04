import { getBlockDefinition } from "../../../engine/blocks/registry";
import { AlertTriangle } from "lucide-react";
import ErrorBoundary from "../ui/ErrorBoundary";
import type { Doc } from "../../../../convex/_generated/dataModel";

export interface BlockRendererProps {
    block: Doc<"block_instances">;
    value: unknown;
    onChange: (value: unknown) => void;
    readOnly?: boolean;
    allValues?: Record<string, unknown>; // For cross-block dependencies
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

export default function BlockRenderer({ block, value, onChange, readOnly, allValues }: BlockRendererProps) {
    const def = getBlockDefinition(block.type as import("../../constants/blocks").BlockTypeKey);

    if (!def) {
        return (
            <div className="p-4 border border-red-200 bg-red-50 rounded text-red-600 text-sm flex gap-2">
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
            // Key is crucial for resetting state when block changes
            key={block._id}
            fallback={<BlockErrorFallback blockType={block.type} blockId={block._id} />}
        >
            <div id={`block-${block._id}`} className="scroll-mt-24">
                <ParticipantComponent
                    block={block}
                    value={value}
                    onChange={onChange}
                    readOnly={readOnly}
                    allValues={allValues}
                />
            </div>
        </ErrorBoundary>
    );
}
