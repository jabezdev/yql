import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getViewer } from "./auth";
import { createAuditLog } from "./auditLog";

/**
 * Nominate a user for promotion (Manager only)
 */
export const nominateForPromotion = mutation({
    args: {
        nomineeId: v.id("users"),
        proposedRole: v.string(), // e.g. "senior_member"
        justification: v.string(),
        programId: v.optional(v.id("programs")), // Optional link to review cycle
    },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        // Verify manager relationship
        const assignment = await ctx.db
            .query("manager_assignments")
            .withIndex("by_manager", (q) => q.eq("managerId", viewer._id))
            .filter((q) => q.eq(q.field("userId"), args.nomineeId))
            .first();

        if (!assignment && viewer.systemRole !== 'admin') {
            throw new Error("Only managers can nominate direct reports");
        }

        // Get stage template for promotion (mocking a "lookup" here for simplicity)
        // In real app, we'd find the "promotion_process" template
        const stage = await ctx.db.query("stages").withIndex("by_program").first(); // Fallback placeholder
        // TODO: Create a proper 'Promotion' program/template or use a hardcoded flow.
        // For now, we will create a generic process.

        const now = Date.now();
        const processId = await ctx.db.insert("processes", {
            userId: args.nomineeId,
            type: "promotion",
            programId: args.programId,
            createdFor: args.nomineeId,
            status: "in_progress",
            // We need a valid stage ID. In a real setup, we would seed a "Promotion Approval" stage.
            // For this MVP, we might need to rely on the generic process engine or create a 'promotion' table.
            // Let's assume we use the `processes` table but with a specific type. 
            // We NEED a valid currentStageId.
            currentStageId: stage?._id as any, // HACK: potentially unsafe if DB empty
            data: {
                nomination: {
                    nominatorId: viewer._id,
                    proposedRole: args.proposedRole,
                    justification: args.justification,
                    submittedAt: now
                }
            },
            updatedAt: now,
        });

        await createAuditLog(ctx, {
            userId: viewer._id,
            action: "promotion.nominate",
            entityType: "processes",
            entityId: processId,
            metadata: { nomineeId: args.nomineeId, role: args.proposedRole }
        });

        return processId;
    },
});

/**
 * Get promotion requests (Admin/HR view)
 */
export const getPromotionRequests = query({
    args: { status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        // Admin/HR check
        if (!['admin', 'manager'].includes(viewer.systemRole ?? "")) {
            throw new Error("Unauthorized");
        }

        let requests = await ctx.db
            .query("processes")
            .withIndex("by_type", (q) => q.eq("type", "promotion"))
            .collect();

        if (args.status) {
            requests = requests.filter(r => r.status === args.status);
        }

        // Enrich with user details
        return await Promise.all(requests.map(async (r) => {
            const nominee = await ctx.db.get(r.userId);
            const nominatorId = r.data?.nomination?.nominatorId as Id<"users">;
            const nominator = nominatorId ? await ctx.db.get(nominatorId) : null;

            return {
                ...r,
                nomineeName: nominee?.name,
                nominatorName: nominator?.name,
                currentRole: nominee?.systemRole,
                proposedRole: r.data?.nomination?.proposedRole,
            };
        }));
    },
});
