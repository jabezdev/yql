/**
 * Process and Program Type Constants
 * 
 * Centralized definitions for process types supported by the HR Core System.
 * This decouples the system from recruitment-specific terminology.
 */

// ============================================
// PROCESS TYPES
// ============================================

/**
 * All supported process types in the system.
 * Processes represent workflows that users go through.
 */
export const PROCESS_TYPES = {
    // Recruitment & Onboarding
    RECRUITMENT: "recruitment",
    ONBOARDING: "onboarding",

    // Member Lifecycle
    RECOMMITMENT: "recommitment",
    LOA_REQUEST: "loa_request",
    EXIT_INTERVIEW: "exit_interview",

    // Feedback & Assessment
    SURVEY: "survey",
    PERFORMANCE_REVIEW: "performance_review",

    // Administrative
    REQUEST: "request", // Generic request process
} as const;

export type ProcessType = typeof PROCESS_TYPES[keyof typeof PROCESS_TYPES];

export const PROCESS_TYPE_LIST = Object.values(PROCESS_TYPES);

/**
 * Human-readable labels for process types
 */
export const PROCESS_TYPE_LABELS: Record<ProcessType, string> = {
    recruitment: "Recruitment",
    onboarding: "Onboarding",
    recommitment: "Recommitment",
    loa_request: "Leave of Absence Request",
    exit_interview: "Exit Interview",
    survey: "Survey",
    performance_review: "Performance Review",
    request: "Request",
};

// ============================================
// PROGRAM TYPES
// ============================================

/**
 * Types of programs/cycles the organization runs.
 * Programs contain stages and can have multiple processes.
 */
export const PROGRAM_TYPES = {
    RECRUITMENT_CYCLE: "recruitment_cycle",
    TRAINING_PROGRAM: "training_program",
    SURVEY_CAMPAIGN: "survey_campaign",
    PERFORMANCE_CYCLE: "performance_cycle",
    GENERIC: "generic",
} as const;

export type ProgramType = typeof PROGRAM_TYPES[keyof typeof PROGRAM_TYPES];

export const PROGRAM_TYPE_LIST = Object.values(PROGRAM_TYPES);

/**
 * Human-readable labels for program types
 */
export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
    recruitment_cycle: "Recruitment Cycle",
    training_program: "Training Program",
    survey_campaign: "Survey Campaign",
    performance_cycle: "Performance Cycle",
    generic: "General Program",
};

// ============================================
// PROCESS STATUS
// ============================================

/**
 * Standard process statuses
 */
export const PROCESS_STATUS = {
    IN_PROGRESS: "in_progress",
    PENDING_REVIEW: "pending_review",
    APPROVED: "approved",
    REJECTED: "rejected",
    WITHDRAWN: "withdrawn",
    COMPLETED: "completed",
} as const;

export type ProcessStatus = typeof PROCESS_STATUS[keyof typeof PROCESS_STATUS];

export const PROCESS_STATUS_LIST = Object.values(PROCESS_STATUS);

/**
 * Human-readable labels for process statuses
 */
export const PROCESS_STATUS_LABELS: Record<ProcessStatus, string> = {
    in_progress: "In Progress",
    pending_review: "Pending Review",
    approved: "Approved",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
    completed: "Completed",
};

// ============================================
// HELPERS
// ============================================

/**
 * Check if a string is a valid process type
 */
export function isValidProcessType(type: string): type is ProcessType {
    return PROCESS_TYPE_LIST.includes(type as ProcessType);
}

/**
 * Check if a string is a valid program type
 */
export function isValidProgramType(type: string): type is ProgramType {
    return PROGRAM_TYPE_LIST.includes(type as ProgramType);
}

/**
 * Check if a string is a valid process status
 */
export function isValidProcessStatus(status: string): status is ProcessStatus {
    return PROCESS_STATUS_LIST.includes(status as ProcessStatus);
}
