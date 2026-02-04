/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as core_auditLog from "../core/auditLog.js";
import type * as core_auth from "../core/auth.js";
import type * as core_configuration from "../core/configuration.js";
import type * as core_departments from "../core/departments.js";
import type * as core_emails from "../core/emails.js";
import type * as core_files from "../core/files.js";
import type * as core_notifications from "../core/notifications.js";
import type * as core_roles from "../core/roles.js";
import type * as core_settings from "../core/settings.js";
import type * as core_users from "../core/users.js";
import type * as core_verify from "../core/verify.js";
import type * as domains_compliance_compliance from "../domains/compliance/compliance.js";
import type * as domains_compliance_gdpr from "../domains/compliance/gdpr.js";
import type * as domains_compliance_reports from "../domains/compliance/reports.js";
import type * as domains_hr_alumni from "../domains/hr/alumni.js";
import type * as domains_hr_goals from "../domains/hr/goals.js";
import type * as domains_hr_memberLifecycle from "../domains/hr/memberLifecycle.js";
import type * as domains_hr_performanceReviews from "../domains/hr/performanceReviews.js";
import type * as domains_hr_promotions from "../domains/hr/promotions.js";
import type * as domains_hr_reviews from "../domains/hr/reviews.js";
import type * as domains_hr_timesheets from "../domains/hr/timesheets.js";
import type * as domains_ops_dashboards from "../domains/ops/dashboards.js";
import type * as domains_ops_events from "../domains/ops/events.js";
import type * as domains_ops_finance from "../domains/ops/finance.js";
import type * as domains_users_directory from "../domains/users/directory.js";
import type * as domains_users_managers from "../domains/users/managers.js";
import type * as engine_accessGate from "../engine/accessGate.js";
import type * as engine_automations from "../engine/automations.js";
import type * as engine_blocks from "../engine/blocks.js";
import type * as engine_processes from "../engine/processes.js";
import type * as engine_programs from "../engine/programs.js";
import type * as engine_stages from "../engine/stages.js";
import type * as engine_validators_blocks from "../engine/validators/blocks.js";
import type * as lib_authorize from "../lib/authorize.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_processAccess from "../lib/processAccess.js";
import type * as lib_processEngine from "../lib/processEngine.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_validation from "../lib/validation.js";
import type * as seed from "../seed.js";
import type * as seedOnboarding from "../seedOnboarding.js";
import type * as seedShifts from "../seedShifts.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "core/auditLog": typeof core_auditLog;
  "core/auth": typeof core_auth;
  "core/configuration": typeof core_configuration;
  "core/departments": typeof core_departments;
  "core/emails": typeof core_emails;
  "core/files": typeof core_files;
  "core/notifications": typeof core_notifications;
  "core/roles": typeof core_roles;
  "core/settings": typeof core_settings;
  "core/users": typeof core_users;
  "core/verify": typeof core_verify;
  "domains/compliance/compliance": typeof domains_compliance_compliance;
  "domains/compliance/gdpr": typeof domains_compliance_gdpr;
  "domains/compliance/reports": typeof domains_compliance_reports;
  "domains/hr/alumni": typeof domains_hr_alumni;
  "domains/hr/goals": typeof domains_hr_goals;
  "domains/hr/memberLifecycle": typeof domains_hr_memberLifecycle;
  "domains/hr/performanceReviews": typeof domains_hr_performanceReviews;
  "domains/hr/promotions": typeof domains_hr_promotions;
  "domains/hr/reviews": typeof domains_hr_reviews;
  "domains/hr/timesheets": typeof domains_hr_timesheets;
  "domains/ops/dashboards": typeof domains_ops_dashboards;
  "domains/ops/events": typeof domains_ops_events;
  "domains/ops/finance": typeof domains_ops_finance;
  "domains/users/directory": typeof domains_users_directory;
  "domains/users/managers": typeof domains_users_managers;
  "engine/accessGate": typeof engine_accessGate;
  "engine/automations": typeof engine_automations;
  "engine/blocks": typeof engine_blocks;
  "engine/processes": typeof engine_processes;
  "engine/programs": typeof engine_programs;
  "engine/stages": typeof engine_stages;
  "engine/validators/blocks": typeof engine_validators_blocks;
  "lib/authorize": typeof lib_authorize;
  "lib/constants": typeof lib_constants;
  "lib/processAccess": typeof lib_processAccess;
  "lib/processEngine": typeof lib_processEngine;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/validation": typeof lib_validation;
  seed: typeof seed;
  seedOnboarding: typeof seedOnboarding;
  seedShifts: typeof seedShifts;
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
