import type { BlockTypeKey } from "../../../constants/blocks";
import { getBlockDefinition } from "../../../blocks/registry";

interface BlockConfigEditorProps {
    type: BlockTypeKey;
    config: any;
    onChange: (config: any) => void;
}

import { useState } from "react";
import BlockPermissionsEditor from "./BlockPermissionsEditor";
import { Settings, Shield } from "lucide-react";

interface BlockConfigEditorProps {
    type: BlockTypeKey;
    config: any;
    roleAccess?: any[];
    onChange: (config: any) => void;
    onPermissionsChange?: (roleAccess: any[]) => void;
}

export default function BlockConfigEditor({ type, config, roleAccess, onChange, onPermissionsChange }: BlockConfigEditorProps) {
    const [activeTab, setActiveTab] = useState<'content' | 'permissions'>('content');
    const def = getBlockDefinition(type);

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex border-b">
                <button
                    onClick={() => setActiveTab('content')}
                    className={`px-4 py-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'content' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Settings size={14} /> Content
                </button>
                <button
                    onClick={() => setActiveTab('permissions')}
                    className={`px-4 py-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'permissions' ? 'border-amber-500 text-amber-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Shield size={14} /> Permissions
                </button>
            </div>

            {activeTab === 'content' ? (
                <div className="py-2">
                    {def ? (
                        def.ConfigEditor ? (
                            <def.ConfigEditor config={config} onChange={onChange} />
                        ) : (
                            <div className="text-sm text-gray-500 italic p-2 border border-dashed rounded bg-gray-50">
                                No specific configuration needed for this block.
                            </div>
                        )
                    ) : (
                        <div className="text-sm text-gray-500 italic p-2 border border-dashed rounded bg-gray-50">
                            No definition found for block type: {type}
                        </div>
                    )}
                </div>
            ) : (
                <div className="py-2">
                    {onPermissionsChange ? (
                        <BlockPermissionsEditor roleAccess={roleAccess} onChange={onPermissionsChange} />
                    ) : (
                        <div className="text-sm text-gray-500">Permissions editing not enabled for this view.</div>
                    )}
                </div>
            )}
        </div>
    );
}
