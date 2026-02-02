import type { Doc } from "../../../convex/_generated/dataModel";

export function LongAnswerBlock({ block, value, onChange, readOnly }: {
    block: Doc<"block_instances">,
    value: string,
    onChange: (val: string) => void,
    readOnly?: boolean
}) {
    const label = block.config?.label || block.name;
    const required = block.config?.required || false;
    const placeholder = block.config?.placeholder || "";

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors min-h-[100px] disabled:bg-gray-50 disabled:text-gray-500"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={readOnly}
                required={required}
            />
        </div>
    );
}
