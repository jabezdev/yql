import { FileText, LayoutTemplate, Mic, PenTool, CheckCircle2, Video } from "lucide-react";

export const STAGE_TYPES = {
    static: {
        key: "static",
        label: "Static Info",
        kind: "static",
        icon: LayoutTemplate,
        description: "Display text content to the applicant."
    },
    form: {
        key: "form",
        label: "Form",
        kind: "form",
        icon: FileText,
        description: "Collect data via input fields."
    },
    interview: {
        key: "interview",
        label: "Interview",
        kind: "static", // Interviews are "static" in terms of applicant interaction (display info) unless there's a booking form
        icon: Mic,
        description: "Schedule or join an interview."
    },
    // Adding video interview based on potential future need mentioned in schema.ts
    "video-interview": {
        key: "video-interview",
        label: "Video Introduction",
        kind: "static", // Or 'video' if we have a specific renderer
        icon: Video,
        description: "Async video response."
    },
    agreement: {
        key: "agreement",
        label: "Agreement",
        kind: "form",
        icon: PenTool,
        description: "Sign a document or agree to terms."
    },
    completed: {
        key: "completed",
        label: "Completed",
        kind: "completed",
        icon: CheckCircle2,
        description: "End of pipeline."
    }
} as const;

export type StageTypeKey = keyof typeof STAGE_TYPES;

export const STAGE_TYPE_LIST = Object.values(STAGE_TYPES);
