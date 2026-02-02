import { z } from "zod";
import type { Doc } from "../_generated/dataModel";

// Helper to infer Zod schema from stage config (if possible)
// For now, we define a flexible schema but allow strict validation later
export const submissionSchema = z.record(z.string(), z.any());

/**
 * Validates stage submission data against the configuration.
 * Uses Zod for runtime validation.
 */
export function validateStageSubmission(data: any, stageConfig: Doc<"stages">) {
    const config = stageConfig.config as any;

    // 1. Basic Structure Validation
    const parsedData = submissionSchema.safeParse(data);
    if (!parsedData.success) {
        throw new Error("Invalid submission data format.");
    }

    // 2. Form Validation based on 'formConfig' (if present)
    const formConfig = config?.formConfig || (stageConfig as any).formConfig;

    if (formConfig && Array.isArray(formConfig)) {
        for (const field of formConfig) {
            const value = data[field.id];
            const isPresent = value !== undefined && value !== null && value !== "";

            // Check Required
            if (field.required && !isPresent) {
                throw new Error(`Field '${field.label || field.id}' is required.`);
            }

            // Type Validation (Enhanced with Zod logic)
            if (isPresent) {
                if (field.type === "email") {
                    const emailSchema = z.string().email();
                    const result = emailSchema.safeParse(value);
                    if (!result.success) {
                        throw new Error(`Field '${field.label || field.id}' must be a valid email.`);
                    }
                } else if (field.type === "number") {
                    const numberSchema = z.coerce.number();
                    const result = numberSchema.safeParse(value);
                    if (!result.success) {
                        throw new Error(`Field '${field.label || field.id}' must be a number.`);
                    }
                }
            }
        }
    }

    // 3. Block-based Validation
    // 3. Block-based Validation
    if (stageConfig.blockIds && stageConfig.blockIds.length > 0) {
        // If blocks are passed in variants or context, we could validate.
        // For now, we rely on `config.requiredFields` which can be synced with blocks.
        if (config.requiredFields && Array.isArray(config.requiredFields)) {
            for (const fieldId of config.requiredFields) {
                if (!data[fieldId]) {
                    throw new Error(`Field '${fieldId}' is required.`);
                }
            }
        }
    }

    return true;
}

/**
 * Calculates the next stage in the pipeline.
 * Currently linear, but can be extended for branching logic.
 */
export function calculateNextStage(
    currentStageId: string,
    pipeline: Doc<"stages">[],
    _submissionData: any
): string | null {

    const currentIndex = pipeline.findIndex(p => p._id === currentStageId || p.originalStageId === currentStageId);
    if (currentIndex === -1) return null;

    const currentStage = pipeline[currentIndex];
    const config = currentStage.config || {};

    // Check for explicit routing rules
    if (config.routingRules && Array.isArray(config.routingRules)) {
        for (const rule of config.routingRules) {
            // rule: { condition: { field, op, value }, targetStageId }
            if (evaluateCondition(rule.condition, _submissionData)) {
                // Find target stage in pipeline
                // We assume target is in the pipeline.
                const target = pipeline.find(p => p._id === rule.targetStageId || p.originalStageId === rule.targetStageId);
                if (target) return target._id;
            }
        }
    }

    const nextStage = pipeline[currentIndex + 1];
    return nextStage ? nextStage._id : null;
}

function evaluateCondition(condition: any, data: any): boolean {
    if (!condition) return true;
    const value = data[condition.field];

    switch (condition.op) {
        case "eq": return value === condition.value;
        case "neq": return value !== condition.value;
        case "gt": return value > condition.value;
        case "lt": return value < condition.value;
        case "contains": return Array.isArray(value) && value.includes(condition.value);
        case "exists": return value !== undefined && value !== null;
        default: return value === condition.value;
    }
}
