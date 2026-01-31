import React, { useState, useRef } from "react";
import { type BlockConfigProps, type ApplicantViewProps, type ReviewerViewProps } from "../registry";
import { Upload, FileIcon, X, CheckCircle, Loader } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

// --- Configuration Editor ---
export const ConfigEditor: React.FC<BlockConfigProps> = ({ config, onChange }) => {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Label</label>
                <input
                    value={config.label || "Upload File"}
                    onChange={e => handleChange('label', e.target.value)}
                    className="w-full border p-2 rounded text-sm"
                />
            </div>
            <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-600 font-medium cursor-pointer">
                    <input
                        type="checkbox"
                        checked={!!config.required}
                        onChange={e => handleChange('required', e.target.checked)}
                        className="rounded text-brand-blue focus:ring-brand-blue"
                    />
                    Required
                </label>
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Allowed Types (Optional)</label>
                <input
                    value={config.accept || ""}
                    onChange={e => handleChange('accept', e.target.value)}
                    className="w-full border p-2 rounded text-sm"
                    placeholder="e.g. .pdf, .docx, image/*"
                />
            </div>
        </div>
    );
};

// --- Applicant View ---
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB - matches server limit

export const ParticipantView: React.FC<ApplicantViewProps> = ({ block, value, onChange, readOnly }) => {
    const { config } = block;
    // value = storageId (string)

    const [uploading, setUploading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const saveFile = useMutation(api.files.saveFile);
    // If value exists, fetching metadata might be nice to show filename, but storageId is opaque.
    // We can show "File Uploaded" stat.
    const fileData = useQuery(api.files.getFileMetadata, value ? { storageId: value } : "skip");

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side file size validation
        if (file.size > MAX_FILE_SIZE_BYTES) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
            setError(`File too large (${sizeMB}MB). Maximum size is 10MB.`);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        setError(null);
        setUploading(true);
        setFileName(file.name);
        try {
            // 1. Get URL (server validates rate limits)
            const postUrl = await generateUploadUrl();

            // 2. Upload
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!result.ok) throw new Error("Upload failed");

            const { storageId } = await result.json();

            // 3. Save Metadata (Crucial for Security)
            await saveFile({ storageId, name: file.name, type: file.type });

            // 4. Save ID to block
            onChange(storageId);
        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : "Upload failed";
            if (message.includes("limit")) {
                setError(message); // Show rate limit error
            } else {
                setError("Upload failed. Please try again.");
            }
            setFileName(null);
        } finally {
            setUploading(false);
        }
    };

    const clearFile = () => {
        onChange(null);
        setFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    if (value) {
        return (
            <div className="mb-6">
                <label className="block font-bold text-gray-700 mb-2">{config.label} {config.required && <span className="text-red-500">*</span>}</label>
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-200 text-green-700 rounded-full">
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-green-800 text-sm">File Uploaded</p>
                            {/* Ideally we store metadata alongside, but for now just showing status */}
                            {fileData && (
                                <a href={fileData.url!} target="_blank" rel="noreferrer" className="text-xs text-green-600 underline hover:text-green-800">
                                    View uploaded file
                                </a>
                            )}
                        </div>
                    </div>
                    {!readOnly && (
                        <button onClick={clearFile} className="text-gray-400 hover:text-red-500 p-2">
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="mb-6">
            <label className="block font-bold text-gray-700 mb-2">{config.label} {config.required && <span className="text-red-500">*</span>}</label>
            <div
                onClick={() => !readOnly && fileInputRef.current?.click()}
                className={`border-2 border-dashed ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'} rounded-lg p-8 flex flex-col items-center justify-center text-gray-500 transition ${!readOnly ? 'hover:bg-gray-100 cursor-pointer' : 'opacity-60'}`}
            >
                {uploading ? (
                    <div className="text-center animate-pulse">
                        <Loader size={32} className="animate-spin text-brand-blue mb-2 mx-auto" />
                        <span className="font-bold text-brand-blue">Uploading {fileName}...</span>
                    </div>
                ) : (
                    <>
                        <Upload size={32} className="mb-3 text-gray-400" />
                        <span className="font-medium text-gray-700">Click to Select File</span>
                        <span className="text-xs mt-1 text-gray-400">
                            {config.accept ? `Accepted: ${config.accept}` : "PDF, Images, Docs"} (Max 10MB)
                        </span>
                    </>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept={config.accept}
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={readOnly || uploading}
                />
            </div>
            {error && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                    <X size={14} className="shrink-0" />
                    {error}
                </div>
            )}
        </div>
    );
};

// --- Reviewer View ---
export const ReviewerView: React.FC<ReviewerViewProps> = ({ block, applicantValue }) => {
    const { config } = block;
    // applicantValue should be storageId
    const fileData = useQuery(api.files.getFileUrl, applicantValue ? { storageId: applicantValue } : "skip");

    return (
        <div className="mb-4">
            <div className="text-xs font-bold text-gray-400 uppercase mb-1">{config.label}</div>
            {applicantValue ? (
                fileData ? (
                    <a href={fileData} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 border px-3 py-2 rounded text-sm text-brand-blue font-medium transition">
                        <FileIcon size={16} /> View/Download File
                    </a>
                ) : <span className="text-xs text-gray-400">Loading file link...</span>
            ) : (
                <span className="text-gray-400 italic text-sm">No file uploaded</span>
            )}
        </div>
    );
};

// --- Validation ---
export const validate = (value: any, config: any) => {
    if (config.required && !value) return ["File upload is required."];
    return null;
};
