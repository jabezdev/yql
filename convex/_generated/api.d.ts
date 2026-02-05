/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as core_accessControl from "../core/accessControl.js";
import type * as core_auditLog from "../core/auditLog.js";
import type * as core_auth from "../core/auth.js";
import type * as core_configuration from "../core/configuration.js";
import type * as core_constants from "../core/constants.js";
import type * as core_departments from "../core/departments.js";
import type * as core_emails from "../core/emails.js";
import type * as core_files from "../core/files.js";
import type * as core_matrix from "../core/matrix.js";
import type * as core_middleware from "../core/middleware.js";
import type * as core_migrations from "../core/migrations.js";
import type * as core_notifications from "../core/notifications.js";
import type * as core_rateLimit from "../core/rateLimit.js";
import type * as core_roles from "../core/roles.js";
import type * as core_settings from "../core/settings.js";
import type * as core_users from "../core/users.js";
import type * as core_verify from "../core/verify.js";
import type * as engine_access from "../engine/access.js";
import type * as engine_accessGate from "../engine/accessGate.js";
import type * as engine_automations from "../engine/automations.js";
import type * as engine_blocks from "../engine/blocks.js";
import type * as engine_events from "../engine/events.js";
import type * as engine_processes from "../engine/processes.js";
import type * as engine_programs from "../engine/programs.js";
import type * as engine_stages from "../engine/stages.js";
import type * as engine_utils from "../engine/utils.js";
import type * as engine_validators_blocks from "../engine/validators/blocks.js";
import type * as engine_validators_schemaGenerator from "../engine/validators/schemaGenerator.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "core/accessControl": typeof core_accessControl;
  "core/auditLog": typeof core_auditLog;
  "core/auth": typeof core_auth;
  "core/configuration": typeof core_configuration;
  "core/constants": typeof core_constants;
  "core/departments": typeof core_departments;
  "core/emails": typeof core_emails;
  "core/files": typeof core_files;
  "core/matrix": typeof core_matrix;
  "core/middleware": typeof core_middleware;
  "core/migrations": typeof core_migrations;
  "core/notifications": typeof core_notifications;
  "core/rateLimit": typeof core_rateLimit;
  "core/roles": typeof core_roles;
  "core/settings": typeof core_settings;
  "core/users": typeof core_users;
  "core/verify": typeof core_verify;
  "engine/access": typeof engine_access;
  "engine/accessGate": typeof engine_accessGate;
  "engine/automations": typeof engine_automations;
  "engine/blocks": typeof engine_blocks;
  "engine/events": typeof engine_events;
  "engine/processes": typeof engine_processes;
  "engine/programs": typeof engine_programs;
  "engine/stages": typeof engine_stages;
  "engine/utils": typeof engine_utils;
  "engine/validators/blocks": typeof engine_validators_blocks;
  "engine/validators/schemaGenerator": typeof engine_validators_schemaGenerator;
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
