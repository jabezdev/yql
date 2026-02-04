import { useState } from "react";
import { BLOCK_TYPES, type BlockTypeKey } from "../../../constants/blocks";
import { GripVertical, Trash2, Edit2, Copy, AlertTriangle } from "lucide-react";
import BlockConfigEditor from "./BlockConfigEditor";

export interface BlockInstance {
    _id?: string; // If saved
    tempId: string; // For UI handling before save
    type: BlockTypeKey;
    name?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config: any;
    // Relationships
    wasForked?: boolean;
}

interface BlockListEditorProps {
    blocks: BlockInstance[];
    onChange: (blocks: BlockInstance[]) => void;
}

export default function BlockListEditor({ blocks, onChange }: BlockListEditorProps) {
    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

    const addBlock = (type: BlockTypeKey) => {
        const def = BLOCK_TYPES.find(b => b.key === type);
        const newBlock: BlockInstance = {
            tempId: `new_${crypto.randomUUID()}`,
            type,
            name: def?.label || "New Block",
            config: {}
        };
        onChange([...blocks, newBlock]);
        setEditingBlockId(newBlock.tempId);
    };

    const updateBlock = (index: number, updates: Partial<BlockInstance>) => {
        const copy = [...blocks];
        copy[index] = { ...copy[index], ...updates };
        onChange(copy);
    };

    const removeBlock = (index: number) => {
        if (!confirm("Are you sure?")) return;
        const copy = blocks.filter((_, i) => i !== index);
        onChange(copy);
    };

    const moveBlock = (index: number, direction: -1 | 1) => {
        if ((index === 0 && direction === -1) || (index === blocks.length - 1 && direction === 1)) return;
        const copy = [...blocks];
        const temp = copy[index];
        copy[index] = copy[index + direction];
        copy[index + direction] = temp;
        onChange(copy);
    };

    // Group blocks for selection
    const groupedTypes = BLOCK_TYPES.reduce((acc, curr) => {
        if (!acc[curr.category]) acc[curr.category] = [];
        acc[curr.category].push(curr);
        return acc;
    }, {} as Record<string, typeof BLOCK_TYPES[number][]>);

    return (
        <div className="space-y-4">
            {/* Block List */}
            <div className="space-y-3">
                {blocks.map((block, idx) => {
                    const def = BLOCK_TYPES.find(b => b.key === block.type);
                    const isEditing = editingBlockId === (block._id || block.tempId);

                    return (
                        <div key={block._id || block.tempId} className={`border rounded-lg bg-white shadow-sm transition-all ${isEditing ? 'ring-2 ring-brand-blue ring-offset-1 z-10' : ''}`}>
                            <div className="p-3 flex items-center gap-3 bg-gray-50/50 rounded-t-lg select-none">
                                <div className="text-gray-300 cursor-grab hover:text-gray-500"><GripVertical size={16} /></div>
                                <div className="p-1.5 bg-white border rounded text-gray-500">
                                    {def?.icon ? <def.icon size={16} /> : <div className="w-4 h-4 bg-gray-200 rounded" />}
                                </div>
                                <div className="flex-1 font-medium text-gray-700 text-sm">
                                    {block.name || def?.label}
                                    {block._id && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Linked</span>}
                                </div>

                                <div className="flex items-center gap-1">
                                    <button onClick={() => moveBlock(idx, -1)} className="p-1 text-gray-400 hover:text-gray-600"><div className="rotate-90">‹</div></button>
                                    <button onClick={() => moveBlock(idx, 1)} className="p-1 text-gray-400 hover:text-gray-600"><div className="rotate-90">›</div></button>
                                    <div className="w-px h-4 bg-gray-300 mx-2"></div>
                                    <button
                                        onClick={() => setEditingBlockId(isEditing ? null : (block._id || block.tempId))}
                                        className={`p-1.5 rounded transition ${isEditing ? 'bg-brand-blue text-white' : 'text-gray-500 hover:bg-gray-200'}`}
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => removeBlock(idx)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                                </div>
                            </div>

                            {isEditing && (
                                <div className="p-4 border-t bg-white rounded-b-lg">
                                    {/* Fork / Edit Warning for Linked Blocks */}
                                    {block._id && (
                                        <div className="mb-4 bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800 flex items-start gap-2">
                                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold">This block is linked.</p>
                                                <p>Changes here will affect ALL stages using this block.</p>
                                                <div className="mt-2 flex gap-2">
                                                    <button className="bg-white border border-amber-300 px-2 py-1 rounded shadow-sm hover:bg-amber-100 font-bold">Edit Original</button>
                                                    <button className="bg-brand-blue text-white px-2 py-1 rounded shadow-sm hover:bg-blue-600 font-bold flex items-center gap-1">
                                                        <Copy size={12} /> Duplicate & Edit
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Block Internal Name</label>
                                        <input
                                            value={block.name || ""}
                                            onChange={e => updateBlock(idx, { name: e.target.value })}
                                            className="w-full border p-2 rounded text-sm"
                                            placeholder="e.g. Personal Details Form"
                                        />
                                    </div>

                                    <BlockConfigEditor
                                        type={block.type}
                                        config={block.config}
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        onChange={(newConfig: any) => updateBlock(idx, { config: newConfig })}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add Block Menu */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-brand-blue/30 transition">
                <div className="text-center text-xs text-gray-400 font-bold uppercase mb-3">Add Content Block</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(groupedTypes).map(([category, types]) => (
                        <div key={category} className="col-span-2 md:col-span-full mb-2 last:mb-0">
                            <h5 className="text-xs font-bold text-gray-300 uppercase mb-2 ml-1">{category}</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {types.map(t => (
                                    <button
                                        key={t.key}
                                        onClick={() => addBlock(t.key)}
                                        className="flex flex-col items-center justify-center gap-2 p-3 border rounded bg-white hover:border-brand-blue hover:shadow-sm transition text-gray-600 hover:text-brand-blue h-24"
                                    >
                                        <t.icon size={20} />
                                        <span className="text-xs font-medium text-center leading-tight">{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
