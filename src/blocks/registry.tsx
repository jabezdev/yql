import type { BlockTypeKey } from "../constants/blocks";
import type { BlockInstance } from "../types/blocks";
import React from "react";
import * as FormInput from "./inputs/form_input";
import * as StaticContent from "./content/static";
import * as RichTextInput from "./inputs/rich_text";
import * as CalendarBooking from "./inputs/calendar_booking";
import * as FileUpload from "./inputs/file_upload";
import * as LinkInput from "./inputs/link_input";
import * as ReviewRubric from "./internal/review_rubric";
import * as Quiz from "./inputs/quiz";
import * as CodingTest from "./inputs/coding_test";
import * as Checklist from "./inputs/checklist";
import * as EventRSVP from "./inputs/event_rsvp";
import * as DecisionResponse from "./inputs/decision_response";
import * as DecisionGate from "./internal/decision_gate";
import * as AutoScore from "./internal/auto_score";
import * as AccessGate from "./internal/access_gate";
import * as VideoResponse from "./inputs/video_response";
import * as Placeholder from "./common/placeholder";

// ============================================
// Component Props Types (with generics for type safety)
// ============================================

/**
 * Props for block configuration editors (admin panel)
 * @template TConfig - The specific config type for this block
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface BlockConfigProps<TConfig = any> {
    config: TConfig;
    onChange: (newConfig: TConfig) => void;
}

/**
 * Props for applicant-facing block views
 * @template TConfig - The specific config type for this block
 * @template TValue - The value type for applicant submissions
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApplicantViewProps<TConfig = any, TValue = any> {
    block: BlockInstance<TConfig>;
    value: TValue;
    onChange: (value: TValue) => void;
    readOnly?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allValues?: Record<string, any>; // Other block values for cross-block logic
}

/**
 * Props for reviewer-facing block views
 * @template TConfig - The specific config type for this block
 * @template TApplicantValue - What the applicant submitted
 * @template TReviewerValue - What the reviewer can add
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ReviewerViewProps<
    TConfig = any,
    TApplicantValue = any,
    TReviewerValue = any
> {
    block: BlockInstance<TConfig>;
    applicantValue: TApplicantValue;
    reviewerValue: TReviewerValue;
    onChange?: (value: TReviewerValue) => void;
    isEditable?: boolean;
}

/**
 * Block definition in the registry.
 * Uses explicit typing at runtime while supporting generics for individual block development.
 * 
 * For type-safe block development, use the generic interfaces above:
 * - BlockConfigProps<YourConfigType>
 * - ApplicantViewProps<YourConfigType, YourValueType>
 * - ReviewerViewProps<YourConfigType, YourApplicantValueType, YourReviewerValueType>
 */
export interface BlockDefinition {
    type: BlockTypeKey;
    title: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ConfigEditor: React.FC<BlockConfigProps<any>>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ParticipantView: React.FC<ApplicantViewProps<any, any>>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ReviewerView: React.FC<ReviewerViewProps<any, any, any>>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validate?: (value: any, config: any) => string[] | null;
}

// Registry Map
export const BLOCK_REGISTRY: Partial<Record<BlockTypeKey, BlockDefinition>> = {
    form_input: {
        type: 'form_input',
        title: 'Form Field',
        ConfigEditor: FormInput.ConfigEditor,
        ParticipantView: FormInput.ParticipantView,
        ReviewerView: FormInput.ReviewerView,
        validate: FormInput.validate
    },
    content: {
        type: 'content',
        title: 'Static Content',
        ConfigEditor: StaticContent.ConfigEditor,
        ParticipantView: StaticContent.ParticipantView,
        ReviewerView: StaticContent.ReviewerView,
        validate: StaticContent.validate
    },
    rich_text_input: {
        type: 'rich_text_input',
        title: 'Long Answer',
        ConfigEditor: RichTextInput.ConfigEditor,
        ParticipantView: RichTextInput.ParticipantView,
        ReviewerView: RichTextInput.ReviewerView,
        validate: RichTextInput.validate
    },
    calendar_booking: {
        type: 'calendar_booking',
        title: 'Interview Booking',
        ConfigEditor: CalendarBooking.ConfigEditor,
        ParticipantView: CalendarBooking.ParticipantView,
        ReviewerView: CalendarBooking.ReviewerView,
        validate: CalendarBooking.validate
    },
    file_upload: {
        type: 'file_upload',
        title: 'File Upload',
        ConfigEditor: FileUpload.ConfigEditor,
        ParticipantView: FileUpload.ParticipantView,
        ReviewerView: FileUpload.ReviewerView,
        validate: FileUpload.validate
    },
    link_input: {
        type: 'link_input',
        title: 'Link Submission',
        ConfigEditor: LinkInput.ConfigEditor,
        ParticipantView: LinkInput.ParticipantView,
        ReviewerView: LinkInput.ReviewerView,
        validate: LinkInput.validate
    },
    review_rubric: {
        type: 'review_rubric',
        title: 'Review Rubric',
        ConfigEditor: ReviewRubric.ConfigEditor,
        ParticipantView: ReviewRubric.ParticipantView,
        ReviewerView: ReviewRubric.ReviewerView,
        validate: ReviewRubric.validate
    },
    quiz: {
        type: 'quiz',
        title: 'Quiz',
        ConfigEditor: Quiz.ConfigEditor,
        ParticipantView: Quiz.ParticipantView,
        ReviewerView: Quiz.ReviewerView,
        validate: Quiz.validate
    },
    coding_test: {
        type: 'coding_test',
        title: 'Coding Challenge',
        ConfigEditor: CodingTest.ConfigEditor,
        ParticipantView: CodingTest.ParticipantView,
        ReviewerView: CodingTest.ReviewerView,
        validate: CodingTest.validate
    },
    checklist: {
        type: 'checklist',
        title: 'Checklist',
        ConfigEditor: Checklist.ConfigEditor,
        ParticipantView: Checklist.ParticipantView,
        ReviewerView: Checklist.ReviewerView,
        validate: Checklist.validate
    },
    event_rsvp: {
        type: 'event_rsvp',
        title: 'Event RSVP',
        ConfigEditor: EventRSVP.ConfigEditor,
        ParticipantView: EventRSVP.ParticipantView,
        ReviewerView: EventRSVP.ReviewerView,
        validate: EventRSVP.validate
    },
    decision_response: {
        type: 'decision_response',
        title: 'Offer Decision',
        ConfigEditor: DecisionResponse.ConfigEditor,
        ParticipantView: DecisionResponse.ParticipantView,
        ReviewerView: DecisionResponse.ReviewerView,
        validate: DecisionResponse.validate
    },
    decision_gate: {
        type: 'decision_gate',
        title: 'Decision Gate',
        ConfigEditor: DecisionGate.ConfigEditor,
        ParticipantView: DecisionGate.ParticipantView,
        ReviewerView: DecisionGate.ReviewerView,
        validate: DecisionGate.validate
    },
    auto_score: {
        type: 'auto_score',
        title: 'Auto Score',
        ConfigEditor: AutoScore.ConfigEditor,
        ParticipantView: AutoScore.ParticipantView,
        ReviewerView: AutoScore.ReviewerView,
        validate: AutoScore.validate
    },
    access_gate: {
        type: 'access_gate',
        title: 'Access Gate',
        ConfigEditor: AccessGate.ConfigEditor,
        ParticipantView: AccessGate.ParticipantView,
        ReviewerView: AccessGate.ReviewerView,
        validate: AccessGate.validate
    },
    video_response: {
        type: 'video_response',
        title: 'Video Response',
        ConfigEditor: VideoResponse.ConfigEditor,
        ParticipantView: VideoResponse.ParticipantView,
        ReviewerView: VideoResponse.ReviewerView,
        validate: VideoResponse.validate
    },
    // Placeholders for the rest
    signature: { type: 'signature', title: 'signature', ...Placeholder },
    payment: { type: 'payment', title: 'payment', ...Placeholder },
};

export const getBlockDefinition = (type: BlockTypeKey): BlockDefinition | null => {
    return BLOCK_REGISTRY[type] || null;
};
