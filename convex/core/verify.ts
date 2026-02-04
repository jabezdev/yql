
import { mutation } from "../_generated/server";
import { internal } from "../_generated/api";

export const runVerification = mutation({
    args: {},
    handler: async (ctx) => {
        // 1. Setup: Create Department
        const deptId = await ctx.db.insert("departments", {
            name: "Engineering",
            slug: "engineering",
            isActive: true,
            managerIds: []
        });
        console.log("Department created:", deptId);

        // 2. Setup: Create Program
        const programId = await ctx.db.insert("programs", {
            name: "Recruitment 2026",
            slug: "recruitment-2026",
            programType: "recruitment_cycle",
            isActive: true,
            startDate: Date.now(),
            stageIds: [] // We'll add stages next
        });
        console.log("Program created:", programId);

        // 3. Setup: Create Stages
        // Stage 1: Application
        const stage1 = await ctx.db.insert("stages", {
            name: "Application",
            type: "application", // legacy type, optional
            programId: programId,
            config: {},
            blockIds: []
        });
        // Stage 2: Interview
        const stage2 = await ctx.db.insert("stages", {
            name: "Interview",
            type: "interview",
            programId: programId,
            config: {},
            blockIds: []
        });

        // Update Program with stages
        await ctx.db.patch(programId, {
            stageIds: [stage1, stage2]
        });

        // 4. Create Dummy Candidate
        const candidateId = await ctx.db.insert("users", {
            name: "John Doe",
            email: "john@example.com",
            systemRole: "guest"
        });
        console.log("Candidate created:", candidateId);

        // 5. Admin creates Process for Candidate (Simulating "Guest Apply" but as Admin override)
        // We'll call the internal logic directly or assume we are Admin context (this mutation is open but we perform DB ops directly to bypass auth for test)
        // Actually, let's just insert the process directly to simulate it being created
        const processId = await ctx.db.insert("processes", {
            userId: candidateId,
            programId: programId,
            type: "recruitment",
            status: "in_progress",
            currentStageId: stage1,
            updatedAt: Date.now(),
            data: {}
        });
        console.log("Process created:", processId);

        // 6. Simulate Automation: Status Change -> Notify
        // We'll call the internal automation logic directly
        await ctx.scheduler.runAfter(0, internal.engine.automations.evaluate, {
            trigger: "status_change",
            programId: programId,
            processId: processId,
            userId: candidateId,
            data: { status: "rejected", prevStatus: "in_progress" }
        });

        return {
            status: "success",
            deptId,
            programId,
            processId,
            candidateId
        };
    }
});
