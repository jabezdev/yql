
// ============================================
// HR LIFECYCLE CONSTANTS
// ============================================

export const HR_STATUSES = {
    CANDIDATE: "candidate",
    ACTIVE: "active",
    ALUMNI: "alumni",
    BLOCKED: "blocked",
} as const;

export type HRStatus = (typeof HR_STATUSES)[keyof typeof HR_STATUSES];

// Helper to iterate (useful for dropdowns)
export const HR_STATUS_LIST = Object.values(HR_STATUSES);


// ============================================
// SYSTEM ROLES (Vertical Access)
// ============================================

export const SYSTEM_ROLES = {
    GUEST: "guest",     // External / Applicant
    MEMBER: "member",   // Standard employee
    MANAGER: "manager", // Operational lead
    LEAD: "lead",       // Strategic lead
    ADMIN: "admin",     // System owner
} as const;

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];

// Helper to iterate
export const SYSTEM_ROLE_LIST = Object.values(SYSTEM_ROLES);

// Hierarchy helper (useful for "is at least manager")
export const ROLE_HIERARCHY: Record<SystemRole, number> = {
    [SYSTEM_ROLES.GUEST]: 0,
    [SYSTEM_ROLES.MEMBER]: 10,
    [SYSTEM_ROLES.MANAGER]: 20,
    [SYSTEM_ROLES.LEAD]: 30,
    [SYSTEM_ROLES.ADMIN]: 100,
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
    ACCEPTED: "accepted", // Offer extended/candidate accepted stage
    OFFER_ACCEPTED: "offer_accepted",
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
    accepted: "Offer Extended",
    offer_accepted: "Offer Accepted",
    completed: "Completed",
};

// ============================================
// HELPERS
// ============================================

/** Check if a string is a valid program type */
export function isValidProgramType(type: string): type is ProgramType {
    return PROGRAM_TYPE_LIST.includes(type as ProgramType);
}

/** Check if a string is a valid process status */
export function isValidProcessStatus(status: string): status is ProcessStatus {
    return PROCESS_STATUS_LIST.includes(status as ProcessStatus);
}

// ============================================
// ACCESS CONTROL HELPERS
// ============================================

/**
 * Check if a user has at least the minimum required role level.
 * Uses ROLE_HIERARCHY for comparison (e.g., manager >= member).
 */
export function hasMinimumRole(userRole: string | undefined, minimumRole: SystemRole): boolean {
    const userLevel = ROLE_HIERARCHY[userRole as SystemRole] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole];
    return userLevel >= requiredLevel;
}

/**
 * Check if a user's HR status indicates they are blocked.
 */
export function isBlockedStatus(hrStatus: string | undefined): boolean {
    return hrStatus === HR_STATUSES.BLOCKED;
}

/**
 * Check if a user's HR status indicates they are active (not blocked, alumni, or candidate).
 */
export function isActiveStatus(hrStatus: string | undefined): boolean {
    return hrStatus === HR_STATUSES.ACTIVE;
}

/**
 * Roles that have "staff" access (can view/manage others' data).
 * Use hasMinimumRole(role, SYSTEM_ROLES.MANAGER) instead of hardcoding.
 */
export const STAFF_ROLES: readonly SystemRole[] = [
    SYSTEM_ROLES.MANAGER,
    SYSTEM_ROLES.LEAD,
    SYSTEM_ROLES.ADMIN,
] as const;

/**
 * Check if a role is considered "staff" (manager or above).
 */
export function isStaffRole(role: string | undefined): boolean {
    return hasMinimumRole(role, SYSTEM_ROLES.MANAGER);
}

/**
 * Get the numeric level for a role (for database indexing/filtering).
 */
export function getRoleLevel(role: string | undefined): number {
    return ROLE_HIERARCHY[role as SystemRole] ?? 0;
}

/**
 * Check if a role is admin. Use this instead of inline `role === 'admin'` checks.
 */
export function isAdmin(role: string | undefined): boolean {
    return role === SYSTEM_ROLES.ADMIN;
}
