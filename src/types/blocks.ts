/**
 * Block Configuration and Value Types
 * 
 * This file defines TypeScript interfaces for all block types.
 * These types are used by:
 * - ConfigEditor components (admin editing block settings)
 * - ApplicantView components (applicant filling out blocks)
 * - ReviewerView components (reviewers viewing submissions)
 * 
 * Corresponding Convex validators are in convex/validators/blocks.ts
 */

import type { Id } from "../../convex/_generated/dataModel";

// ============================================
// Base Types
// ============================================

/** Base interface that all block configs extend */
export interface BaseBlockConfig {
    label?: string;
    required?: boolean;
}

/** Block instance as stored in the database */
export interface BlockInstance<TConfig = unknown> {
    _id: Id<"block_instances">;
    _creationTime: number;
    type: string;
    name?: string;
    config: TConfig;
    version?: number;
}

// ============================================
// CONTENT BLOCKS
// ============================================

/** Static content block - displays HTML/markdown to applicants */
export interface ContentBlockConfig extends BaseBlockConfig {
    html?: string;
    markdown?: string;
}
export type ContentBlockValue = null; // Content blocks don't have values

// ============================================
// INPUT BLOCKS
// ============================================

/** Form input - basic text fields, selects, etc. */
export interface FormInputConfig extends BaseBlockConfig {
    type: 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea' | 'date';
    placeholder?: string;
    options?: string[]; // For select type
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        minLength?: number;
        maxLength?: number;
    };
}
export type FormInputValue = string;

/** Rich text / long answer input */
export interface RichTextInputConfig extends BaseBlockConfig {
    placeholder?: string;
    minWords?: number;
    maxWords?: number;
    enableFormatting?: boolean;
}
export type RichTextInputValue = string;

/** File upload block */
export interface FileUploadConfig extends BaseBlockConfig {
    accept?: string; // MIME types e.g. "image/*,.pdf"
    maxSizeMB?: number;
}
export type FileUploadValue = string; // storageId

/** Link submission block */
export interface LinkInputConfig extends BaseBlockConfig {
    placeholder?: string;
    urlPattern?: string; // Optional regex to validate URL format
    allowedDomains?: string[]; // e.g. ["github.com", "linkedin.com"]
}
export type LinkInputValue = string; // URL

/** Video response block */
export interface VideoResponseConfig extends BaseBlockConfig {
    maxDuration?: number; // In seconds
    prompt?: string; // Question to answer
}
export type VideoResponseValue = string; // storageId

/** Calendar/interview booking block */
export interface CalendarBookingConfig extends BaseBlockConfig {
    instructions?: string;
    duration?: number; // Slot duration in minutes
}
export interface CalendarBookingValue {
    slotId?: string;
    bookedAt?: string;
}

/** Event RSVP block */
export interface EventRSVPConfig extends BaseBlockConfig {
    eventName?: string;
    eventDate?: string;
    location?: string;
    maxAttendees?: number;
}
export interface EventRSVPValue {
    attending: boolean;
    guestCount?: number;
}

/** Quiz block */
export interface QuizQuestion {
    text: string;
    options: string[];
    correctAnswer?: string; // For auto-grading
}
export interface QuizConfig extends BaseBlockConfig {
    questions: QuizQuestion[];
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
}
export type QuizValue = Record<number, string>; // { questionIndex: selectedOption }

/** Coding test block */
export interface CodingTestConfig extends BaseBlockConfig {
    problemTitle?: string;
    problemDescription?: string;
    language?: string;
    starterCode?: string;
    testCases?: Array<{
        input: string;
        expectedOutput: string;
    }>;
}
export interface CodingTestValue {
    code: string;
    language?: string;
}

/** Checklist block */
export interface ChecklistItem {
    id: string;
    text: string;
    required?: boolean;
}
export interface ChecklistConfig extends BaseBlockConfig {
    items: ChecklistItem[];
    requireAll?: boolean;
}
export type ChecklistValue = Record<string, boolean>; // { itemId: isChecked }

/** Decision response block - applicant accepts/declines an offer */
export interface DecisionResponseConfig extends BaseBlockConfig {
    acceptText?: string;
    declineText?: string;
    deadline?: string;
}
export interface DecisionResponseValue {
    decision: 'accept' | 'decline';
    timestamp: string;
}

// ============================================
// ACTION BLOCKS (Placeholder configs)
// ============================================

/** Signature block - for e-signatures */
export interface SignatureConfig extends BaseBlockConfig {
    documentUrl?: string;
    agreementText?: string;
}
export interface SignatureValue {
    signatureData?: string; // Base64 or SVG
    signedAt?: string;
}

/** Payment block - for Stripe/PayPal processing */
export interface PaymentConfig extends BaseBlockConfig {
    amount?: number;
    currency?: string;
    description?: string;
}
export interface PaymentValue {
    transactionId?: string;
    status?: 'pending' | 'completed' | 'failed';
    paidAt?: string;
}

// ============================================
// INTERNAL BLOCKS
// ============================================

/** Review rubric - internal scoring sheet */
export interface RubricCriterion {
    id: string;
    label: string;
    maxScore: number;
    description?: string;
}
export interface ReviewRubricConfig {
    criteria: RubricCriterion[];
    showToApplicant?: boolean; // Usually false
}
export interface ReviewRubricValue {
    scores: Record<string, number>; // { criterionId: score }
    notes?: string;
}

/** Decision gate - admin approve/reject controls */
export interface DecisionGateConfig {
    internalNotes?: string;
    autoAdvance?: boolean;
}
export interface DecisionGateValue {
    decision: 'approve' | 'reject' | 'waitlist';
    timestamp?: string;
    reason?: string;
}

/** Auto scorer - hidden scoring logic */
export interface ScoringRule {
    blockId: string;
    weight: number;
    method: 'exact_match' | 'contains' | 'regex' | 'numeric_range';
    value?: string | number;
}
export interface AutoScoreConfig {
    rules: ScoringRule[];
    passingScore?: number;
}
export type AutoScoreValue = null; // Calculated, not submitted

/** Access gate - passcode or auth check */
export interface AccessGateConfig {
    passcode?: string; // NEVER send to client!
    message?: string;
}
export interface AccessGateValue {
    unlocked: boolean;
}

// ============================================
// Type Maps for Generic Access
// ============================================

/** Map of block type to its config type */
export interface BlockConfigMap {
    content: ContentBlockConfig;
    form_input: FormInputConfig;
    rich_text_input: RichTextInputConfig;
    file_upload: FileUploadConfig;
    link_input: LinkInputConfig;
    video_response: VideoResponseConfig;
    calendar_booking: CalendarBookingConfig;
    event_rsvp: EventRSVPConfig;
    quiz: QuizConfig;
    coding_test: CodingTestConfig;
    checklist: ChecklistConfig;
    decision_response: DecisionResponseConfig;
    signature: SignatureConfig;
    payment: PaymentConfig;
    review_rubric: ReviewRubricConfig;
    decision_gate: DecisionGateConfig;
    auto_score: AutoScoreConfig;
    access_gate: AccessGateConfig;
}

/** Map of block type to its value type */
export interface BlockValueMap {
    content: ContentBlockValue;
    form_input: FormInputValue;
    rich_text_input: RichTextInputValue;
    file_upload: FileUploadValue;
    link_input: LinkInputValue;
    video_response: VideoResponseValue;
    calendar_booking: CalendarBookingValue;
    event_rsvp: EventRSVPValue;
    quiz: QuizValue;
    coding_test: CodingTestValue;
    checklist: ChecklistValue;
    decision_response: DecisionResponseValue;
    signature: SignatureValue;
    payment: PaymentValue;
    review_rubric: ReviewRubricValue;
    decision_gate: DecisionGateValue;
    auto_score: AutoScoreValue;
    access_gate: AccessGateValue;
}

/** Union of all block type keys */
export type BlockType = keyof BlockConfigMap;

/** Get config type for a specific block type */
export type ConfigFor<T extends BlockType> = BlockConfigMap[T];

/** Get value type for a specific block type */
export type ValueFor<T extends BlockType> = BlockValueMap[T];
