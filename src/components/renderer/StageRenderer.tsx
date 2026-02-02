import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { BlockRenderer } from "../blocks/BlockRenderer";
import { Loader2 } from "lucide-react";

interface StageRendererProps {
    stage: Doc<"stages">;
    initialData: any;
    onDataChange: (data: any) => void;
    readOnly?: boolean;
}

export default function StageRenderer({ stage, initialData, onDataChange, readOnly }: StageRendererProps) {
    // Need to fetch individual blocks. 
    // Ideally we have a query "getBlocks" or "getStageBlocks". 
    // `stages.ts` has `getProgramStages` but that returns stages.
    // We probably need `api.blocks.getBlocks` or similar.
    // Let's check if we have a way to fetch multiple blocks by ID.
    // If not, we iterate. But hooks inside loop is bad.
    // We need a query `api.blocks.getMany(ids)`.

    // We should create it or use existing if found.
    // convex/blocks.ts has `getStageBlocks` which handles permissions.

    const blocks = useQuery(api.blocks.getStageBlocks, { stageId: stage._id });

    const [formData, setFormData] = useState(initialData || {});

    // Sync initialData if it changes (e.g. loaded from DB)
    useEffect(() => {
        if (initialData) {
            setFormData((prev: any) => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleChange = (blockId: string, value: any) => {
        if (readOnly) return;
        const newData = { ...formData, [blockId]: value };
        setFormData(newData);
        onDataChange(newData);
    };

    if (blocks === undefined) {
        return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-brand-blue" /></div>;
    }

    if (!blocks || blocks.length === 0) {
        return <div className="text-gray-500 italic p-4">No content in this stage.</div>;
    }

    // Sort blocks if needed? They should be returned in order from backend.

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{stage.name}</h2>
            {stage.description && <p className="text-gray-600 mb-6">{stage.description}</p>}

            <div className="space-y-4">
                {blocks.map(block => (
                    <BlockRenderer
                        key={block._id}
                        block={block}
                        value={formData[block._id]}
                        onChange={(val) => handleChange(block._id, val)}
                        readOnly={readOnly}
                    />
                ))}
            </div>
        </div>
    );
}
