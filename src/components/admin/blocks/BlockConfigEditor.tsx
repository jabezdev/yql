import type { BlockTypeKey } from "../../../constants/blocks";
import { getBlockDefinition } from "../../../blocks/registry";

interface BlockConfigEditorProps {
    type: BlockTypeKey;
    config: any;
    onChange: (config: any) => void;
}

export default function BlockConfigEditor({ type, config, onChange }: BlockConfigEditorProps) {
    const def = getBlockDefinition(type);

    if (!def) {
        return (
            <div className="text-sm text-gray-500 italic p-2 border border-dashed rounded bg-gray-50">
                No specific configuration available for {type}. (Definition not found)
            </div>
        );
    }

    const ConfigComponent = def.ConfigEditor;
    if (!ConfigComponent) {
        return (
            <div className="text-sm text-gray-500 italic p-2 border border-dashed rounded bg-gray-50">
                No configuration needed for this block.
            </div>
        );
    }

    return (
        <ConfigComponent
            config={config}
            onChange={onChange}
        />
    );
}
