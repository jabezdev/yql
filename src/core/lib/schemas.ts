import { z } from "zod";

// ==========================================
// Process Data Schemas
// ==========================================

export const processStatusSchema = z.enum([
    "in_progress",
    "approved",
    "rejected",
    "withdrawn",
    "completed",
]);

export const submissionDecisionSchema = z.enum(["accept", "decline"]);

// Generic flexible data field (used in v.any() validation layers)
export const flexibleDataSchema = z.record(z.string(), z.any());

// ==========================================
// Program Configuration Schemas
// ==========================================

export const viewConfigSchema = z.record(
    z.string(), // roleSlug
    z.object({
        visible: z.boolean().optional(),
        dashboardLocation: z.string().optional(),
        cardTitle: z.string().optional(),
        actions: z.array(z.string()).optional(),
    })
);

export const accessControlEntrySchema = z.object({
    roleSlug: z.string(),
    departmentScope: z.enum(["own", "all"]).or(z.string()).optional(),
    actions: z.array(z.string()),
    stageVisibility: z.array(z.string()).optional(),
});

export const programConfigSchema = z.object({
    allowStartBy: z.array(z.string()).optional(), // Legacy
    viewConfig: viewConfigSchema.optional(),
    accessControl: z.array(accessControlEntrySchema).optional(),
});

// ==========================================
// Automation Schemas
// ==========================================

export const automationTriggerSchema = z.enum([
    "status_change",
    "stage_submission",
]);

export const automationActionSchema = z.object({
    type: z.string(), // e.g., "send_email", "update_role"
    payload: z.record(z.string(), z.any()),
});

export const automationSchema = z.object({
    trigger: automationTriggerSchema,
    conditions: z.record(z.string(), z.any()).optional(),
    actions: z.array(automationActionSchema),
});

// ==========================================
// Types
// ==========================================

export type ProcessStatus = z.infer<typeof processStatusSchema>;
export type ViewConfig = z.infer<typeof viewConfigSchema>;
export type ProgramConfig = z.infer<typeof programConfigSchema>;
export type Automation = z.infer<typeof automationSchema>;
