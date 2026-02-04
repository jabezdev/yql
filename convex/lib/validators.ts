import { z } from "zod";

/**
 * Common Zod Schemas for the YQL Engine.
 * Use these to validate 'v.any()' blobs in mutations.
 */

// Basic primitives
// const zId = z.string().min(1);

// ==========================================
// BLOCK CONFIGURATION
// ==========================================

export const zBlockConfig = z.object({
    label: z.string().optional(),
    placeholder: z.string().optional(),
    required: z.boolean().optional(),
    helpText: z.string().optional(),
    defaultValue: z.any().optional(),
    // Type-specific options
    options: z.array(z.string()).optional(), // For dropdowns
    validation: z.object({
        regex: z.string().optional(),
        min: z.number().optional(),
        max: z.number().optional(),
    }).optional(),
});

// ==========================================
// AUTOMATION CONFIGURATION
// ==========================================

export const zAutomationAction = z.object({
    type: z.enum(["send_email", "update_role", "update_status", "create_task"]),
    payload: z.record(z.string(), z.any()), // Flexible payload depending on type
});

export const zAutomation = z.object({
    trigger: z.enum([
        "process_created",
        "stage_submission",
        "status_change",
        "offer_accepted",
        "event_booked",
        "process_completed"
    ]),
    conditions: z.record(z.string(), z.any()).optional(), // e.g. { status: "approved" }
    actions: z.array(zAutomationAction),
});

// ==========================================
// PROGRAM CONFIGURATION
// ==========================================

export const zAccessControlEntry = z.object({
    roleSlug: z.string(),
    departmentScope: z.enum(["own", "all", "specific"]).optional(),
    actions: z.array(z.enum(["view", "approve", "comment", "start", "submit"])),
    stageVisibility: z.array(z.string()).optional(),
});

export const zProgramConfig = z.object({
    // View Config (Role -> UI Settings)
    viewConfig: z.record(z.string(), z.object({
        visible: z.boolean().optional(),
        dashboardLocation: z.string().optional(),
        cardTitle: z.string().optional(),
    })).optional(),

    // Automations
    automations: z.array(zAutomation).optional(),

    // Access Control
    accessControl: z.array(zAccessControlEntry).optional(),

    // Generic Metadata
    metadata: z.record(z.string(), z.any()).optional(),
});

// ==========================================
// STAGE SUBMISSION DATA
// ==========================================

/**
 * Validates a map of blockId -> value
 */
export const zStageSubmission = z.record(z.string(), z.any());
