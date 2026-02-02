import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";

import { DEFAULT_ROLES } from "./roles";
import type { Id } from "./_generated/dataModel";

// ============================================
// DEFAULT DEPARTMENTS
// ============================================

const DEFAULT_DEPARTMENTS = [
    { slug: "core", name: "Core Team", description: "Executive leadership and coordination", order: 0 },
    { slug: "marketing", name: "Marketing", description: "Promotions, branding, and outreach", order: 1 },
    { slug: "events", name: "Events", description: "Event planning and execution", order: 2 },
    { slug: "finance", name: "Finance", description: "Budget management and sponsorships", order: 3 },
    { slug: "hr", name: "Human Resources", description: "Member welfare and recruitment", order: 4 },
    { slug: "external", name: "External Affairs", description: "Partnerships and external relations", order: 5 },
    { slug: "tech", name: "Technology", description: "IT systems and digital infrastructure", order: 6 },
];

// ============================================
// SEED MUTATIONS
// ============================================

/**
 * Main seed function - seeds all base data
 */
export const seedAll = mutation({
    args: {},
    handler: async (ctx) => {
        console.log("=== Starting Full Seed ===");

        // 1. Seed Roles
        await seedRoles(ctx);

        // 2. Seed Departments
        await seedDepartments(ctx);

        // 3. Seed Program
        const programId = await seedProgram(ctx);

        // 4. Seed Dashboards
        await seedDashboards(ctx);

        console.log("=== Seed Complete ===");
        return { programId };
    },
});

/**
 * Seed roles from DEFAULT_ROLES
 */
async function seedRoles(ctx: MutationCtx) {
    console.log("Seeding roles...");
    for (const roleDef of DEFAULT_ROLES) {
        const existing = await ctx.db
            .query("roles")
            .withIndex("by_slug", (q) => q.eq("slug", roleDef.slug))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                name: roleDef.name,
                description: roleDef.description,
                uiPermissions: roleDef.uiPermissions,
                permissions: roleDef.permissions,
                defaultDashboardSlug: roleDef.defaultDashboardSlug,
                isSystemRole: roleDef.isSystemRole,
            });
        } else {
            await ctx.db.insert("roles", roleDef);
        }
    }
    console.log(`Seeded ${DEFAULT_ROLES.length} roles.`);
}

/**
 * Seed departments from DEFAULT_DEPARTMENTS
 */
async function seedDepartments(ctx: MutationCtx) {
    console.log("Seeding departments...");
    for (const dept of DEFAULT_DEPARTMENTS) {
        const existing = await ctx.db
            .query("departments")
            .withIndex("by_slug", (q) => q.eq("slug", dept.slug))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                name: dept.name,
                description: dept.description,
                order: dept.order,
            });
        } else {
            await ctx.db.insert("departments", {
                ...dept,
                isActive: true,
            });
        }
    }
    console.log(`Seeded ${DEFAULT_DEPARTMENTS.length} departments.`);
}

/**
 * Seed a default program
 */
async function seedProgram(ctx: MutationCtx) {
    console.log("Seeding program...");
    let programId;
    const existingProgram = await ctx.db
        .query("programs")
        .withIndex("by_slug", (q) => q.eq("slug", "batch-2026"))
        .first();

    if (existingProgram) {
        console.log("Program 'batch-2026' already exists.");
        programId = existingProgram._id;
    } else {
        programId = await ctx.db.insert("programs", {
            name: "Batch 2026",
            slug: "batch-2026",
            isActive: true,
            startDate: Date.now(),
            stageIds: []
        });
        console.log("Created Program:", programId);
    }

    return programId;
}

async function seedDashboards(ctx: MutationCtx) {
    // --- Blocks ---

    // Guest: Welcome Banner
    const guestBannerId = await createOrGetBlock(ctx, "widget_banner", "guest_welcome", {
        title: "Welcome to YQL HR",
        message: "Please sign in or start your application.",
        variant: "info"
    });

    // Guest: Application Action
    const guestActionId = await createOrGetBlock(ctx, "widget_action_grid", "guest_actions", {
        actions: [
            { label: "Start Application", link: "/apply", permission: "dashboard.view_recruitment", variant: "primary" }
        ]
    });

    // Member: Stat Cards
    const memberStatsId = await createOrGetBlock(ctx, "widget_stat_card", "member_stats", {
        items: [
            { label: "Active Cycles", dataKey: "active_cycles_count", icon: "activity" },
            { label: "Pending Tasks", dataKey: "pending_tasks_count", icon: "alert-circle" }
        ]
    });

    // Member: Process List
    const memberProcessesId = await createOrGetBlock(ctx, "widget_process_list", "my_processes", {
        title: "My Activities",
        filterTypes: ["recruitment", "loa_request", "recommitment"]
    });

    // Admin: Overview Stats
    const adminStatsId = await createOrGetBlock(ctx, "widget_stat_card", "admin_stats", {
        items: [
            { label: "Total Members", dataKey: "total_members", icon: "users" },
            { label: "Pending Applications", dataKey: "pending_apps", icon: "file-text" }
        ]
    });

    // --- Dashboards ---

    // Guest Dashboard
    await createOrUpdateDashboard(ctx, "guest_dashboard", "Guest Dashboard", [
        { blockId: guestBannerId, width: 12 },
        { blockId: guestActionId, width: 12 }
    ]);

    // Member Dashboard
    await createOrUpdateDashboard(ctx, "member_dashboard", "Member Dashboard", [
        { blockId: memberStatsId, width: 12 },
        { blockId: memberProcessesId, width: 12 }
    ]);

    // Admin Dashboard
    await createOrUpdateDashboard(ctx, "admin_dashboard", "Admin Dashboard", [
        { blockId: adminStatsId, width: 12 },
        { blockId: memberProcessesId, width: 12 } // Reuse process list for now or bespoke one
    ]);

    console.log("Dashboards seeded.");
}

async function createOrGetBlock(ctx: MutationCtx, type: string, name: string, config: Record<string, unknown>): Promise<Id<"block_instances">> {
    // Ideally we check by name to avoid dupes, but block_instances doesn't have a unique index on name.
    // We can scan or just insert. For a seed script, checking is safer.
    // Since we don't have an index on name, we might accumulate blocks if we aren't careful.
    // For this prototype, we'll try to find one with the same name.
    const existing = await ctx.db.query("block_instances")
        .filter((q) => q.eq(q.field("name"), name))
        .first();

    if (existing) {
        // Optional: Update config?
        return existing._id;
    }

    return await ctx.db.insert("block_instances", {
        type,
        name,
        config,
        version: 1
    });
}

async function createOrUpdateDashboard(ctx: MutationCtx, slug: string, name: string, layout: Array<{ blockId: Id<"block_instances">; width: number }>): Promise<Id<"dashboards">> {
    const existing = await ctx.db.query("dashboards")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();

    if (existing) {
        await ctx.db.patch(existing._id, {
            name,
            layout
        });
        return existing._id;
    }

    return await ctx.db.insert("dashboards", {
        slug,
        name,
        layout
    });
}


