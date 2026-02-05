
import { z } from "zod";
import type { Doc } from "../_generated/dataModel";

// Helper to infer Zod schema from stage config (if possible)
// For now, we define a flexible schema but allow strict validation later
export const submissionSchema = z.record(z.string(), z.any());
export const zStageSubmission = submissionSchema;

export function generateUuid(): string {
    return crypto.randomUUID();
}

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
    _submissionData: any,
    stageSnapshot?: string[] // Optional snapshot of IDs
): string | null {

    // If Snapshot exists, we prioritize that order but we still need the Pipeline DOCS.
    // However, the `pipeline` passed here might be the Current Program Pipeline.
    // If we have a snapshot, we should filter/sort the pipeline to match the snapshot?
    // Or simpler: The snapshot IS the order.

    let orderedPipeline = pipeline;
    if (stageSnapshot && stageSnapshot.length > 0) {
        // Sort pipeline to match snapshot order
        const snapshotMap = new Map(stageSnapshot.map((id, index) => [id, index]));

        // Filter out stages not in snapshot (optional? No, keep logic clean).
        // Actually, we sort.
        orderedPipeline = [...pipeline].sort((a, b) => {
            const idxA = snapshotMap.get(a._id) ?? 999;
            const idxB = snapshotMap.get(b._id) ?? 999;
            return idxA - idxB;
        });

        // Note: If a stage is in the pipeline but NOT in the snapshot, it gets pushed to end.
        // If a stage is in the snapshot but NOT in the pipeline (deleted?), it won't be in orderedPipeline.
        // This is correct behavior (we can't route to a deleted stage).
    }

    const currentIndex = orderedPipeline.findIndex(p => p._id === currentStageId || p.originalStageId === currentStageId);
    if (currentIndex === -1) return null;

    const currentStage = orderedPipeline[currentIndex];
    const config = currentStage.config || {};

    // Check for explicit routing rules
    if (config.routingRules && Array.isArray(config.routingRules)) {
        for (const rule of config.routingRules) {
            // rule: { condition: { field, op, value }, targetStageId }
            if (evaluateCondition(rule.condition, _submissionData)) {
                // Find target stage in pipeline
                const target = orderedPipeline.find(p => p._id === rule.targetStageId || p.originalStageId === rule.targetStageId);
                if (target) return target._id;
            }
        }
    }

    const nextStage = orderedPipeline[currentIndex + 1];
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
