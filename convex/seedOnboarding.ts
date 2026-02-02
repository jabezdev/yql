import { mutation } from "./_generated/server";

export const seed = mutation({
    args: {},
    handler: async (ctx) => {
        // 1. Create Onboarding Program
        const programId = await ctx.db.insert("programs", {
            name: "Volunteer Onboarding 2026",
            slug: "onboarding-2026",
            isActive: true,
            startDate: Date.now(),
            programType: "onboarding",
            description: "Standard onboarding for new volunteers.",
        });

        // 2. Create Blocks

        // Video Block
        const videoBlockId = await ctx.db.insert("block_instances", {
            type: "video",
            config: {
                title: "Welcome to YQL",
                url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                description: "Please watch this introduction video.",
            }
        });

        // Profile Input: Phone
        const phoneBlockId = await ctx.db.insert("block_instances", {
            type: "profile_input",
            config: {
                label: "Mobile Number",
                field: "phone",
                required: true,
            }
        });

        // File Upload: ID
        const uploadBlockId = await ctx.db.insert("block_instances", {
            type: "file_upload",
            config: {
                label: "Upload ID Proof",
                accept: "image/*,application/pdf",
                required: true
            }
        });

        // Signature
        const signBlockId = await ctx.db.insert("block_instances", {
            type: "signature",
            config: {
                label: "Code of Conduct",
                agreementText: "I agree to the Code of Conduct",
                content: "Be nice. Be helpful. Have fun."
            }
        });

        // 3. Create Stages
        const stage1Id = await ctx.db.insert("stages", {
            programId,
            name: "Welcome & Training",
            type: "form",
            blockIds: [videoBlockId],
            config: {}
        });

        const stage2Id = await ctx.db.insert("stages", {
            programId,
            name: "Profile & Documents",
            type: "form",
            blockIds: [phoneBlockId, uploadBlockId, signBlockId],
            config: {}
        });

        // Link stages to program
        await ctx.db.patch(programId, {
            stageIds: [stage1Id, stage2Id] // Ordered
        });

        return programId;
    },
});
