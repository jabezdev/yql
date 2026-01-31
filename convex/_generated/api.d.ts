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
import type * as applications from "../applications.js";
import type * as auth from "../auth.js";
import type * as blocks from "../blocks.js";
import type * as cohorts from "../cohorts.js";
import type * as emails from "../emails.js";
import type * as files from "../files.js";
import type * as interviews from "../interviews.js";
import type * as migrations from "../migrations.js";
import type * as reviews from "../reviews.js";
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
  applications: typeof applications;
  auth: typeof auth;
  blocks: typeof blocks;
  cohorts: typeof cohorts;
  emails: typeof emails;
  files: typeof files;
  interviews: typeof interviews;
  migrations: typeof migrations;
  reviews: typeof reviews;
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
