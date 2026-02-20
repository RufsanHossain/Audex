// ─── @audex/db ──────────────────────────────────────────────────────────────
// Mongoose connection manager and all domain models.
//
// Depends on: @audex/types, @audex/env, mongoose
// Consumed by: apps/web, workers/analysis

// Register global plugins BEFORE any model imports
import "./plugins.js";

// ── Connection ──────────────────────────────────────────────────────────────

export { connectDb, disconnectDb } from "./connection.js";

// ── Embedded Schemas ────────────────────────────────────────────────────────

export { DimensionResultSchema } from "./schemas/dimension-result.schema.js";
export type { IDimensionResultDoc } from "./schemas/dimension-result.schema.js";
export { FindingSchema } from "./schemas/finding.schema.js";
export type { IFindingDoc } from "./schemas/finding.schema.js";

// ── Models ──────────────────────────────────────────────────────────────────

export { ApiKey } from "./models/api-key.model.js";
export type { IApiKeyDoc } from "./models/api-key.model.js";
export { AuditLog } from "./models/audit-log.model.js";
export type { IAuditLogDoc } from "./models/audit-log.model.js";
export { Migration } from "./models/migration.model.js";
export type { IMigrationDoc } from "./models/migration.model.js";
export { Notification } from "./models/notification.model.js";
export type { INotificationDoc } from "./models/notification.model.js";
export { Project } from "./models/project.model.js";
export type { IProjectDoc } from "./models/project.model.js";
export { Report } from "./models/report.model.js";
export type { IReportDoc } from "./models/report.model.js";
export { Subscription } from "./models/subscription.model.js";
export type { ISubscriptionDoc } from "./models/subscription.model.js";
export { User } from "./models/user.model.js";
export type { IUserDoc } from "./models/user.model.js";
export { Webhook } from "./models/webhook.model.js";
export type { IWebhookDoc } from "./models/webhook.model.js";

// ─── Migrations ─────────────────────────────────────────────────────────────
// ─── Migrations ─────────────────────────────────────────────────────────────
export { MigrationRunner, migrations } from "./migrations/index.js";
export type { Migration as MigrationDefinition, MigrationRecord } from "./migrations/types.js";
