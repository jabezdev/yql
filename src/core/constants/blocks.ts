import {
    LayoutTemplate,
    Split,
    PauseCircle,
    XOctagon,
    Type,
    AlignLeft,
    FileText,
    Upload,
    Link,
    Video,
    Calendar,
    Users,
    CheckSquare,
    PenTool,
    CreditCard,
    ListTodo,
    ThumbsUp,
    Shield,
    Gavel,
    Calculator,
    Lock,
    Building,
    UserPlus,
    Target,
    Clock
} from "lucide-react";

// --- Stage Types (Flow Containers) ---

export const PIPELINE_STAGE_TYPES = [
    { key: 'default', label: 'Standard Page', icon: LayoutTemplate, description: 'A generic stage composed of flexible blocks.' },
    { key: 'conditional', label: 'Conditional Branch', icon: Split, description: 'Logic-based routing (If/Else).' },
    { key: 'queue', label: 'Hold / Queue', icon: PauseCircle, description: 'Pauses application for review or batch processing.' },
    { key: 'terminal', label: 'Terminal', icon: XOctagon, description: 'Final state (Accepted, Rejected, Withdrawn).' },
] as const;

// --- Block Types (Content Units) ---

export const BLOCK_TYPES = [
    // Content & Input
    { category: "Content", key: 'content', label: 'Instruction / Content', icon: FileText, description: 'Rich text, video embeds, images.' },
    { category: "Input", key: 'form_input', label: 'Form Field', icon: Type, description: 'Short text, select, checkbox, radio.' },
    { category: "Input", key: 'rich_text_input', label: 'Long Response', icon: AlignLeft, description: 'Essays, autosave, word counts.' },
    { category: "Input", key: 'file_upload', label: 'File Upload', icon: Upload, description: 'Resume, Portfolio, etc.' },
    { category: "Input", key: 'link_input', label: 'Link Submission', icon: Link, description: 'GitHub, LinkedIn, Loom URLs.' },
    { category: "Input", key: 'video_response', label: 'Async Video', icon: Video, description: 'Timed video recording response.' },
    { category: "Input", key: 'calendar_booking', label: 'Interview Booking', icon: Calendar, description: 'Select time slots.' },
    { category: "Input", key: 'event_rsvp', label: 'Event RSVP', icon: Users, description: 'Register for live sessions.' },
    { category: "Input", key: 'quiz', label: 'Quiz / Assessment', icon: CheckSquare, description: 'Multiple choice, short answers.' },
    { category: "Input", key: 'coding_test', label: 'Coding Challenge', icon: XOctagon, description: 'Code editor and test cases.' },

    // New HR Core Blocks
    { category: "Input", key: 'department_selector', label: 'Department Selector', icon: Building, description: 'Select a department.' },
    { category: "Input", key: 'user_selector', label: 'User Selector', icon: UserPlus, description: 'Select a user.' },
    { category: "Input", key: 'goal_editor', label: 'Goal Editor', icon: Target, description: 'Define OKRs.' },
    { category: "Input", key: 'timesheet_grid', label: 'Timesheet', icon: Clock, description: 'Weekly hours logging.' },
    { category: "Input", key: 'shift_picker', label: 'Shift Picker', icon: Calendar, description: 'Select available shifts.' },
    { category: "Input", key: 'profile_input', label: 'Profile Field', icon: Users, description: 'Input synced with user profile.' },

    { category: "Action", key: 'signature', label: 'E-Signature', icon: PenTool, description: 'Sign offer letters or agreements.' },
    { category: "Action", key: 'payment', label: 'Payment', icon: CreditCard, description: 'Stripe/PayPal processing.' },
    { category: "Action", key: 'checklist', label: 'Checklist', icon: ListTodo, description: 'Onboarding tasks tracking.' },
    { category: "Action", key: 'decision_response', label: 'Applicant Decision', icon: ThumbsUp, description: 'Accept or Decline an offer.' },

    // Internal / Admin
    { category: "Internal", key: 'review_rubric', label: 'Review Rubric', icon: Shield, description: 'Internal scoring sheet.' },
    { category: "Internal", key: 'decision_gate', label: 'Manual Decision', icon: Gavel, description: 'Admin Approve/Reject controls.' },
    { category: "Internal", key: 'auto_score', label: 'Auto Scorer', icon: Calculator, description: 'Hidden scoring logic.' },
    { category: "Internal", key: 'access_gate', label: 'Access Gate', icon: Lock, description: 'Eligibility or Auth check.' },
] as const;

export type StageTypeKey = typeof PIPELINE_STAGE_TYPES[number]['key'];
export type BlockTypeKey = typeof BLOCK_TYPES[number]['key'];
