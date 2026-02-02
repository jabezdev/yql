import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getBlockDefinition } from "../../blocks/registry";
import { Loader } from "lucide-react";

interface BlockReviewerProps {
    stageId: string;
    blockIds: string[];
    applicantData: any; // { [blockId]: value }
    reviewData: any; // { [blockId]: value }
    onReviewChange: (data: any) => void;
    isReviewer?: boolean; // If true, enables interactive reviewer inputs
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function BlockReviewer({ stageId, blockIds: _blockIds, applicantData, reviewData, onReviewChange, isReviewer = false }: BlockReviewerProps) {
    const blocks = useQuery(api.blocks.getStageBlocks, { stageId: stageId as any });

    if (blocks === undefined) return <div className="p-4"><Loader className="animate-spin text-gray-400" /></div>;
    if (!blocks || blocks.length === 0) return <div className="p-4 text-gray-500 italic">No blocks to review.</div>;

    const handleReviewChange = (blockId: string, value: any) => {
        const newData = { ...(reviewData || {}), [blockId]: value };
        onReviewChange(newData);
    };

    return (
        <div className="space-y-10">
            {blocks.map((block) => {
                const def = getBlockDefinition(block.type as any);
                if (!def) {
                    return (
                        <div key={block._id} className="p-4 border border-red-200 bg-red-50 rounded text-red-600 text-sm">
                            Unknown Block Type: {block.type}
                        </div>
                    );
                }

                const ReviewerComponent = def.ReviewerView;

                return (
                    <div key={block._id} className="border-b last:border-0 pb-10 last:pb-0">
                        {/* Header usually handled by the component or wrapper, but we can add one here if needed */}
                        {/* <h4 className="font-bold text-gray-700 mb-2">{block.name}</h4> */}

                        <ReviewerComponent
                            block={block}
                            applicantValue={applicantData?.[block._id]}
                            reviewerValue={reviewData?.[block._id]}
                            onChange={isReviewer ? (val) => handleReviewChange(block._id, val) : undefined}
                            isEditable={isReviewer}
                        />
                    </div>
                );
            })}
        </div>
    );
}
