import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        email: v.string(),
        name: v.string(),
        uuid: v.optional(v.string()),

        // System Access (Gatekeeper). Hardcoded Roles: guest, member, manager, lead, admin.
        systemRole: v.optional(v.string()),

        // Special Roles (e.g. "Recruiter")
        specialRoleIds: v.optional(v.array(v.id("special_roles"))),

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
            // HR Status: "candidate", "active", "alumni", "blocked"
            status: v.union(
                v.literal("candidate"),
                v.literal("active"),
                v.literal("alumni"),
                v.literal("blocked")
            ),
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
            // Generic Talent Development Data
            customFields: v.optional(v.any()), // e.g. { bankName: "...", emergencyContact: "..." }
            // Privacy Settings
            privacyLevel: v.optional(v.string()), // "public", "members_only", "leads_only", "private"
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
        .index("by_system_role", ["systemRole"])
        .index("by_uuid", ["uuid"]),

    // ============================================
    // ORGANIZATION STRUCTURE
    // ============================================

    departments: defineTable({
        name: v.string(),
        slug: v.string(),
        uuid: v.optional(v.string()),
        description: v.optional(v.string()),
        headId: v.optional(v.id("users")), // Department head
        parentDepartmentId: v.optional(v.id("departments")), // For nested structures
        isActive: v.boolean(),
        order: v.optional(v.number()), // Display ordering
        managerIds: v.optional(v.array(v.id("users"))), // Department leads/managers

        // Soft Delete
        isDeleted: v.optional(v.boolean()),
        deletedAt: v.optional(v.number()),
    })
        .index("by_slug", ["slug"])
        .index("by_parent", ["parentDepartmentId"])
        .index("by_active", ["isActive"])
        .index("by_uuid", ["uuid"]),

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
        uuid: v.optional(v.string()),
    })
        .index("by_entity", ["entityType", "entityId"])
        .index("by_user", ["userId"])
        .index("by_action", ["action"])
        .index("by_created", ["createdAt"])
        .index("by_uuid", ["uuid"]),

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
    // SYSTEM SETTINGS
    // ============================================

    system_settings: defineTable({
        key: v.string(),   // "maintenance_mode", "allow_guest_signup", "theme_config"
        value: v.any(),    // Flexible value
        updatedAt: v.number(),
        updatedBy: v.optional(v.id("users")),
    }).index("by_key", ["key"]),

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
        uuid: v.optional(v.string()),
    })
        .index("by_user", ["userId"])
        .index("by_unread", ["userId", "isRead"])
        .index("by_type", ["type"])
        .index("by_uuid", ["uuid"]),

    // ============================================
    // ROLES & PERMISSIONS
    // ============================================

    // SYSTEM ROLES are now Hardcoded Constants (Guest, Member, Manager, Lead, Admin)
    // This table is for SPECIAL/ADDITIVE roles (Recruiter, Interviewer, Event Coordinator)
    special_roles: defineTable({
        slug: v.string(), // "recruiter", "interviewer"
        name: v.string(), // Display name
        description: v.optional(v.string()),
        // Resource-centric access only
        permissions: v.optional(v.array(v.object({
            resource: v.string(), // "users", "processes", "programs", "departments"
            actions: v.array(v.string()), // ["read", "create", "update", "delete"]
            scope: v.optional(v.string()), // "own", "department", "all"
        }))),
    }).index("by_slug", ["slug"]),


    block_instances: defineTable({
        type: v.string(), // "text_display", "input_text", "file_upload", etc.
        name: v.optional(v.string()), // For admin ID
        config: v.any(), // JSON content (label, placeholder, etc.)
        version: v.optional(v.number()),
        parentId: v.optional(v.id("block_instances")), // Track origin of copied blocks

        // Phase 5: Granular Block Access
        roleAccess: v.optional(v.array(v.object({
            roleSlug: v.string(),       // "guest", "member", "manager"
            canView: v.boolean(),       // Visible to this role?
            canEdit: v.optional(v.boolean()), // Can interact/edit?
        }))),
        uuid: v.optional(v.string()),
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

        // Phase 4: Per-stage role visibility
        roleAccess: v.optional(v.array(v.object({
            roleSlug: v.string(),       // "guest", "member", "manager"
            canView: v.boolean(),       // Can see stage content
            canSubmit: v.boolean(),     // Can submit data for this stage
            canApprove: v.boolean(),    // Can approve/reject at this stage
        }))),

        // Soft Delete
        isDeleted: v.optional(v.boolean()),
        deletedAt: v.optional(v.number()),
        uuid: v.optional(v.string()),
    }).index("by_program", ["programId"]) // Renamed index
        .index("by_uuid", ["uuid"]),

    programs: defineTable({
        name: v.string(), // e.g., "Batch 2026", "Q1 Performance Review"
        slug: v.string(), // e.g., "batch-2026"
        uuid: v.optional(v.string()),
        category: v.optional(v.string()), // "recruitment", "operations", "performance", "onboarding"
        description: v.optional(v.string()),

        // Program classification
        programType: v.optional(v.string()), // "recruitment_cycle", "survey_campaign" - helpful for filtering but not strict logic

        isActive: v.boolean(),
        startDate: v.number(),
        endDate: v.optional(v.number()),

        // Dynamic Access Control (Inversion of Control)
        allowStartBy: v.optional(v.array(v.string())), // Role slugs allowed to START this process (e.g. ["guest", "member"])

        // Visibility & UI Config
        // Map of roleSlug -> config object. 
        // Example: { 
        //   "guest": { "dashboardLocation": "main_card", "cardTitle": "Apply Now" },
        //   "manager": { "dashboardLocation": "sidebar", "cardTitle": "Review Applications" }
        // }
        viewConfig: v.optional(v.any()),

        // Type-specific configuration (flexible)
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

        // Fine-grained access control per role
        // Each entry defines what a role can do, with optional department scoping
        accessControl: v.optional(v.array(v.object({
            roleSlug: v.string(),             // "manager", "lead", "member"
            departmentScope: v.optional(v.string()), // "own" | "all" | specific deptId
            actions: v.array(v.string()),     // ["view", "approve", "comment", "start"]
            stageVisibility: v.optional(v.array(v.string())), // Stage IDs this role can see
        }))),

    })
        .index("by_slug", ["slug"])
        .index("by_active", ["isActive"])
        .index("by_type", ["programType"])
        .index("by_uuid", ["uuid"]),

    processes: defineTable({
        userId: v.id("users"),

        // Context
        type: v.string(), // "recruitment", "recommitment", "loa_request"
        programId: v.optional(v.id("programs")), // The Time Cycle this belongs to

        // Department Scoping (Phase 3)
        departmentId: v.optional(v.id("departments")), // Which department this process belongs to
        createdFor: v.optional(v.id("users")),         // If created on behalf of another user (by manager)

        // State
        currentStageId: v.id("stages"),
        status: v.string(), // "in_progress", "approved", "rejected", "withdrawn"

        // Data Store
        // Data Store
        data: v.optional(v.any()), // { [stageId]: { ... } }

        // Visibility Level (Scalability Fix)
        // The minimum role level required to view this process (Hierarchical).
        // derived from ROLE_HIERARCHY.
        requiredRoleLevel: v.optional(v.number()),

        // Resilience: Config Snapshotting
        // Snapshot of the stage flow at the time of creation to prevent breaking changes
        // limits the process to a specific path version.
        stageFlowSnapshot: v.optional(v.array(v.id("stages"))),

        updatedAt: v.number(),
        // Soft delete
        isDeleted: v.optional(v.boolean()),
        deletedAt: v.optional(v.number()),
        uuid: v.optional(v.string()),
    })
        .index("by_user", ["userId"])
        .index("by_type", ["type"])
        .index("by_department", ["departmentId"])
        // Scalability Index: efficiently filter out high-security processes
        // Compound with updatedAt to allow "Merge Sort" pagination across levels
        .index("by_role_level_time", ["requiredRoleLevel", "updatedAt"])
        .index("by_uuid", ["uuid"]),

    reviews: defineTable({
        processId: v.id("processes"), // Replaces applicationId
        reviewerId: v.id("users"),
        stageId: v.optional(v.id("stages")), // Link review to a specific stage
        generalScore: v.optional(v.number()), // Overall score
        generalNotes: v.optional(v.string()),
        blockData: v.optional(v.any()), // JSON: { [blockId]: { score: 10, comment: "Good", availability: [...] } }
        createdAt: v.number(),
        uuid: v.optional(v.string()),
    })
        .index("by_process", ["processId"])
        .index("by_stage_process", ["stageId", "processId"])
        .index("by_uuid", ["uuid"]),

    // Generic Events (Shifts, Interviews, Meetings)
    events: defineTable({
        programId: v.optional(v.id("programs")),
        blockId: v.optional(v.id("block_instances")), // Optional if standalone shift
        hostId: v.optional(v.id("users")),
        title: v.optional(v.string()), // Added for standalone shifts
        description: v.optional(v.string()),
        location: v.optional(v.string()),
        startTime: v.number(),
        endTime: v.number(),
        maxAttendees: v.number(),
        attendees: v.array(v.id("users")),
        status: v.string(), // "open", "full", "cancelled"
        type: v.optional(v.string()), // "interview", "shift", "meeting", "orientation"
        // Soft delete
        isDeleted: v.optional(v.boolean()),
        deletedAt: v.optional(v.number()),
        uuid: v.optional(v.string()),
    })
        .index("by_block", ["blockId"])
        .index("by_start_time", ["startTime"])
        .index("by_type", ["type"])
        .index("by_uuid", ["uuid"]),

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
        uuid: v.optional(v.string()),
    }).index("by_storageId", ["storageId"]).index("by_user", ["userId"]).index("by_uuid", ["uuid"]),

    // ============================================
    // MATRIX MANAGER RELATIONSHIPS
    // ============================================

    manager_assignments: defineTable({
        userId: v.id("users"),           // The team member
        managerId: v.id("users"),        // The manager
        context: v.string(),             // "direct", "project", "dotted_line", "loa_approver"
        departmentId: v.optional(v.id("departments")),
        isPrimary: v.boolean(),          // Primary manager for this context
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()), // For temporary assignments
        // Soft delete
        isDeleted: v.optional(v.boolean()),
        deletedAt: v.optional(v.number()),
    })
        .index("by_user", ["userId"])
        .index("by_manager", ["managerId"])
        .index("by_context", ["context"]),
});

