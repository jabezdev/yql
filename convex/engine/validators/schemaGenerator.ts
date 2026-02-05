
import { z } from "zod";

/**
 * Generates a strict Zod schema based on the stage configuration.
 * Used to validate submission data payloads dynamically but strictly.
 */
export function generateSchemaFromConfig(config: any): z.ZodObject<any> {
    const shape: Record<string, z.ZodTypeAny> = {};

    // 1. Form Config Validation
    if (config.formConfig && Array.isArray(config.formConfig)) {
        for (const field of config.formConfig) {
            let fieldSchema: z.ZodTypeAny = z.any();

            // Type mapping
            switch (field.type) {
                case "text":
                case "textarea":
                    fieldSchema = z.string();
                    break;
                case "email":
                    fieldSchema = z.string().email();
                    break;
                case "number":
                    fieldSchema = z.coerce.number();
                    break;
                case "date":
                    fieldSchema = z.coerce.date(); // or string/number depending on storage
                    break;
                case "boolean":
                case "checkbox":
                    fieldSchema = z.boolean();
                    break;
                case "select":
                    if (field.options && Array.isArray(field.options)) {
                        // Create literal union if options exist
                        // Using z.enum if strings, otherwise just string/any
                        if (field.options.every((o: any) => typeof o === 'string')) {
                            // z.enum requires at least one option
                            if (field.options.length > 0) {
                                // @ts-ignore
                                fieldSchema = z.enum(field.options as [string, ...string[]]);
                            } else {
                                fieldSchema = z.string();
                            }
                        } else {
                            fieldSchema = z.string();
                        }
                    } else {
                        fieldSchema = z.string();
                    }
                    break;
                default:
                    fieldSchema = z.any();
            }

            // Constraints
            if (field.required) {
                // If required, we don't add .optional()
                // But we might want to check for non-empty string?
                if (field.type === 'text' || field.type === 'textarea') {
                    fieldSchema = (fieldSchema as z.ZodString).min(1, "Required");
                }
            } else {
                fieldSchema = fieldSchema.optional().or(z.literal(""));
            }

            shape[field.id] = fieldSchema;
        }
    }

    // 2. Block Logic (if blocks are defined)
    // For now, we allow extra keys but we can restrict if needed.
    // However, if we want strictness, we should use .strict() on the object?
    // "Permissive Read, Strict Write" -> We want to ensure passed data matches config.

    // Allow unknown keys? 
    // Ideally: No. But Blocks store data in different keys.
    // Let's rely on FormConfig for now.

    // If no config, return loose schema
    if (Object.keys(shape).length === 0) {
        return z.object({}).catchall(z.any());
    }

    return z.object(shape).catchall(z.any()); // Allow extra fields for now to avoid breaking blocks not in formConfig
}
