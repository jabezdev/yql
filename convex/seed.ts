import { mutation } from "./_generated/server";

export const seedCohort = mutation({
    args: {},
    handler: async (ctx) => {
        // Check if cohort already exists
        const existing = await ctx.db
            .query("cohorts")
            .withIndex("by_slug", (q) => q.eq("slug", "batch-2026"))
            .first();

        if (existing) {
            console.log("Cohort already exists.");
            return existing._id;
        }

        const cohortId = await ctx.db.insert("cohorts", {
            name: "Batch 2026",
            slug: "batch-2026",
            isActive: true,
            startDate: Date.now(),
            pipeline: [
                {
                    id: "form",
                    name: "Application Form",
                    type: "form",
                    description: "Tell us about yourself and why you want to join.",
                    formConfig: [
                        { id: "phone", label: "Phone Number", type: "text", required: true, placeholder: "+63 900 000 0000" },
                        { id: "university", label: "University / Organization", type: "text", required: true },
                        { id: "year", label: "Year Level / Position", type: "text", required: true },
                        { id: "motivation", label: "Why do you want to join YQL?", type: "textarea", required: true },
                        {
                            id: "committee",
                            label: "Preferred Committee",
                            type: "select",
                            required: true,
                            options: ["Secretariat", "Finance", "Programs", "Marketing", "External Relations"]
                        }
                    ]
                },
                {
                    id: "skills",
                    name: "Skills Assessment",
                    type: "static", // Placeholder for now, could be form later
                    description: "Complete the technical assessment sent to your email."
                },
                {
                    id: "interview",
                    name: "Interview",
                    type: "static",
                    description: "Schedule your interview with the team."
                },
                {
                    id: "agreement",
                    name: "Volunteer Agreement",
                    type: "static", // Could be a file upload type later
                    description: "Sign and upload the volunteer agreement."
                },
                {
                    id: "briefing",
                    name: "Briefing",
                    type: "static",
                    description: "Read the onboarding materials."
                },
                {
                    id: "completed",
                    name: "Completed",
                    type: "completed",
                    description: "You have successfully completed the application process!"
                }
            ]
        });

        console.log("Created Cohort:", cohortId);
        return cohortId;
    },
});
