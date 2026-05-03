import { AuditLogAction } from "@audex/types";

import { createLogger } from "./logger.js";

const log = createLogger({ module: "audit-log" });

// ─── Types ─────────────────────────────────────────────────────────────────

interface AuditLogEntry {
  userId: string;
  action: AuditLogAction;
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Function that persists an audit log entry to the database.
 * Injected at app startup to avoid infra depending on @audex/db.
 */
type PersistFn = (entry: {
  userId: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
}) => Promise<void>;

// ─── Registration ──────────────────────────────────────────────────────────

let persistFn: PersistFn | null = null;

/**
 * Register the database persist function.
 *
 * Call once at app startup from the layer that has access to @audex/db:
 *
 *   import { AuditLog, connectDb } from "@audex/db";
 *   import { registerAuditLogPersist } from "@audex/infra/audit-log";
 *
 *   registerAuditLogPersist(async (entry) => {
 *     await connectDb();
 *     await AuditLog.create(entry);
 *   });
 */
export function registerAuditLogPersist(fn: PersistFn): void {
  persistFn = fn;
}

// ─── Core ──────────────────────────────────────────────────────────────────

/**
 * Write an audit log entry.
 *
 * Fire-and-forget: never blocks the calling request.
 * Failures are logged but don't propagate.
 */
export function writeAuditLog(entry: AuditLogEntry): void {
  if (!persistFn) {
    log.warn({ action: entry.action }, "Audit log persist function not registered");
    return;
  }

  const fn = persistFn;
  void fn({
    userId: entry.userId,
    action: entry.action,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent ?? "",
    metadata: entry.metadata ?? {},
    timestamp: new Date(),
  }).catch((err: unknown) => {
    log.error({ err, action: entry.action, userId: entry.userId }, "Failed to write audit log");
  });
}

// ─── Convenience Helpers ───────────────────────────────────────────────────

interface RequestContext {
  userId: string;
  ipAddress: string;
  userAgent?: string;
}

/** Log an auth action */
export function logAuth(
  ctx: RequestContext,
  action: "login" | "logout" | "failed_login" | "password_reset" | "password_change",
  metadata?: Record<string, unknown>,
): void {
  const actionMap = {
    login: AuditLogAction.AuthLogin,
    logout: AuditLogAction.AuthLogout,
    failed_login: AuditLogAction.AuthFailedLogin,
    password_reset: AuditLogAction.AuthPasswordReset,
    password_change: AuditLogAction.AuthPasswordChange,
  } as const;

  writeAuditLog({ ...ctx, action: actionMap[action], metadata });
}

/** Log an audit-related action */
export function logAuditAction(
  ctx: RequestContext,
  action: "create" | "cancel",
  metadata?: Record<string, unknown>,
): void {
  const actionMap = {
    create: AuditLogAction.AuditCreate,
    cancel: AuditLogAction.AuditCancel,
  } as const;

  writeAuditLog({ ...ctx, action: actionMap[action], metadata });
}

/** Log a report-related action */
export function logReportAction(
  ctx: RequestContext,
  action: "view" | "export" | "share",
  metadata?: Record<string, unknown>,
): void {
  const actionMap = {
    view: AuditLogAction.ReportView,
    export: AuditLogAction.ReportExport,
    share: AuditLogAction.ReportShare,
  } as const;

  writeAuditLog({ ...ctx, action: actionMap[action], metadata });
}

/** Log an API key action */
export function logApiKeyAction(
  ctx: RequestContext,
  action: "create" | "revoke",
  metadata?: Record<string, unknown>,
): void {
  const actionMap = {
    create: AuditLogAction.ApiKeyCreate,
    revoke: AuditLogAction.ApiKeyRevoke,
  } as const;

  writeAuditLog({ ...ctx, action: actionMap[action], metadata });
}

/** Log a webhook action */
export function logWebhookAction(
  ctx: RequestContext,
  action: "create" | "delete",
  metadata?: Record<string, unknown>,
): void {
  const actionMap = {
    create: AuditLogAction.WebhookCreate,
    delete: AuditLogAction.WebhookDelete,
  } as const;

  writeAuditLog({ ...ctx, action: actionMap[action], metadata });
}

/** Log a project action */
export function logProjectAction(
  ctx: RequestContext,
  action: "create" | "update" | "delete",
  metadata?: Record<string, unknown>,
): void {
  const actionMap = {
    create: AuditLogAction.ProjectCreate,
    update: AuditLogAction.ProjectUpdate,
    delete: AuditLogAction.ProjectDelete,
  } as const;

  writeAuditLog({ ...ctx, action: actionMap[action], metadata });
}

/** Log a settings change */
export function logSettingsChange(ctx: RequestContext, metadata?: Record<string, unknown>): void {
  writeAuditLog({ ...ctx, action: AuditLogAction.SettingsUpdate, metadata });
}

/** Log a plan change */
export function logPlanChange(
  ctx: RequestContext,
  action: "upgrade" | "downgrade",
  metadata?: Record<string, unknown>,
): void {
  const actionMap = {
    upgrade: AuditLogAction.PlanUpgrade,
    downgrade: AuditLogAction.PlanDowngrade,
  } as const;

  writeAuditLog({ ...ctx, action: actionMap[action], metadata });
}

/** Log a team action */
export function logTeamAction(
  ctx: RequestContext,
  action: "invite" | "remove",
  metadata?: Record<string, unknown>,
): void {
  const actionMap = {
    invite: AuditLogAction.TeamInvite,
    remove: AuditLogAction.TeamRemove,
  } as const;

  writeAuditLog({ ...ctx, action: actionMap[action], metadata });
}

/** Log an admin action */
export function logAdminAction(ctx: RequestContext, metadata?: Record<string, unknown>): void {
  writeAuditLog({ ...ctx, action: AuditLogAction.AdminAction, metadata });
}
