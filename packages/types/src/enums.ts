// ─── Dimension Identifiers ──────────────────────────────────────────────────

/** The 11 analysis dimensions that Audex evaluates */
export enum DimensionId {
  Security = "security",
  Performance = "performance",
  Accessibility = "accessibility",
  SEO = "seo",
  Speed = "speed",
  BestPractices = "best-practices",
  UI = "ui",
  UX = "ux",
  Privacy = "privacy",
  Network = "network",
  Memory = "memory",
}

/** All dimension IDs as a readonly tuple for iteration */
export const DIMENSION_IDS = Object.values(DimensionId) as readonly DimensionId[];

// ─── Scoring ────────────────────────────────────────────────────────────────

/** Letter grades derived from numeric scores */
export enum Grade {
  A = "A",
  B = "B",
  C = "C",
  D = "D",
  F = "F",
}

/** Severity levels with ascending numeric weight for score deduction */
export enum FindingSeverity {
  Info = 0,
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4,
}

/** Impact multiplier indicating rule importance within a dimension */
export type ImpactMultiplier = 0.5 | 0.7 | 1.0 | 1.5;

// ─── Audit Lifecycle ────────────────────────────────────────────────────────

/** Audit processing status */
export enum AuditStatus {
  Queued = "queued",
  Processing = "processing",
  Completed = "completed",
  Failed = "failed",
  Cancelled = "cancelled",
}

/** Input type for the audit */
export enum AuditInputType {
  URL = "url",
  Code = "code",
}

/** Device preset for browser emulation */
export enum DeviceType {
  Desktop = "desktop",
  Mobile = "mobile",
}

// ─── Engine Status ──────────────────────────────────────────────────────────

/** Status of an individual analysis engine during processing */
export enum EngineStatus {
  Pending = "pending",
  Running = "running",
  Complete = "complete",
  Error = "error",
  Timeout = "timeout",
  Skipped = "skipped",
}

// ─── User & Auth ────────────────────────────────────────────────────────────

/** User role determines permissions and features */
export enum UserRole {
  Free = "free",
  Pro = "pro",
  Team = "team",
  Enterprise = "enterprise",
  Admin = "admin",
}

/** Plan tier (maps to Stripe products) */
export enum PlanTier {
  Free = "free",
  Pro = "pro",
  Team = "team",
  Enterprise = "enterprise",
}

/** OAuth provider identifiers */
export enum AuthProvider {
  Credentials = "credentials",
  Google = "google",
  GitHub = "github",
}

// ─── Billing ────────────────────────────────────────────────────────────────

/** Stripe subscription status */
export enum SubscriptionStatus {
  Active = "active",
  PastDue = "past_due",
  Canceled = "canceled",
  Trialing = "trialing",
  Incomplete = "incomplete",
  IncompleteExpired = "incomplete_expired",
  Unpaid = "unpaid",
  Paused = "paused",
}

// ─── API Keys ───────────────────────────────────────────────────────────────

/** Available API key permission scopes */
export enum ApiScope {
  AuditCreate = "audit:create",
  AuditRead = "audit:read",
  AuditCancel = "audit:cancel",
  ReportRead = "report:read",
  ReportExport = "report:export",
  ProjectRead = "project:read",
  ProjectWrite = "project:write",
  WebhookManage = "webhook:manage",
}

// ─── Reports ────────────────────────────────────────────────────────────────

/** Export format for report downloads */
export enum ExportFormat {
  PDF = "pdf",
  JSON = "json",
  CSV = "csv",
  HTML = "html",
}

/** Finding comparison status (current vs previous audit) */
export enum ComparisonStatus {
  New = "new",
  Recurring = "recurring",
  Fixed = "fixed",
  Regressed = "regressed",
}

/** Share access level for report sharing */
export enum ShareAccess {
  Public = "public",
  Unlisted = "unlisted",
  Private = "private",
}

// ─── Notifications ──────────────────────────────────────────────────────────

/** Notification types for in-app and email notifications */
export enum NotificationType {
  AuditComplete = "audit:complete",
  AuditFailed = "audit:failed",
  UsageWarning = "usage:warning",
  UsageExceeded = "usage:exceeded",
  SubscriptionUpdated = "subscription:updated",
  TeamInvite = "team:invite",
  WeeklyDigest = "weekly:digest",
  SecurityAlert = "security:alert",
}

// ─── Webhooks ───────────────────────────────────────────────────────────────

/** Webhook event types that can be subscribed to */
export enum WebhookEvent {
  AuditCompleted = "audit.completed",
  AuditFailed = "audit.failed",
  ReportExported = "report.exported",
  ScoreDropped = "score.dropped",
}

/** Webhook delivery status */
export enum WebhookDeliveryStatus {
  Pending = "pending",
  Success = "success",
  Failed = "failed",
  Retrying = "retrying",
}

// ─── Worker / Queue ─────────────────────────────────────────────────────────

/** BullMQ queue names */
export enum QueueName {
  AuditURL = "audit:url",
  AuditCode = "audit:code",
  Notifications = "notifications",
  Exports = "exports",
  Scheduled = "scheduled",
}

/** Job priority levels (lower number = higher priority) */
export enum JobPriority {
  Critical = 1,
  High = 2,
  Normal = 3,
  Low = 4,
  Background = 5,
}

// ─── Audit Log ──────────────────────────────────────────────────────────────

/** Audit log action categories */
export enum AuditLogAction {
  AuthLogin = "auth.login",
  AuthLogout = "auth.logout",
  AuthFailedLogin = "auth.failed_login",
  AuthPasswordReset = "auth.password_reset",
  AuditCreate = "audit.create",
  AuditCancel = "audit.cancel",
  ReportView = "report.view",
  ReportExport = "report.export",
  ReportShare = "report.share",
  ApiKeyCreate = "apikey.create",
  ApiKeyRevoke = "apikey.revoke",
  ProjectCreate = "project.create",
  ProjectUpdate = "project.update",
  ProjectDelete = "project.delete",
  SettingsUpdate = "settings.update",
  PlanUpgrade = "plan.upgrade",
  PlanDowngrade = "plan.downgrade",
  TeamInvite = "team.invite",
  TeamRemove = "team.remove",
  WebhookCreate = "webhook.create",
  WebhookDelete = "webhook.delete",
  AdminAction = "admin.action",
}
