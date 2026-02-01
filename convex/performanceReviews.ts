import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getViewer, ensureAdmin } from "./auth";
import { createAuditLog } from "./auditLog";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// ============================================
// CONSTANTS
// ============================================

export const CYCLE_STATUSES = [
    "draft",       // Being configured
    "active",      // Accepting submissions
    "calibration", // Manager calibration phase
    "completed",   // Finalized
] as const;

export const REVIEW_STATUSES = [
    "pending",     // Not started
    "in_progress", // Started but not submitted
    "submitted",   // Completed
] as const;

// ============================================
// QUERIES
// ============================================

/**
 * Get all review cycles (Talent Development team view)
 */
export const getAllCycles = query({
    args: { status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer || (viewer.clearanceLevel ?? 0) < 3) {
            throw new Error("Officer access required");
        }

        let cycles = await ctx.db.query("review_cycles").collect();

        if (args.status) {
            cycles = cycles.filter((c) => c.status === args.status);
        }

        // Sort by start date descending
        cycles.sort((a, b) => b.startDate - a.startDate);

        return cycles;
    },
});

/**
 * Get a specific cycle with stats
 */
export const getCycle = query({
    args: { cycleId: v.id("review_cycles") },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer || (viewer.clearanceLevel ?? 0) < 3) {
            throw new Error("Officer access required");
        }

        const cycle = await ctx.db.get(args.cycleId);
        if (!cycle) return null;

        // Get stats
        const peerAssignments = await ctx.db
            .query("peer_review_assignments")
            .withIndex("by_cycle", (q) => q.eq("cycleId", args.cycleId))
            .collect();

        const submitted = peerAssignments.filter((a) => a.status === "submitted").length;
        const total = peerAssignments.length;

        return {
            ...cycle,
            stats: {
                peerReviewsTotal: total,
                peerReviewsSubmitted: submitted,
                peerReviewsProgress: total > 0 ? Math.round((submitted / total) * 100) : 0,
            },
        };
    },
});

/**
 * Get my pending peer reviews (for current user)
 */
export const getMyPeerReviews = query({
    args: { cycleId: v.optional(v.id("review_cycles")) },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        let assignments = await ctx.db
            .query("peer_review_assignments")
            .withIndex("by_reviewer", (q) => q.eq("reviewerId", viewer._id))
            .collect();

        if (args.cycleId) {
            assignments = assignments.filter((a) => a.cycleId === args.cycleId);
        }

        // Enrich with reviewee info (only name, not identity-revealing data)
        const enriched = await Promise.all(
            assignments.map(async (a) => {
                const cycle = await ctx.db.get(a.cycleId);
                const reviewee = await ctx.db.get(a.revieweeId);
                return {
                    _id: a._id,
                    cycleId: a.cycleId,
                    cycleName: cycle?.name ?? "Unknown Cycle",
                    revieweeName: reviewee?.name ?? "Unknown",
                    status: a.status,
                    isAnonymous: a.isAnonymous,
                    deadline: cycle?.peerReviewDeadline,
                };
            })
        );

        return enriched;
    },
});

/**
 * Get peer feedback received (anonymized)
 */
export const getMyPeerFeedback = query({
    args: { cycleId: v.id("review_cycles") },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        const cycle = await ctx.db.get(args.cycleId);
        if (!cycle) throw new Error("Cycle not found");

        // Only show feedback after cycle is completed (or for admins)
        if (cycle.status !== "completed" && (viewer.clearanceLevel ?? 0) < 4) {
            return { status: "pending", feedback: [] };
        }

        const feedback = await ctx.db
            .query("peer_review_assignments")
            .withIndex("by_reviewee", (q) => q.eq("revieweeId", viewer._id))
            .filter((q) =>
                q.and(
                    q.eq(q.field("cycleId"), args.cycleId),
                    q.eq(q.field("status"), "submitted")
                )
            )
            .collect();

        // Return anonymized feedback (no reviewer info)
        return {
            status: "available",
            feedback: feedback.map((f, index) => ({
                id: `peer-${index + 1}`,
                data: f.data,
                submittedAt: f.submittedAt,
            })),
        };
    },
});

/**
 * Get cycle progress for manager (their direct reports)
 */
export const getTeamProgress = query({
    args: { cycleId: v.id("review_cycles") },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer || (viewer.clearanceLevel ?? 0) < 3) {
            throw new Error("Officer access required");
        }

        // Get manager's direct reports
        const directReports = await ctx.db
            .query("manager_assignments")
            .withIndex("by_manager", (q) => q.eq("managerId", viewer._id))
            .filter((q) =>
                q.and(
                    q.eq(q.field("context"), "direct"),
                    q.neq(q.field("isDeleted"), true)
                )
            )
            .collect();

        const reportIds = directReports.map((r) => r.userId);

        // Get peer review status for each report
        const teamProgress = await Promise.all(
            reportIds.map(async (userId) => {
                const user = await ctx.db.get(userId);

                // Reviews this person needs to complete
                const assignedReviews = await ctx.db
                    .query("peer_review_assignments")
                    .withIndex("by_reviewer", (q) => q.eq("reviewerId", userId))
                    .filter((q) => q.eq(q.field("cycleId"), args.cycleId))
                    .collect();

                // Reviews this person will receive
                const receivingReviews = await ctx.db
                    .query("peer_review_assignments")
                    .withIndex("by_reviewee", (q) => q.eq("revieweeId", userId))
                    .filter((q) => q.eq(q.field("cycleId"), args.cycleId))
                    .collect();

                return {
                    userId,
                    userName: user?.name ?? "Unknown",
                    assignedCount: assignedReviews.length,
                    completedCount: assignedReviews.filter((r) => r.status === "submitted").length,
                    feedbackToReceive: receivingReviews.length,
                    feedbackReceived: receivingReviews.filter((r) => r.status === "submitted").length,
                };
            })
        );

        return teamProgress;
    },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new review cycle
 */
export const createCycle = mutation({
    args: {
        name: v.string(),
        startDate: v.number(),
        endDate: v.number(),
        selfReviewDeadline: v.optional(v.number()),
        managerReviewDeadline: v.optional(v.number()),
        peerReviewDeadline: v.optional(v.number()),
        config: v.optional(v.object({
            includeSelfReview: v.boolean(),
            includePeerReview: v.boolean(),
            includeManagerReview: v.boolean(),
            peerReviewsPerPerson: v.optional(v.number()),
        })),
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        const cycleId = await ctx.db.insert("review_cycles", {
            name: args.name,
            startDate: args.startDate,
            endDate: args.endDate,
            status: "draft",
            selfReviewDeadline: args.selfReviewDeadline,
            managerReviewDeadline: args.managerReviewDeadline,
            peerReviewDeadline: args.peerReviewDeadline,
            config: args.config ?? {
                includeSelfReview: true,
                includePeerReview: true,
                includeManagerReview: true,
                peerReviewsPerPerson: 3,
            },
        });

        await createAuditLog(ctx, {
            userId: admin._id,
            action: "review_cycle.create",
            entityType: "review_cycles",
            entityId: cycleId,
            changes: { after: args },
        });

        return cycleId;
    },
});

/**
 * Update cycle status
 */
export const updateCycleStatus = mutation({
    args: {
        cycleId: v.id("review_cycles"),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        const cycle = await ctx.db.get(args.cycleId);
        if (!cycle) throw new Error("Cycle not found");

        if (!CYCLE_STATUSES.includes(args.status as any)) {
            throw new Error(`Invalid status. Must be: ${CYCLE_STATUSES.join(", ")}`);
        }

        await ctx.db.patch(args.cycleId, { status: args.status });

        await createAuditLog(ctx, {
            userId: admin._id,
            action: "review_cycle.status_change",
            entityType: "review_cycles",
            entityId: args.cycleId,
            changes: { before: { status: cycle.status }, after: { status: args.status } },
        });
    },
});

/**
 * Assign peer reviews (admin assigns who reviews whom)
 */
export const assignPeerReviews = mutation({
    args: {
        cycleId: v.id("review_cycles"),
        assignments: v.array(v.object({
            reviewerId: v.id("users"),
            revieweeId: v.id("users"),
        })),
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        const cycle = await ctx.db.get(args.cycleId);
        if (!cycle) throw new Error("Cycle not found");

        if (cycle.status !== "draft") {
            throw new Error("Can only assign peer reviews during draft phase");
        }

        const created: Id<"peer_review_assignments">[] = [];
        const skipped: { reviewerId: Id<"users">; revieweeId: Id<"users">; reason: string }[] = [];

        for (const assignment of args.assignments) {
            // Prevent self-review in peer assignments
            if (assignment.reviewerId === assignment.revieweeId) {
                skipped.push({
                    ...assignment,
                    reason: "Cannot assign self-review as peer review",
                });
                continue;
            }

            // Check for duplicate
            const existing = await ctx.db
                .query("peer_review_assignments")
                .withIndex("by_cycle", (q) => q.eq("cycleId", args.cycleId))
                .filter((q) =>
                    q.and(
                        q.eq(q.field("reviewerId"), assignment.reviewerId),
                        q.eq(q.field("revieweeId"), assignment.revieweeId)
                    )
                )
                .first();

            if (existing) {
                skipped.push({ ...assignment, reason: "Already assigned" });
                continue;
            }

            const id = await ctx.db.insert("peer_review_assignments", {
                cycleId: args.cycleId,
                reviewerId: assignment.reviewerId,
                revieweeId: assignment.revieweeId,
                isAnonymous: true, // Always anonymous for peer reviews
                status: "pending",
            });
            created.push(id);
        }

        await createAuditLog(ctx, {
            userId: admin._id,
            action: "peer_review.assign",
            entityType: "review_cycles",
            entityId: args.cycleId,
            metadata: { created: created.length, skipped: skipped.length },
        });

        return { created: created.length, skipped };
    },
});

/**
 * Auto-assign peer reviews (random assignment)
 */
export const autoAssignPeerReviews = mutation({
    args: {
        cycleId: v.id("review_cycles"),
        reviewsPerPerson: v.optional(v.number()), // How many reviews each person gives/receives
    },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        const cycle = await ctx.db.get(args.cycleId);
        if (!cycle) throw new Error("Cycle not found");

        if (cycle.status !== "draft") {
            throw new Error("Can only auto-assign during draft phase");
        }

        // Get all active members
        const users = await ctx.db.query("users").collect();
        const activeMembers = users.filter(
            (u) => !u.isDeleted && u.profile?.status === "active" && (u.clearanceLevel ?? 0) >= 2
        );

        if (activeMembers.length < 3) {
            throw new Error("Need at least 3 active members for peer reviews");
        }

        const reviewsPerPerson = args.reviewsPerPerson ?? cycle.config?.peerReviewsPerPerson ?? 3;
        const memberIds = activeMembers.map((m) => m._id);
        const assignments: { reviewerId: Id<"users">; revieweeId: Id<"users"> }[] = [];

        // Simple round-robin assignment (each person reviews next N people in shuffled list)
        const shuffled = [...memberIds].sort(() => Math.random() - 0.5);

        for (let i = 0; i < shuffled.length; i++) {
            const reviewerId = shuffled[i];
            for (let j = 1; j <= reviewsPerPerson; j++) {
                const revieweeIndex = (i + j) % shuffled.length;
                const revieweeId = shuffled[revieweeIndex];
                if (reviewerId !== revieweeId) {
                    assignments.push({ reviewerId, revieweeId });
                }
            }
        }

        // Insert assignments
        let created = 0;
        for (const assignment of assignments) {
            const existing = await ctx.db
                .query("peer_review_assignments")
                .withIndex("by_cycle", (q) => q.eq("cycleId", args.cycleId))
                .filter((q) =>
                    q.and(
                        q.eq(q.field("reviewerId"), assignment.reviewerId),
                        q.eq(q.field("revieweeId"), assignment.revieweeId)
                    )
                )
                .first();

            if (!existing) {
                await ctx.db.insert("peer_review_assignments", {
                    cycleId: args.cycleId,
                    reviewerId: assignment.reviewerId,
                    revieweeId: assignment.revieweeId,
                    isAnonymous: true,
                    status: "pending",
                });
                created++;
            }
        }

        await createAuditLog(ctx, {
            userId: admin._id,
            action: "peer_review.auto_assign",
            entityType: "review_cycles",
            entityId: args.cycleId,
            metadata: { created, totalMembers: activeMembers.length, reviewsPerPerson },
        });

        return { created, totalMembers: activeMembers.length };
    },
});

/**
 * Submit a peer review (anonymous)
 */
export const submitPeerReview = mutation({
    args: {
        assignmentId: v.id("peer_review_assignments"),
        data: v.any(), // Structured review data (ratings, comments)
    },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        const assignment = await ctx.db.get(args.assignmentId);
        if (!assignment) throw new Error("Assignment not found");

        if (assignment.reviewerId !== viewer._id) {
            throw new Error("This review is not assigned to you");
        }

        if (assignment.status === "submitted") {
            throw new Error("Review already submitted");
        }

        const cycle = await ctx.db.get(assignment.cycleId);
        if (!cycle || cycle.status !== "active") {
            throw new Error("Review cycle is not active");
        }

        // Check deadline
        if (cycle.peerReviewDeadline && Date.now() > cycle.peerReviewDeadline) {
            throw new Error("Peer review deadline has passed");
        }

        await ctx.db.patch(args.assignmentId, {
            status: "submitted",
            data: args.data,
            submittedAt: Date.now(),
        });

        // Audit log (note: we log reviewer for audit purposes, but it's not shown to reviewee)
        await createAuditLog(ctx, {
            userId: viewer._id,
            action: "peer_review.submit",
            entityType: "peer_review_assignments",
            entityId: args.assignmentId,
            metadata: { cycleId: assignment.cycleId, revieweeId: assignment.revieweeId },
        });
    },
});

/**
 * Save peer review progress (without submitting)
 */
export const savePeerReviewDraft = mutation({
    args: {
        assignmentId: v.id("peer_review_assignments"),
        data: v.any(),
    },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Unauthorized");

        const assignment = await ctx.db.get(args.assignmentId);
        if (!assignment) throw new Error("Assignment not found");

        if (assignment.reviewerId !== viewer._id) {
            throw new Error("This review is not assigned to you");
        }

        if (assignment.status === "submitted") {
            throw new Error("Cannot edit submitted review");
        }

        await ctx.db.patch(args.assignmentId, {
            status: "in_progress",
            data: args.data,
        });
    },
});

/**
 * Delete a peer review assignment (admin only, before cycle starts)
 */
export const deleteAssignment = mutation({
    args: { assignmentId: v.id("peer_review_assignments") },
    handler: async (ctx, args) => {
        const admin = await ensureAdmin(ctx);

        const assignment = await ctx.db.get(args.assignmentId);
        if (!assignment) throw new Error("Assignment not found");

        const cycle = await ctx.db.get(assignment.cycleId);
        if (!cycle) throw new Error("Cycle not found");

        if (cycle.status !== "draft") {
            throw new Error("Can only delete assignments during draft phase");
        }

        await ctx.db.delete(args.assignmentId);

        await createAuditLog(ctx, {
            userId: admin._id,
            action: "peer_review.delete",
            entityType: "peer_review_assignments",
            entityId: args.assignmentId,
            metadata: { cycleId: assignment.cycleId },
        });
    },
});
