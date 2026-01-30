import { internalMutation } from "./_generated/server";
import { hashPassword } from "./auth";

/**
 * One-time migration to hash all plaintext passwords.
 * Run this via the dashboard or REPL: `await mutation("migrations:hashPlaintextPasswords")`
 */
export const hashPlaintextPasswords = internalMutation({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        let updatedCount = 0;

        for (const user of users) {
            // Basic check: bcrypt hashes start with $2
            if (!user.password.startsWith("$2")) {
                const hashedPassword = await hashPassword(user.password);
                await ctx.db.patch(user._id, {
                    password: hashedPassword
                });
                updatedCount++;
            }
        }

        return `Migrated ${updatedCount} users to hashed passwords.`;
    }
});
