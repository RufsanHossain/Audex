import type { DimensionId, FindingSeverity, Grade } from "./enums.js";

// ─── Base SSE Envelope ──────────────────────────────────────────────────────

export interface SSEEnvelope<TEvent extends string = string, TData = unknown> {
  readonly id: string;
  readonly event: TEvent;
  readonly data: TData;
  readonly timestamp: string;
}

// ─── Audit Progress Events ──────────────────────────────────────────────────

// Queue phase
export interface AuditQueuedData {
  readonly auditId: string;
  readonly position: number;
  readonly estimatedWaitSeconds: number;
}

export interface AuditQueuePositionData {
  readonly position: number;
  readonly estimatedWaitSeconds: number;
}

// Processing phase
export interface AuditStartedData {
  readonly auditId: string;
  readonly dimensions: readonly DimensionId[];
  readonly device: string;
}

export interface AuditNavigationData {
  readonly phase: "connecting" | "redirecting" | "loading" | "network-idle";
  readonly url: string;
  readonly statusCode?: number;
  readonly redirectChain?: readonly string[];
}

export interface AuditBaselineData {
  readonly pageTitle: string;
  readonly pageDescription?: string;
  readonly technologies: readonly string[];
  readonly domNodeCount: number;
  readonly documentSizeBytes: number;
  readonly transferSizeBytes: number;
}

// Engine phase
export interface EngineStartedData {
  readonly dimensionId: DimensionId;
  readonly engineName: string;
}

export interface EngineProgressData {
  readonly dimensionId: DimensionId;
  readonly progress: number;
  readonly currentRule?: string;
}

export interface EngineCompleteData {
  readonly dimensionId: DimensionId;
  readonly score: number;
  readonly grade: Grade;
  readonly findingsBySeverity: Readonly<Record<FindingSeverity, number>>;
  readonly topFindings: readonly {
    readonly ruleId: string;
    readonly severity: FindingSeverity;
    readonly title: string;
  }[];
  readonly durationMs: number;
}

export interface EngineErrorData {
  readonly dimensionId: DimensionId;
  readonly error: string;
  readonly errorCode: string;
  readonly retryable: boolean;
}

// Aggregate phase
export interface AuditProgressData {
  readonly overallProgress: number;
  readonly completedEngines: number;
  readonly totalEngines: number;
  readonly runningScore: number;
  readonly runningGrade: Grade;
  readonly activeEngines: readonly DimensionId[];
  readonly elapsedMs: number;
}

// Post-processing phase
export interface AuditScreenshotData {
  readonly desktopUrl?: string;
  readonly mobileUrl?: string;
  readonly thumbnailUrl?: string;
}

export interface AuditAiSummaryData {
  readonly overview: string;
  readonly topIssues: readonly string[];
  readonly actionItems: readonly string[];
}

export interface AuditScoringData {
  readonly totalScore: number;
  readonly grade: Grade;
  readonly dimensions: readonly {
    readonly dimensionId: DimensionId;
    readonly score: number;
    readonly grade: Grade;
  }[];
}

// Terminal events
export interface AuditCompleteData {
  readonly reportId: string;
  readonly totalScore: number;
  readonly grade: Grade;
  readonly isPartial: boolean;
  readonly totalFindings: number;
  readonly findingsBySeverity: Readonly<Record<FindingSeverity, number>>;
  readonly duration: number;
  readonly reportUrl: string;
  readonly comparison?: {
    readonly previousScore: number;
    readonly delta: number;
    readonly newFindings: number;
    readonly fixedFindings: number;
  };
}

export interface AuditFailedData {
  readonly error: string;
  readonly errorCode: string;
  readonly retryable: boolean;
  readonly attempt: number;
  readonly hasPartialReport: boolean;
  readonly partialReportUrl?: string;
}

export interface AuditCancelledData {
  readonly reason: string;
  readonly cancelledBy: "user" | "system";
}

export interface AuditRetryingData {
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly reason: string;
  readonly nextRetryMs: number;
}

export interface HeartbeatData {
  readonly serverTime: string;
}

/** Union of all audit progress event types */
export type AuditProgressEventType =
  | "audit:queued"
  | "audit:queue-position"
  | "audit:started"
  | "audit:navigation"
  | "audit:baseline"
  | "engine:started"
  | "engine:progress"
  | "engine:complete"
  | "engine:error"
  | "audit:progress"
  | "audit:screenshot"
  | "audit:ai-summary"
  | "audit:scoring"
  | "audit:complete"
  | "audit:failed"
  | "audit:cancelled"
  | "audit:retrying"
  | "heartbeat";

/** Type-safe event map: event name → payload type */
export interface AuditProgressEventMap {
  "audit:queued": AuditQueuedData;
  "audit:queue-position": AuditQueuePositionData;
  "audit:started": AuditStartedData;
  "audit:navigation": AuditNavigationData;
  "audit:baseline": AuditBaselineData;
  "engine:started": EngineStartedData;
  "engine:progress": EngineProgressData;
  "engine:complete": EngineCompleteData;
  "engine:error": EngineErrorData;
  "audit:progress": AuditProgressData;
  "audit:screenshot": AuditScreenshotData;
  "audit:ai-summary": AuditAiSummaryData;
  "audit:scoring": AuditScoringData;
  "audit:complete": AuditCompleteData;
  "audit:failed": AuditFailedData;
  "audit:cancelled": AuditCancelledData;
  "audit:retrying": AuditRetryingData;
  heartbeat: HeartbeatData;
}

// ─── User Events (Dashboard SSE) ────────────────────────────────────────────

export interface AuditStatusChangedData {
  readonly auditId: string;
  readonly status: string;
  readonly totalScore?: number;
  readonly grade?: Grade;
  readonly projectId?: string;
  readonly inputValue: string;
}

export interface NotificationNewData {
  readonly notificationId: string;
  readonly type: string;
  readonly title: string;
  readonly message: string;
  readonly actionUrl?: string;
}

export interface UsageUpdatedData {
  readonly auditsUsed: number;
  readonly auditsLimit: number;
  readonly percentUsed: number;
}

export interface UsageWarningData {
  readonly auditsUsed: number;
  readonly auditsLimit: number;
  readonly percentUsed: number;
  readonly threshold: number;
}

export interface UsageExceededData {
  readonly auditsUsed: number;
  readonly auditsLimit: number;
  readonly upgradeUrl: string;
}

export interface SubscriptionUpdatedData {
  readonly tier: string;
  readonly status: string;
  readonly currentPeriodEnd: string;
}

export interface ProjectScoreUpdatedData {
  readonly projectId: string;
  readonly projectName: string;
  readonly previousScore?: number;
  readonly currentScore: number;
  readonly grade: Grade;
}

/** Union of all user event types */
export type UserEventType =
  | "audit:status-changed"
  | "notification:new"
  | "usage:updated"
  | "usage:warning"
  | "usage:exceeded"
  | "subscription:updated"
  | "project:score-updated"
  | "heartbeat";

/** Type-safe event map: event name → payload type */
export interface UserEventMap {
  "audit:status-changed": AuditStatusChangedData;
  "notification:new": NotificationNewData;
  "usage:updated": UsageUpdatedData;
  "usage:warning": UsageWarningData;
  "usage:exceeded": UsageExceededData;
  "subscription:updated": SubscriptionUpdatedData;
  "project:score-updated": ProjectScoreUpdatedData;
  heartbeat: HeartbeatData;
}
