import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getViewer, ensureAdmin } from "./auth";
import { createAuditLog } from "./auditLog";

/**
 * Submit Reimbursement Request
 */
export const submitReimbursement = mutation({
    args: {
        amount: v.number(),
        description: v.string(),
        receiptUrl: v.string(), // Assume file uploaded via other means or external link
    },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        const processId = await ctx.db.insert("processes", {
            userId: viewer._id,
            type: "reimbursement_request",
            createdFor: viewer._id,
            status: "pending_approval",
            currentStageId: (await ctx.db.query("stages").first())?._id as any, // Placeholder
            data: {
                reimbursement: {
                    amount: args.amount,
                    description: args.description,
                    receiptUrl: args.receiptUrl,
                    submittedAt: Date.now(),
                }
            },
            updatedAt: Date.now(),
        });

        // Notify Admins
        const tdTeam = await ctx.db.query("users").collect();
        const admins = tdTeam.filter(u => u.systemRole === 'admin' && !u.isDeleted);

        for (const admin of admins) {
            await ctx.db.insert("notifications", {
                userId: admin._id,
                type: "finance",
                title: "New Reimbursement Request",
                message: `${viewer.name} requested $${args.amount}`,
                link: `/dashboard/admin/finance`, // Mock
                isRead: false,
                createdAt: Date.now(),
            });
        }

        return processId;
    }
});

/**
 * Resolve Reimbursement (Approve/Reject)
 */
export const resolveReimbursement = mutation({
    args: {
        processId: v.id("processes"),
        approved: v.boolean(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        const process = await ctx.db.get(args.processId);
        if (!process || process.type !== "reimbursement_request") {
            throw new Error("Invalid request");
        }

        const newStatus = args.approved ? "approved" : "rejected";

        await ctx.db.patch(process._id, {
            status: newStatus,
            updatedAt: Date.now(),
            data: {
                ...process.data,
                reimbursement: {
                    ...process.data.reimbursement,
                    resolvedBy: admin._id,
                    resolvedAt: Date.now(),
                    notes: args.notes,
                }
            }
        });

        await ctx.db.insert("notifications", {
            userId: process.userId,
            type: "finance",
            title: `Reimbursement ${args.approved ? "Approved" : "Rejected"}`,
            message: `Your request for $${process.data.reimbursement.amount} has been ${newStatus}.`,
            isRead: false,
            createdAt: Date.now(),
        });

        await createAuditLog(ctx, {
            userId: admin._id,
            action: args.approved ? "finance.approve" : "finance.reject",
            entityType: "processes",
            entityId: process._id,
        });
    }
});

/**
 * Get all reimbursements (Admin)
 */
export const getAllReimbursements = query({
    args: {},
    handler: async (ctx) => {
        await ensureAdmin(ctx);
        const processes = await ctx.db
            .query("processes")
            .withIndex("by_type", (q) => q.eq("type", "reimbursement_request"))
            .collect();

        return await Promise.all(processes.map(async (p) => {
            const user = await ctx.db.get(p.userId);
            return {
                ...p,
                userName: user?.name
            };
        }));
    }
});

/**
 * Get my reimbursements
 */
export const getMyReimbursements = query({
    args: {},
    handler: async (ctx) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        return await ctx.db
            .query("processes")
            .withIndex("by_user", (q) => q.eq("userId", viewer._id))
            .filter(q => q.eq(q.field("type"), "reimbursement_request"))
            .collect();
    }
});
