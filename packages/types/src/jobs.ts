import type { DeviceType, DimensionId, ExportFormat, NotificationType, PlanTier } from "./enums.js";

// ─── URL Audit Job ──────────────────────────────────────────────────────────

/** Payload for the audit:url queue */
export interface URLAuditJobData {
  readonly auditId: string;
  readonly userId: string;
  readonly url: string;
  readonly device: DeviceType;
  readonly dimensions: readonly DimensionId[];
  readonly projectId?: string;
  readonly planTier: PlanTier;
  readonly timeout: number;
  readonly previousReportId?: string;
}

/** Retry context persisted across attempts */
export interface RetryContext {
  readonly failedEngines: readonly DimensionId[];
  readonly partialResults: Readonly<Record<string, unknown>>;
  readonly lastErrorCode: string;
  readonly lastErrorMessage: string;
}

// ─── Code Audit Job ─────────────────────────────────────────────────────────

/** Payload for the audit:code queue */
export interface CodeAuditJobData {
  readonly auditId: string;
  readonly userId: string;
  readonly fileReference: string;
  readonly dimensions: readonly DimensionId[];
  readonly projectId?: string;
  readonly planTier: PlanTier;
  readonly timeout: number;
  readonly framework?: string;
}

// ─── Notification Job ───────────────────────────────────────────────────────

/** Payload for the notifications queue */
export interface NotificationJobData {
  readonly userId: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly channels: readonly ("in-app" | "email" | "slack" | "webhook")[];
  readonly data?: Readonly<Record<string, unknown>>;
  readonly actionUrl?: string;
}

// ─── Export Job ──────────────────────────────────────────────────────────────

/** Payload for the exports queue */
export interface ExportJobData {
  readonly exportId: string;
  readonly reportId: string;
  readonly userId: string;
  readonly format: ExportFormat;
  readonly dimensions?: readonly DimensionId[];
}

// ─── Scheduled Job ──────────────────────────────────────────────────────────

/** Payload for the scheduled queue */
export interface ScheduledJobData {
  readonly type:
    | "usage-reset"
    | "report-cleanup"
    | "screenshot-cleanup"
    | "analytics-rollup"
    | "stale-connection-cleanup"
    | "scheduled-audit";
  readonly data?: Readonly<Record<string, unknown>>;
}

/** Scheduled audit trigger data */
export interface ScheduledAuditData {
  readonly projectId: string;
  readonly userId: string;
  readonly url: string;
  readonly device: DeviceType;
  readonly dimensions: readonly DimensionId[];
}

// ─── Webhook Delivery Job ───────────────────────────────────────────────────

/** Payload for webhook delivery (dispatched from notifications queue) */
export interface WebhookDeliveryJobData {
  readonly webhookId: string;
  readonly event: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly url: string;
  readonly secret: string;
  readonly attemptNumber: number;
}

// ─── Job Union ──────────────────────────────────────────────────────────────

/** Union of all job data types for type narrowing */
export type AnyJobData =
  | URLAuditJobData
  | CodeAuditJobData
  | NotificationJobData
  | ExportJobData
  | ScheduledJobData
  | WebhookDeliveryJobData;
