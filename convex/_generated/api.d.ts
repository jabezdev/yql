/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accessGate from "../accessGate.js";
import type * as auditLog from "../auditLog.js";
import type * as auth from "../auth.js";
import type * as blocks from "../blocks.js";
import type * as dashboards from "../dashboards.js";
import type * as departments from "../departments.js";
import type * as emails from "../emails.js";
import type * as events from "../events.js";
import type * as files from "../files.js";
import type * as memberLifecycle from "../memberLifecycle.js";
import type * as notifications from "../notifications.js";
import type * as processes from "../processes.js";
import type * as programs from "../programs.js";
import type * as repro from "../repro.js";
import type * as reviews from "../reviews.js";
import type * as roles from "../roles.js";
import type * as seed from "../seed.js";
import type * as stages from "../stages.js";
import type * as users from "../users.js";
import type * as validators_blocks from "../validators/blocks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accessGate: typeof accessGate;
  auditLog: typeof auditLog;
  auth: typeof auth;
  blocks: typeof blocks;
  dashboards: typeof dashboards;
  departments: typeof departments;
  emails: typeof emails;
  events: typeof events;
  files: typeof files;
  memberLifecycle: typeof memberLifecycle;
  notifications: typeof notifications;
  processes: typeof processes;
  programs: typeof programs;
  repro: typeof repro;
  reviews: typeof reviews;
  roles: typeof roles;
  seed: typeof seed;
  stages: typeof stages;
  users: typeof users;
  "validators/blocks": typeof validators_blocks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
