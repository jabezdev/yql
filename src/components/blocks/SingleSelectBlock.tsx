import type { Doc } from "../../../convex/_generated/dataModel";

export function SingleSelectBlock({ block, value, onChange, readOnly }: {
    block: Doc<"block_instances">,
    value: string,
    onChange: (val: string) => void,
    readOnly?: boolean
}) {
    const label = block.config?.label || block.name;
    const required = block.config?.required || false;
    const options = block.config?.options || []; // Expects array of { label: string, value: string } or strings

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                disabled={readOnly}
                required={required}
            >
                <option value="">Select an option...</option>
                {options.map((opt: any, idx: number) => {
                    const val = typeof opt === 'string' ? opt : opt.value;
                    const lab = typeof opt === 'string' ? opt : opt.label;
                    return <option key={idx} value={val}>{lab}</option>;
                })}
            </select>
        </div>
    );
}
