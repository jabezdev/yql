import { v } from "convex/values";
import { action } from "./_generated/server";

// Consolidated Email Logic
// This file handles all external email provider interactions (e.g., Resend, SendGrid)

export const sendEmail = action({
    args: {
        to: v.string(),
        subject: v.string(),
        template: v.string(), // e.g. "booking_confirmation"
        payload: v.any(), // Dynamic data for the template
    },
    handler: async (ctx, args) => {
        console.log("------------------------------------------");
        console.log(`[EMAIL DISPATCH] To: ${args.to}`);
        console.log(`[EMAIL DISPATCH] Subject: ${args.subject}`);
        console.log(`[EMAIL DISPATCH] Template: ${args.template}`);
        console.log(`[EMAIL DISPATCH] Payload:`, args.payload);
        console.log("------------------------------------------");

        // TODO: Replace with actual Resend SDK call
        // await resend.emails.send({ ... })

        return { success: true };
    },
});
