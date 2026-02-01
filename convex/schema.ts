import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        email: v.string(),
        name: v.string(),

        // System Access (Gatekeeper)
        // Links to 'roles' table via slug
        systemRole: v.optional(v.string()),

        // Hierarchy & Permissions
        // 0=Guest, 1=Probation, 2=Member, 3=Officer, 4=Exec, 5=SystemOwner
        clearanceLevel: v.optional(v.number()),

        tokenIdentifier: v.optional(v.string()),

        // The "Flexible" Profile
        profile: v.optional(v.object({
            // Flexible array for multiple hats
            positions: v.array(v.object({
                title: v.optional(v.string()),
                departmentId: v.optional(v.id("departments")),
                isPrimary: v.boolean(),
                startDate: v.optional(v.number()),
                endDate: v.optional(v.number()),
            })),
            status: v.string(), // "candidate", "active", "on_leave", "alumni", "probation"
            joinDate: v.optional(v.number()),
            exitDate: v.optional(v.number()),
            exitReason: v.optional(v.string()),
            // Status change history
            statusHistory: v.optional(v.array(v.object({
                status: v.string(),
                changedAt: v.number(),
                changedBy: v.optional(v.id("users")),
                reason: v.optional(v.string()),
            }))),
            // Generic HR Data
            customFields: v.optional(v.any()), // e.g. { bankName: "...", emergencyContact: "..." }
        })),

        // Soft Delete
        isDeleted: v.optional(v.boolean()),
        deletedAt: v.optional(v.number()),

        // Notification preferences
        notificationPreferences: v.optional(v.object({
            email: v.object({
                enabled: v.boolean(),
                frequency: v.string(), // "instant", "daily", "weekly"
            }),
            inApp: v.boolean(),
        })),
    })
        .index("by_email", ["email"])
        .index("by_tokenIdentifier", ["tokenIdentifier"])
        .index("by_system_role", ["systemRole"]),

    // ============================================
    // ORGANIZATION STRUCTURE
    // ============================================

    departments: defineTable({
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        headId: v.optional(v.id("users")), // Department head
        parentDepartmentId: v.optional(v.id("departments")), // For nested structures
        isActive: v.boolean(),
        order: v.optional(v.number()), // Display ordering

        // Soft Delete
        isDeleted: v.optional(v.boolean()),
        deletedAt: v.optional(v.number()),
    })
        .index("by_slug", ["slug"])
        .index("by_parent", ["parentDepartmentId"])
        .index("by_active", ["isActive"]),

    // ============================================
    // AUDIT & LOGGING
    // ============================================

    audit_logs: defineTable({
        userId: v.id("users"), // Who performed the action
        action: v.string(), // "user.status_change", "process.advance", "role.update"
        entityType: v.string(), // "users", "processes", "stages", "departments"
        entityId: v.string(), // The modified record ID
        changes: v.optional(v.any()), // { before: {...}, after: {...} }
        metadata: v.optional(v.any()), // Additional context
        createdAt: v.number(),
    })
        .index("by_entity", ["entityType", "entityId"])
        .index("by_user", ["userId"])
        .index("by_action", ["action"])
        .index("by_created", ["createdAt"]),

    // ============================================
    // RATE LIMITING
    // ============================================

    rate_limits: defineTable({
        userId: v.id("users"),
        action: v.string(),      // "process.create", "notification.create", "event.create"
        count: v.number(),       // Number of actions in current window
        windowStart: v.number(), // Timestamp when window started
    })
        .index("by_user_action", ["userId", "action"]),

    // ============================================
    // GDPR / DELETION REQUESTS
    // ============================================

    deletion_requests: defineTable({
        userId: v.id("users"),
        status: v.string(),      // "pending", "approved", "rejected", "completed"
        requestedAt: v.number(),
        processedAt: v.optional(v.number()),
        processedBy: v.optional(v.id("users")),
        reason: v.optional(v.string()),
    })
        .index("by_user", ["userId"])
        .index("by_status", ["status"]),

    // ============================================
    // NOTIFICATIONS
    // ============================================

    notifications: defineTable({
        userId: v.id("users"),
        type: v.string(), // "process_update", "event_reminder", "system_alert", "status_change"
        title: v.string(),
        message: v.string(),
        link: v.optional(v.string()), // Deep link to relevant page
        relatedEntityType: v.optional(v.string()), // "processes", "events"
        relatedEntityId: v.optional(v.string()),
        isRead: v.boolean(),
        createdAt: v.number(),
        // Soft delete
        isDeleted: v.optional(v.boolean()),
        deletedAt: v.optional(v.number()),
    })
        .index("by_user", ["userId"])
        .index("by_unread", ["userId", "isRead"])
        .index("by_type", ["type"]),

    // ============================================
    // ROLES & PERMISSIONS
    // ============================================

    roles: defineTable({
        slug: v.string(), // e.g. "guest", "member"
        name: v.string(), // Display name
        description: v.optional(v.string()),
        // Legacy UI permissions (kept for compatibility)
        uiPermissions: v.array(v.string()),
        // Granular permissions
        permissions: v.optional(v.array(v.object({
            resource: v.string(), // "users", "processes", "programs", "departments"
            actions: v.array(v.string()), // ["read", "create", "update", "delete"]
            scope: v.optional(v.string()), // "own", "department", "all"
        }))),
        allowedProcessTypes: v.array(v.string()), // "recruitment", "survey"
        defaultDashboardSlug: v.optional(v.string()),
        isSystemRole: v.optional(v.boolean()), // Prevent modification of core roles
    }).index("by_slug", ["slug"]),

    dashboards: defineTable({
        slug: v.string(), // e.g. "guest_dashboard"
        name: v.string(),
        description: v.optional(v.string()),
        // Layout Config: list of rows/cols OR simple list of blockIds
        layout: v.array(v.object({
            blockId: v.id("block_instances"),
            width: v.optional(v.number()), // Grid columns (e.g. 12 max)
            config: v.optional(v.any()), // Override config unique to this placement
        })),
    }).index("by_slug", ["slug"]),

    // stage_types table removed - now hardcoded constants

    block_instances: defineTable({
        type: v.string(), // "text_display", "input_text", "file_upload", etc.
        name: v.optional(v.string()), // For admin ID
        config: v.any(), // JSON content (label, placeholder, etc.)
        version: v.optional(v.number()),
        parentId: v.optional(v.id("block_instances")), // Track origin of copied blocks
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
        // Soft Delete
        isDeleted: v.optional(v.boolean()),
        deletedAt: v.optional(v.number()),
    }),

    stages: defineTable({
        programId: v.id("programs"), // Renamed from cohortId
        name: v.string(),
        type: v.string(),
        config: v.any(),
        description: v.optional(v.string()), // Added for UI helper text
        blockIds: v.optional(v.array(v.id("block_instances"))), // New Block Architecture
        automations: v.optional(v.array(v.object({
            trigger: v.string(),
            action: v.string(),
        }))),
        assignees: v.optional(v.array(v.string())),
        sourceTemplateId: v.optional(v.id("stage_templates")),
        originalStageId: v.optional(v.string()), // For migration tracking (the old string ID)
        // Soft Delete
        isDeleted: v.optional(v.boolean()),
        deletedAt: v.optional(v.number()),
    }).index("by_program", ["programId"]), // Renamed index

    programs: defineTable({
        name: v.string(), // e.g., "Batch 2026", "Q1 Performance Review"
        slug: v.string(), // e.g., "batch-2026"

        // Program classification
        programType: v.optional(v.string()), // "recruitment_cycle", "survey_campaign", etc.

        isActive: v.boolean(),
        startDate: v.number(),
        endDate: v.optional(v.number()),

        // Type-specific configuration (flexible based on programType)
        // For recruitment: { openPositions: [...] }
        // For surveys: { targetAudience: "all_members" }
        // For performance: { reviewPeriod: "Q1 2026" }
        config: v.optional(v.any()),

        stageIds: v.optional(v.array(v.id("stages"))), // Ordered list of stages

        // Process Automations
        automations: v.optional(v.array(v.object({
            trigger: v.string(), // "status_change", "stage_submission"
            conditions: v.optional(v.any()), // e.g. { status: "approved" }
            actions: v.array(v.object({
                type: v.string(), // "send_email", "update_role", "update_status"
                payload: v.any() // { template: "...", role: "member" }
            }))
        }))),

    })
        .index("by_slug", ["slug"])
        .index("by_active", ["isActive"])
        .index("by_type", ["programType"]),

    processes: defineTable({
        userId: v.id("users"),

        // Context
        type: v.string(), // "recruitment", "recommitment", "loa_request"
        programId: v.optional(v.id("programs")), // The Time Cycle this belongs to

        // State
        currentStageId: v.id("stages"),
        status: v.string(), // "in_progress", "approved", "rejected", "withdrawn"

        // Data Store
        data: v.optional(v.any()), // { [stageId]: { ... } }

        updatedAt: v.number(),
        // Soft delete
        isDeleted: v.optional(v.boolean()),
        deletedAt: v.optional(v.number()),
    }).index("by_user", ["userId"]).index("by_type", ["type"]),

    reviews: defineTable({
        processId: v.id("processes"), // Replaces applicationId
        reviewerId: v.id("users"),
        stageId: v.optional(v.id("stages")), // Link review to a specific stage
        generalScore: v.optional(v.number()), // Overall score
        generalNotes: v.optional(v.string()),
        blockData: v.optional(v.any()), // JSON: { [blockId]: { score: 10, comment: "Good", availability: [...] } }
        createdAt: v.number(),
    })
        .index("by_process", ["processId"])
        .index("by_stage_process", ["stageId", "processId"]),

    events: defineTable({ // Renamed from interview_slots
        programId: v.optional(v.id("programs")), // Renamed from schoolId/cohortId
        blockId: v.id("block_instances"), // Link to the specific block instance (block.id)
        hostId: v.optional(v.id("users")), // Renamed from reviewerId
        startTime: v.number(),
        endTime: v.number(),
        maxAttendees: v.number(), // usually 1
        attendees: v.array(v.id("users")), // Users who booked
        status: v.string(), // "open", "full", "cancelled"
        type: v.optional(v.string()), // "interview", "meeting"
        // Soft delete
        isDeleted: v.optional(v.boolean()),
        deletedAt: v.optional(v.number()),
    })
        .index("by_block", ["blockId"])
        .index("by_start_time", ["startTime"]),

    files: defineTable({
        storageId: v.string(), // The Convex Storage ID
        userId: v.id("users"), // Owner
        name: v.optional(v.string()), // Original filename
        type: v.optional(v.string()), // MIME type
        processId: v.optional(v.id("processes")), // Replaces applicationId
        createdAt: v.number(),
        // Soft delete
        isDeleted: v.optional(v.boolean()),
        deletedAt: v.optional(v.number()),
    }).index("by_storageId", ["storageId"]).index("by_user", ["userId"]),
});

