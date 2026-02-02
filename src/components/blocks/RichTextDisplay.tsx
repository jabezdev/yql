import type { Doc } from "../../../convex/_generated/dataModel";

export function RichTextDisplay({ block }: { block: Doc<"block_instances"> }) {
    // block.config should have content
    const content = block.config?.content || block.name || "";
    const variant = block.type; // header or paragraph

    if (variant === "header") {
        return <h3 className="text-xl font-bold text-brand-darkBlue mb-2 mt-4">{content}</h3>;
    }

    return <div className="text-gray-700 mb-4 prose max-w-none">{content}</div>;
}
