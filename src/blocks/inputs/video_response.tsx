import React, { useState, useRef, useEffect } from "react";
import { type BlockConfigProps, type ApplicantViewProps, type ReviewerViewProps } from "../registry";
import { Video, StopCircle, RotateCcw, Download, UploadCloud, AlertCircle } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

// --- Configuration Editor ---
export const ConfigEditor: React.FC<BlockConfigProps> = ({ config, onChange }) => {
    return (
        <div className="space-y-4 animate-fade-in">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prompt / Question</label>
                <input
                    value={config.label || ""}
                    onChange={e => onChange({ ...config, label: e.target.value })}
                    className="w-full border p-2 rounded text-sm"
                    placeholder="Tell us about yourself..."
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Duration (Seconds)</label>
                <input
                    type="number"
                    value={config.maxDuration || 120}
                    onChange={e => onChange({ ...config, maxDuration: parseInt(e.target.value) })}
                    className="w-full border p-2 rounded text-sm"
                />
            </div>
        </div>
    );
};

// --- Applicant View ---
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB - matches server limit

export const ApplicantView: React.FC<ApplicantViewProps> = ({ block, value, onChange, readOnly }) => {
    const { config } = block;
    // value = storageId (string)
    const maxDuration = config.maxDuration || 120; // Default 2 minutes

    const [isRecording, setIsRecording] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(maxDuration);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const saveFile = useMutation(api.files.saveFile);
    const savedUrl = useQuery(api.files.getFileUrl, value ? { storageId: value } : "skip");

    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    // Cleanup stream and timer on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [stream]);

    // Countdown timer effect
    useEffect(() => {
        if (isRecording) {
            setTimeLeft(maxDuration);
            timerRef.current = setInterval(() => {
                setTimeLeft((prev: number) => {
                    if (prev <= 1) {
                        // Auto-stop when time runs out
                        stopRecording();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isRecording, maxDuration]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 }, // 480p equivalent
                    height: { ideal: 480 },
                    frameRate: { ideal: 24 }
                },
                audio: true
            });
            setStream(mediaStream);
        } catch (err) {
            console.error("Camera access denied:", err);
            alert("Could not access camera. Please allow permissions.");
        }
    };

    const startRecording = () => {
        if (!stream) return;
        const recorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp8,opus',
            videoBitsPerSecond: 1000000 // 1 Mbps cap
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });

            // Check file size
            if (blob.size > MAX_VIDEO_SIZE_BYTES) {
                alert(`Video too large (${(blob.size / (1024 * 1024)).toFixed(1)}MB). Maximum is 50MB. Try a shorter recording.`);
                setPreviewUrl(null);
                return;
            }

            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            setStream(null); // Stop camera to save battery/cpu
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            stream?.getTracks().forEach(track => track.stop()); // Full stop
            setIsRecording(false);
        }
    };

    const reset = () => {
        setPreviewUrl(null);
        // setRecordedChunks([]);
        setUploadError(false);
        startCamera();
    };

    const uploadVideo = async () => {
        if (!previewUrl) return;
        setUploading(true);
        setUploadError(false);
        try {
            const blob = await fetch(previewUrl).then(r => r.blob());

            // 1. Get URL
            const postUrl = await generateUploadUrl();

            // 2. Upload
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": "video/webm" },
                body: blob,
            });

            if (!result.ok) throw new Error("Upload failed");

            const { storageId } = await result.json();

            // 3. Save Metadata
            await saveFile({ storageId, name: "video_response.webm", type: "video/webm" });

            // 4. Save ID
            onChange(storageId);
        } catch (err) {
            console.error(err);
            setUploadError(true);
        } finally {
            setUploading(false);
        }
    };

    // View: Already submitted
    if (value && savedUrl) {
        return (
            <div className="mb-6 p-4 border rounded-xl bg-gray-50">
                <h4 className="font-bold text-gray-700 mb-2">{config.label}</h4>
                <div className="aspect-video bg-black rounded overflow-hidden relative">
                    <video src={savedUrl} controls className="w-full h-full" />
                </div>
                {!readOnly && (
                    <button onClick={() => onChange(null)} className="text-xs text-red-500 underline mt-2">
                        Delete & Re-record
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="mb-6 p-4 border rounded-xl bg-white shadow-sm">
            <h4 className="font-bold text-gray-700 mb-4">{config.label || "Record a Video"}</h4>

            <div className="aspect-video bg-black rounded-lg overflow-hidden relative mb-4">
                {!stream && !previewUrl && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                        <Video size={48} className="mb-2 opacity-50" />
                        <button onClick={startCamera} className="bg-brand-blue text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600 transition">
                            Enable Camera
                        </button>
                    </div>
                )}

                {stream && !previewUrl && (
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                )}

                {previewUrl && (
                    <video src={previewUrl} controls className="w-full h-full bg-black" />
                )}

                {isRecording && (
                    <div className="absolute top-4 right-4 flex items-center gap-3">
                        <div className="bg-gray-900/80 text-white px-3 py-1 rounded-full text-sm font-mono font-bold">
                            {formatTime(timeLeft)}
                        </div>
                        <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                            <div className="w-2 h-2 bg-white rounded-full" /> REC
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
                {stream && !isRecording && (
                    <button onClick={startRecording} className="flex items-center gap-2 bg-red-500 text-white px-6 py-2 rounded-full font-bold hover:bg-red-600 transition">
                        <div className="w-3 h-3 bg-white rounded-full" /> Record
                    </button>
                )}

                {isRecording && (
                    <button onClick={stopRecording} className="flex items-center gap-2 bg-gray-800 text-white px-6 py-2 rounded-full font-bold hover:bg-black transition">
                        <StopCircle size={18} /> Stop
                    </button>
                )}

                {previewUrl && !uploading && !value && (
                    <div className="flex gap-3 w-full">
                        <button onClick={reset} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-50 flex items-center justify-center gap-2">
                            <RotateCcw size={16} /> Retake
                        </button>
                        <button onClick={uploadVideo} className="flex-[2] bg-brand-blue text-white py-2 rounded-lg font-bold hover:bg-blue-600 flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                            <UploadCloud size={18} /> Submit Video
                        </button>
                    </div>
                )}

                {uploading && (
                    <div className="w-full text-center text-brand-blue font-bold text-sm py-2">
                        Uploading...
                    </div>
                )}
            </div>

            {/* Offline Safety / Error State */}
            {uploadError && previewUrl && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                    <div className="flex-1">
                        <p className="text-sm text-red-700 font-bold mb-1">Upload Failed</p>
                        <p className="text-xs text-red-600 mb-3">Your internet connection might be unstable.</p>
                        <div className="flex gap-2">
                            <button onClick={uploadVideo} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded font-bold hover:bg-red-200">
                                Try Again
                            </button>
                            <a href={previewUrl} download={`video-response-${Date.now()}.webm`} className="text-xs border border-red-200 text-red-700 px-3 py-1 rounded font-bold hover:bg-white flex items-center gap-1">
                                <Download size={12} /> Download Backup
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Upload Option */}
            {!value && (
                <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Or Upload Video File</p>
                    <input
                        type="file"
                        accept="video/*"
                        onChange={async (e) => {
                            if (e.target.files?.[0]) {
                                const file = e.target.files[0];
                                const url = URL.createObjectURL(file);
                                setPreviewUrl(url); // Show preview
                                // Auto upload? Or wait for submit?
                                // Let's auto upload for simplicity, or reuse uploadVideo logic by mocking blob fetch
                                // Actually, better to just set it as "ready to submit" context, but our uploadVideo uses previewUrl.
                                // If previewUrl is blob:, fetch works.
                            }
                        }}
                        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                    />
                </div>
            )}
        </div>
    );
};

// --- Reviewer View ---
export const ReviewerView: React.FC<ReviewerViewProps> = ({ block, applicantValue }) => {
    const { config } = block;
    // applicantValue should be storageId
    const savedUrl = useQuery(api.files.getFileUrl, applicantValue ? { storageId: applicantValue } : "skip");

    return (
        <div className="mb-4">
            <div className="text-xs font-bold text-gray-400 uppercase mb-1">{config.label || "Video Response"}</div>
            {savedUrl ? (
                <video src={savedUrl} controls className="w-full max-w-sm rounded border bg-black aspect-video" />
            ) : (
                <div className="text-gray-400 italic text-sm">No video submitted.</div>
            )}
        </div>
    );
};

// --- Validation ---
export const validate = (value: any, _config: any) => {
    if (!value) return ["Video response is required."];
    return null;
};
