import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        email: v.string(),
        password: v.string(),
        name: v.string(),
        role: v.string(), // "admin", "reviewer", "applicant" - keeping as string for flexibility
    }).index("by_email", ["email"]),

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

        // THE PIPELINE CONFIGURATION
        pipeline: v.array(v.object({
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
        })),
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
        score: v.number(),
        notes: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_application", ["applicationId"]),
});
