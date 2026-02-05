
import { mutation } from "../_generated/server";
import { requireRateLimit } from "./rateLimit";
import type { MutationCtx } from "../_generated/server";
import { checkAccess, type AccessCheckOptions } from "./accessControl";
import type { SystemRole } from "./constants";

type MutationHandler<Args, Output> = (ctx: MutationCtx, args: Args) => Promise<Output>;

interface SecuredMutationOptions {
    rateLimit?: {
        action: string;
        limit?: number;
    };
    role?: string[];         // Exact role match (any of)
    minimumRole?: SystemRole; // Hierarchy-based (>= this level)
    requireActive?: boolean;  // Require HR_STATUS = active
}

/**
 * Higher-order helper for mutations requiring rate limiting and auth.
 * Uses centralized accessControl for role checks.
 */
export function mutationWithAuth<Args extends Record<string, any>, Output>(config: {
    args: any,
    options?: SecuredMutationOptions,
    handler: MutationHandler<Args, Output>
}) {
    return mutation({
        args: config.args,
        handler: async (ctx, args: any) => {
            // Build access check options
            const accessOptions: AccessCheckOptions = {};

            if (config.options?.minimumRole) {
                accessOptions.minimumRole = config.options.minimumRole;
            }

            if (config.options?.role) {
                accessOptions.allowedRoles = config.options.role as SystemRole[];
            }

            if (config.options?.requireActive) {
                accessOptions.requireActive = true;
            }

            // Check access (includes auth and HR_STATUS blocking)
            const result = await checkAccess(ctx, accessOptions);

            if (!result.allowed) {
                throw new Error(`Unauthorized: ${result.reason}`);
            }

            const user = result.user!;

            // Rate Limit
            if (config.options?.rateLimit) {
                await requireRateLimit(ctx, user._id, config.options.rateLimit.action);
            }

            // Execute handler
            return await config.handler(ctx, args);
        }
    });
}
