import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        email: v.string(),
        name: v.string(),
        role: v.union(v.literal("admin"), v.literal("reviewer"), v.literal("applicant")),
        tokenIdentifier: v.optional(v.string()),
        linkedCohortIds: v.optional(v.array(v.id("cohorts"))),
    })
        .index("by_email", ["email"])
        .index("by_tokenIdentifier", ["tokenIdentifier"]),

    // stage_types table removed - now hardcoded constants

    block_instances: defineTable({
        type: v.string(), // "text_display", "input_text", "file_upload", etc.
        name: v.optional(v.string()), // For admin ID
        config: v.any(), // JSON content (label, placeholder, etc.)
        version: v.optional(v.number()),
    }),

    stage_templates: defineTable({
        name: v.string(),
        type: v.string(), // "form", "interview", "video", "static", "completed"
        description: v.optional(v.string()),
        config: v.any(), // Legacy config or metadata
        blockIds: v.optional(v.array(v.id("block_instances"))), // New Block Architecture
        automations: v.optional(v.array(v.object({
            trigger: v.string(),
            action: v.string(),
        }))),
        assignees: v.optional(v.array(v.string())),
    }),

    stages: defineTable({
        cohortId: v.id("cohorts"),
        name: v.string(),
        type: v.string(),
        config: v.any(),
        blockIds: v.optional(v.array(v.id("block_instances"))), // New Block Architecture
        automations: v.optional(v.array(v.object({
            trigger: v.string(),
            action: v.string(),
        }))),
        assignees: v.optional(v.array(v.string())),
        sourceTemplateId: v.optional(v.id("stage_templates")),
        originalStageId: v.optional(v.string()), // For migration tracking (the old string ID)
    }).index("by_cohort", ["cohortId"]),

    cohorts: defineTable({
        name: v.string(), // e.g., "Batch 2026"
        slug: v.string(), // e.g., "batch-2026"
        isActive: v.boolean(),
        startDate: v.number(),
        endDate: v.optional(v.number()),

        // Who can apply?
        // Who can apply?
        openPositions: v.optional(v.array(v.object({
            committee: v.string(), // e.g. "Marketing"
            roles: v.array(v.string()) // e.g. ["Graphic Designer", "Video Editor"]
        }))),

        // THE PIPELINE CONFIGURATION - DEPRECATED (Moving to 'stages' table)
        pipeline: v.optional(v.array(v.object({
            id: v.string(),        // e.g., "initial-form"
            name: v.string(),      // e.g., "Initial Application"
            type: v.string(),      // "form" | "interview" | "video" | "static" | "completed"

            // For "form" type, this holds the JSON Schema or Field Definitions
            formConfig: v.optional(v.array(v.object({
                id: v.string(),
                label: v.string(),
                type: v.string(), // "text", "email", "textarea", "select", "number"
                options: v.optional(v.array(v.string())),
                required: v.boolean(),
                placeholder: v.optional(v.string()),
            }))),

            description: v.optional(v.string()), // For UI display

            // Automation & Access
            automations: v.optional(v.array(v.object({
                trigger: v.string(), // "on-complete"
                action: v.string(), // "email-applicant", "notify-admin"
            }))),
            assignees: v.optional(v.array(v.string())), // Roles that handle this stage (e.g., "reviewer")
        }))),

        // NEW: Ordered list of stage references
        stageIds: v.optional(v.array(v.id("stages"))),
    }).index("by_slug", ["slug"]).index("by_active", ["isActive"]),

    applications: defineTable({
        userId: v.id("users"),
        cohortId: v.optional(v.id("cohorts")), // Make optional for migration safety, but should be required effectively
        currentStageId: v.string(),

        // Store data keyed by stage ID to allow multiple forms
        // e.g., { "initial-form": { name: "..." }, "skills-test": { score: 90 } }
        stageData: v.optional(v.any()),

        status: v.string(), // "pending", "approved", "rejected", "withdrawn"
        updatedAt: v.number(),
    }).index("by_user", ["userId"]).index("by_cohort", ["cohortId"]),

    reviews: defineTable({
        applicationId: v.id("applications"),
        reviewerId: v.id("users"),
        stageId: v.optional(v.id("stages")), // Link review to a specific stage
        generalScore: v.optional(v.number()), // Overall score
        generalNotes: v.optional(v.string()),
        blockData: v.optional(v.any()), // JSON: { [blockId]: { score: 10, comment: "Good", availability: [...] } }
        createdAt: v.number(),
    })
        .index("by_application", ["applicationId"])
        .index("by_stage_application", ["stageId", "applicationId"]),

    interview_slots: defineTable({
        schoolId: v.optional(v.id("cohorts")), // Optional link to cohort/school context
        blockId: v.string(), // Link to the specific block instance (block.id)
        reviewerId: v.optional(v.id("users")), // Specific host
        startTime: v.number(),
        endTime: v.number(),
        maxAttendees: v.number(), // usually 1
        attendees: v.array(v.id("users")), // Applicants who booked
        status: v.string(), // "open", "full", "cancelled"
    })
        .index("by_block", ["blockId"])
        .index("by_start_time", ["startTime"]),

    files: defineTable({
        storageId: v.string(), // The Convex Storage ID
        userId: v.id("users"), // Owner
        name: v.optional(v.string()), // Original filename
        type: v.optional(v.string()), // MIME type
        applicationId: v.optional(v.id("applications")), // Link to application context if available
        createdAt: v.number(),
    }).index("by_storageId", ["storageId"]).index("by_user", ["userId"]),
});
