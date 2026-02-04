import { FileText, Mic, PenTool, CheckCircle2, LayoutTemplate } from "lucide-react";

export const STAGE_TYPES = [
    { value: 'static', label: 'Static Info (Text Only)', icon: LayoutTemplate, color: 'text-gray-500' },
    { value: 'form', label: 'Form (Questions)', icon: FileText, color: 'text-blue-500' },
    { value: 'interview', label: 'Interview', icon: Mic, color: 'text-purple-500' },
    { value: 'agreement', label: 'Agreement / Sign', icon: PenTool, color: 'text-orange-500' },
    { value: 'completed', label: 'Completion Screen', icon: CheckCircle2, color: 'text-green-500' },
    // Add new types here
    // { value: 'video', label: 'Video Submission', icon: Video, color: 'text-red-500' },
];

export const getStageTypeInfo = (type: string) => {
    return STAGE_TYPES.find(t => t.value === type) || { value: type, label: type, icon: LayoutTemplate, color: 'text-gray-400' };
};
