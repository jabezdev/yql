import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" }); // Load local env if present
dotenv.config(); // Load process env

const convexUrl = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const adminName = process.env.ADMIN_NAME || "System Administrator";

if (!convexUrl) {
    console.error("Error: VITE_CONVEX_URL or CONVEX_URL must be defined.");
    process.exit(1);
}

if (!adminEmail || !adminPassword) {
    console.error("Error: ADMIN_EMAIL and ADMIN_PASSWORD must be defined.");
    process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);

async function seed() {
    console.log(`Attempting to seed admin: ${adminEmail}`);
    try {
        const result = await client.mutation(api.users.seedAdmin, {
            email: adminEmail,
            password: adminPassword,
            name: adminName,
        });
        console.log("Admin user seeded successfully. ID:", result);
    } catch (error) {
        // If the error message indicates admin already exists, we can treat it as success or warning
        if (error.message && error.message.includes("Admin user already exists")) {
            console.log("Admin user already exists. Skipping.");
        } else if (error.message && error.message.includes("Admin already exists with this email")) {
            console.log("Admin user already exists with this email. Skipping.");
        } else {
            console.error("Failed to seed admin:", error);
            process.exit(1);
        }
    }
}

seed();
