import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { X, Loader2, UploadCloud, File, CheckCircle } from "lucide-react";

interface FileUploadBlockProps {
    block: Doc<"block_instances">;
    value: any; // expects { fileId: string, storageId: string, name: string } or null
    onChange: (value: any) => void;
    readOnly?: boolean;
}

export function FileUploadBlock({ block, value, onChange, readOnly }: FileUploadBlockProps) {
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const saveFile = useMutation(api.files.saveFile);

    // If we have a value, we can verify it exists or display it.
    // For now, we trust the value stored in the form data.

    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);

        try {
            // 1. Get Upload URL
            const postUrl = await generateUploadUrl();

            // 2. Upload File
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!result.ok) throw new Error("Upload failed: " + result.statusText);

            const { storageId } = await result.json();

            // 3. Save Metadata
            const fileId = await saveFile({
                storageId,
                name: file.name,
                type: file.type,
                // We don't have processId readily available here in the block props, 
                // but usually the renderer manages the context. 
                // Either we pass processId down, or we update it later. 
                // For now, let's leave processId undefined or try to infer if possible (not easy here).
                // Actually, `saveFile` allows optional processId.
            });

            // 4. Update Block Data
            onChange({
                fileId,
                storageId,
                name: file.name,
                type: file.type,
                uploadedAt: Date.now()
            });

        } catch (err) {
            console.error(err);
            setError((err as Error).message);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemove = () => {
        if (confirm("Are you sure you want to remove this file?")) {
            onChange(null);
            // We could also call deleteFile here, but usually form data clearing is enough 
            // until specific cleanups happen.
        }
    };

    return (
        <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                {block.config?.label || "Upload Document"}
                {block.config?.required && <span className="text-red-500">*</span>}
            </h3>

            {block.config?.description && (
                <p className="text-sm text-gray-500 mb-4">{block.config.description}</p>
            )}

            {value ? (
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                            <File size={24} />
                        </div>
                        <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{value.name}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <CheckCircle size={10} className="text-green-500" />
                                Uploaded successfully
                            </p>
                        </div>
                    </div>

                    {!readOnly && (
                        <button
                            onClick={handleRemove}
                            className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            ) : (
                <div className={`
                    border-2 border-dashed rounded-xl p-8 text-center transition-all
                    ${isUploading ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-300 hover:border-brand-blue hover:bg-blue-50'}
                `}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleUpload}
                        className="hidden"
                        accept={block.config?.accept || "*/*"}
                        disabled={readOnly || isUploading}
                    />

                    {isUploading ? (
                        <div className="flex flex-col items-center">
                            <Loader2 className="animate-spin text-brand-blue mb-2" size={32} />
                            <p className="text-gray-500 font-medium">Uploading...</p>
                        </div>
                    ) : (
                        <div
                            className="cursor-pointer flex flex-col items-center"
                            onClick={() => !readOnly && fileInputRef.current?.click()}
                        >
                            <div className="bg-blue-100 p-3 rounded-full text-brand-blue mb-4">
                                <UploadCloud size={24} />
                            </div>
                            <p className="text-gray-900 font-medium mb-1">Click to upload or drag and drop</p>
                            <p className="text-xs text-gray-500">
                                {block.config?.accept ? `Supported files: ${block.config.accept}` : "Any file type allowed"}
                                (Max 10MB)
                            </p>
                        </div>
                    )}
                </div>
            )}

            {error && <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
        </div>
    );
}
