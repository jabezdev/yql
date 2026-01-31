/**
 * Convex Validators for Block Configurations
 * 
 * These validators mirror the TypeScript interfaces in src/types/blocks.ts
 * They enforce schema validation at the database level.
 * 
 * IMPORTANT: Keep these in sync with the TypeScript types!
 */

import { v } from "convex/values";

// ============================================
// CONTENT BLOCKS
// ============================================

export const contentBlockConfigValidator = v.object({
    label: v.optional(v.string()),
    required: v.optional(v.boolean()),
    html: v.optional(v.string()),
    markdown: v.optional(v.string()),
});

// ============================================
// INPUT BLOCKS
// ============================================

export const formInputConfigValidator = v.object({
    label: v.optional(v.string()),
    required: v.optional(v.boolean()),
    type: v.union(
        v.literal("text"),
        v.literal("email"),
        v.literal("tel"),
        v.literal("number"),
        v.literal("select"),
        v.literal("textarea"),
        v.literal("date")
    ),
    placeholder: v.optional(v.string()),
    options: v.optional(v.array(v.string())),
    validation: v.optional(v.object({
        min: v.optional(v.number()),
        max: v.optional(v.number()),
        pattern: v.optional(v.string()),
        minLength: v.optional(v.number()),
        maxLength: v.optional(v.number()),
    })),
});

export const richTextInputConfigValidator = v.object({
    label: v.optional(v.string()),
    required: v.optional(v.boolean()),
    placeholder: v.optional(v.string()),
    minWords: v.optional(v.number()),
    maxWords: v.optional(v.number()),
    enableFormatting: v.optional(v.boolean()),
});

export const fileUploadConfigValidator = v.object({
    label: v.optional(v.string()),
    required: v.optional(v.boolean()),
    accept: v.optional(v.string()),
    maxSizeMB: v.optional(v.number()),
});

export const linkInputConfigValidator = v.object({
    label: v.optional(v.string()),
    required: v.optional(v.boolean()),
    placeholder: v.optional(v.string()),
    urlPattern: v.optional(v.string()),
    allowedDomains: v.optional(v.array(v.string())),
});

export const videoResponseConfigValidator = v.object({
    label: v.optional(v.string()),
    required: v.optional(v.boolean()),
    maxDuration: v.optional(v.number()),
    prompt: v.optional(v.string()),
});

export const calendarBookingConfigValidator = v.object({
    label: v.optional(v.string()),
    required: v.optional(v.boolean()),
    instructions: v.optional(v.string()),
    duration: v.optional(v.number()),
});

export const eventRSVPConfigValidator = v.object({
    label: v.optional(v.string()),
    required: v.optional(v.boolean()),
    eventName: v.optional(v.string()),
    eventDate: v.optional(v.string()),
    location: v.optional(v.string()),
    maxAttendees: v.optional(v.number()),
});

export const quizQuestionValidator = v.object({
    text: v.string(),
    options: v.array(v.string()),
    correctAnswer: v.optional(v.string()),
});

export const quizConfigValidator = v.object({
    label: v.optional(v.string()),
    required: v.optional(v.boolean()),
    questions: v.array(quizQuestionValidator),
    shuffleQuestions: v.optional(v.boolean()),
    shuffleOptions: v.optional(v.boolean()),
});

export const codingTestConfigValidator = v.object({
    label: v.optional(v.string()),
    required: v.optional(v.boolean()),
    problemTitle: v.optional(v.string()),
    problemDescription: v.optional(v.string()),
    language: v.optional(v.string()),
    starterCode: v.optional(v.string()),
    testCases: v.optional(v.array(v.object({
        input: v.string(),
        expectedOutput: v.string(),
    }))),
});

export const checklistItemValidator = v.object({
    id: v.string(),
    text: v.string(),
    required: v.optional(v.boolean()),
});

export const checklistConfigValidator = v.object({
    label: v.optional(v.string()),
    required: v.optional(v.boolean()),
    items: v.array(checklistItemValidator),
    requireAll: v.optional(v.boolean()),
});

export const decisionResponseConfigValidator = v.object({
    label: v.optional(v.string()),
    required: v.optional(v.boolean()),
    acceptText: v.optional(v.string()),
    declineText: v.optional(v.string()),
    deadline: v.optional(v.string()),
});

// ============================================
// ACTION BLOCKS (Placeholders)
// ============================================

export const signatureConfigValidator = v.object({
    label: v.optional(v.string()),
    required: v.optional(v.boolean()),
    documentUrl: v.optional(v.string()),
    agreementText: v.optional(v.string()),
});

export const paymentConfigValidator = v.object({
    label: v.optional(v.string()),
    required: v.optional(v.boolean()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    description: v.optional(v.string()),
});

// ============================================
// INTERNAL BLOCKS
// ============================================

export const rubricCriterionValidator = v.object({
    id: v.string(),
    label: v.string(),
    maxScore: v.number(),
    description: v.optional(v.string()),
});

export const reviewRubricConfigValidator = v.object({
    criteria: v.array(rubricCriterionValidator),
    showToApplicant: v.optional(v.boolean()),
});

export const decisionGateConfigValidator = v.object({
    internalNotes: v.optional(v.string()),
    autoAdvance: v.optional(v.boolean()),
});

export const scoringRuleValidator = v.object({
    blockId: v.string(),
    weight: v.number(),
    method: v.union(
        v.literal("exact_match"),
        v.literal("contains"),
        v.literal("regex"),
        v.literal("numeric_range")
    ),
    value: v.optional(v.union(v.string(), v.number())),
});

export const autoScoreConfigValidator = v.object({
    rules: v.array(scoringRuleValidator),
    passingScore: v.optional(v.number()),
});

export const accessGateConfigValidator = v.object({
    passcode: v.optional(v.string()),
    message: v.optional(v.string()),
});

// ============================================
// Validator Registry
// ============================================

/**
 * Map of block type to its config validator.
 * Used by mutations to validate config before saving.
 */
export const BLOCK_CONFIG_VALIDATORS: Record<string, ReturnType<typeof v.object>> = {
    content: contentBlockConfigValidator,
    form_input: formInputConfigValidator,
    rich_text_input: richTextInputConfigValidator,
    file_upload: fileUploadConfigValidator,
    link_input: linkInputConfigValidator,
    video_response: videoResponseConfigValidator,
    calendar_booking: calendarBookingConfigValidator,
    event_rsvp: eventRSVPConfigValidator,
    quiz: quizConfigValidator,
    coding_test: codingTestConfigValidator,
    checklist: checklistConfigValidator,
    decision_response: decisionResponseConfigValidator,
    signature: signatureConfigValidator,
    payment: paymentConfigValidator,
    review_rubric: reviewRubricConfigValidator,
    decision_gate: decisionGateConfigValidator,
    auto_score: autoScoreConfigValidator,
    access_gate: accessGateConfigValidator,
};

/**
 * Get the validator for a specific block type.
 * Returns undefined if the block type is unknown.
 */
export function getBlockConfigValidator(type: string) {
    return BLOCK_CONFIG_VALIDATORS[type];
}

/**
 * Check if a block type has a registered validator.
 */
export function hasBlockValidator(type: string): boolean {
    return type in BLOCK_CONFIG_VALIDATORS;
}
