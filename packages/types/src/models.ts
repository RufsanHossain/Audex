import type {
  ApiScope,
  AuditInputType,
  AuditLogAction,
  AuditStatus,
  ComparisonStatus,
  DeviceType,
  DimensionId,
  EngineStatus,
  FindingSeverity,
  Grade,
  ImpactMultiplier,
  NotificationType,
  PlanTier,
  ShareAccess,
  SubscriptionStatus,
  UserRole,
  WebhookDeliveryStatus,
  WebhookEvent,
} from "./enums.js";

// ─── Base ───────────────────────────────────────────────────────────────────

/** All persisted documents have an ID and timestamps */
export interface BaseDocument {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ─── User ───────────────────────────────────────────────────────────────────

export interface UserPlan {
  readonly tier: PlanTier;
  readonly stripeCustomerId?: string;
  readonly stripeSubscriptionId?: string;
  readonly currentPeriodEnd?: Date;
}

export interface UserNotificationSettings {
  readonly auditComplete: boolean;
  readonly weeklyDigest: boolean;
  readonly billing: boolean;
}

export interface UserSettings {
  readonly defaultDevice: DeviceType;
  readonly notifications: UserNotificationSettings;
}

export interface User extends BaseDocument {
  readonly email: string;
  readonly name: string;
  readonly image?: string;
  readonly passwordHash?: string;
  readonly emailVerified?: Date;
  readonly role: UserRole;
  readonly plan: UserPlan;
  readonly auditCount: number;
  readonly auditLimit: number;
  readonly settings: UserSettings;
  readonly isActive: boolean;
  readonly lastLoginAt?: Date;
  readonly teamId?: string;
}

// ─── Audit ──────────────────────────────────────────────────────────────────

export interface AuditConfig {
  readonly dimensions: readonly DimensionId[];
  readonly device: DeviceType;
  readonly timeout?: number;
}

export interface AuditMetadata {
  readonly url?: string;
  readonly statusCode?: number;
  readonly redirectChain?: readonly string[];
  readonly responseTimeMs?: number;
  readonly screenshotUrls?: {
    readonly desktop?: string;
    readonly mobile?: string;
    readonly thumbnail?: string;
  };
  readonly lighthouseVersion?: string;
  readonly userAgent?: string;
  readonly ipAddress?: string;
  readonly pageTitle?: string;
  readonly pageDescription?: string;
}

export interface AuditError {
  readonly code: string;
  readonly message: string;
  readonly dimension?: DimensionId;
  readonly retryable: boolean;
  readonly attempt?: number;
}

export interface Audit extends BaseDocument {
  readonly userId: string;
  readonly projectId?: string;
  readonly inputType: AuditInputType;
  readonly inputValue: string;
  readonly status: AuditStatus;
  readonly config: AuditConfig;
  readonly metadata: AuditMetadata;
  readonly reportId?: string;
  readonly error?: AuditError;
  readonly startedAt?: Date;
  readonly completedAt?: Date;
  readonly duration?: number;
  readonly jobId?: string;
  readonly priority: number;
}

// ─── Finding ────────────────────────────────────────────────────────────────

export interface Finding {
  readonly ruleId: string;
  readonly severity: FindingSeverity;
  readonly impactMultiplier: ImpactMultiplier;
  readonly title: string;
  readonly description: string;
  readonly recommendation: string;
  readonly element?: string;
  readonly codeSnippet?: string;
  readonly helpUrl?: string;
  readonly instanceCount: number;
  readonly deduction: number;
  readonly comparisonStatus?: ComparisonStatus;
  readonly screenshotUrl?: string;
}

// ─── Dimension Result ───────────────────────────────────────────────────────

export interface DimensionResult {
  readonly dimensionId: DimensionId;
  readonly score: number;
  readonly grade: Grade;
  readonly status: EngineStatus;
  readonly findings: readonly Finding[];
  readonly passedChecks: readonly string[];
  readonly findingsBySeverity: Readonly<Record<FindingSeverity, number>>;
  readonly metrics: Readonly<Record<string, number | string | boolean>>;
  readonly summary?: string;
  readonly topPriority?: string;
  readonly executionTimeMs: number;
  readonly rulesExecuted: number;
  readonly rulesTotal: number;
  readonly rulesPassed: number;
  readonly rulesFailed: number;
}

// ─── Report ─────────────────────────────────────────────────────────────────

export interface ScoreDelta {
  readonly previousScore: number;
  readonly currentScore: number;
  readonly delta: number;
  readonly previousGrade: Grade;
  readonly currentGrade: Grade;
}

export interface DimensionDelta {
  readonly dimensionId: DimensionId;
  readonly previousScore: number;
  readonly currentScore: number;
  readonly delta: number;
  readonly newFindings: number;
  readonly fixedFindings: number;
}

export interface ReportComparison {
  readonly previousReportId: string;
  readonly previousAuditedAt: Date;
  readonly overall: ScoreDelta;
  readonly dimensions: readonly DimensionDelta[];
  readonly totalNewFindings: number;
  readonly totalFixedFindings: number;
  readonly totalRecurringFindings: number;
}

export interface ReportSharing {
  readonly shareSlug?: string;
  readonly access: ShareAccess;
  readonly expiresAt?: Date;
  readonly password?: string;
}

export interface AiSummary {
  readonly overview: string;
  readonly topIssues: readonly string[];
  readonly actionItems: readonly string[];
  readonly positives: readonly string[];
  readonly tokenUsage: {
    readonly input: number;
    readonly output: number;
    readonly model: string;
  };
  readonly generatedAt: Date;
}

export interface DeductionEntry {
  readonly ruleId: string;
  readonly ruleName: string;
  readonly severity: FindingSeverity;
  readonly impactMultiplier: ImpactMultiplier;
  readonly instanceCount: number;
  readonly rawDeduction: number;
  readonly scaledDeduction: number;
}

export interface DimensionScoreBreakdown {
  readonly dimensionId: DimensionId;
  readonly baseScore: number;
  readonly totalDeductions: number;
  readonly finalScore: number;
  readonly criticalCap?: number;
  readonly coverageAdjustment?: number;
  readonly deductions: readonly DeductionEntry[];
}

export interface Report extends BaseDocument {
  readonly auditId: string;
  readonly userId: string;
  readonly projectId?: string;
  readonly inputType: AuditInputType;
  readonly inputValue: string;
  readonly device: DeviceType;
  readonly totalScore: number;
  readonly grade: Grade;
  readonly dimensions: Readonly<Record<DimensionId, DimensionResult>>;
  readonly scoreBreakdown: readonly DimensionScoreBreakdown[];
  readonly metadata: AuditMetadata;
  readonly aiSummary?: AiSummary;
  readonly comparison?: ReportComparison;
  readonly sharing: ReportSharing;
  readonly totalFindings: number;
  readonly totalFindingsBySeverity: Readonly<Record<FindingSeverity, number>>;
  readonly isPartial: boolean;
  readonly overflowDimensionIds: readonly DimensionId[];
  readonly auditedAt: Date;
  readonly duration: number;
  readonly expiresAt?: Date;
}

/** Overflow findings stored in a separate collection */
export interface ReportOverflow extends BaseDocument {
  readonly reportId: string;
  readonly dimensionId: DimensionId;
  readonly findings: readonly Finding[];
  readonly totalCount: number;
}

// ─── Project ────────────────────────────────────────────────────────────────

export interface ProjectSchedule {
  readonly enabled: boolean;
  readonly frequency: "daily" | "weekly" | "monthly";
  readonly time: string;
  readonly dayOfWeek?: number;
  readonly dayOfMonth?: number;
}

export interface ProjectSettings {
  readonly dimensions: readonly DimensionId[];
  readonly device: DeviceType;
  readonly schedule?: ProjectSchedule;
  readonly qualityThreshold?: number;
}

export interface ScoreHistoryEntry {
  readonly auditId: string;
  readonly reportId: string;
  readonly score: number;
  readonly grade: Grade;
  readonly auditedAt: Date;
}

export interface Project extends BaseDocument {
  readonly userId: string;
  readonly teamId?: string;
  readonly name: string;
  readonly slug: string;
  readonly url: string;
  readonly description?: string;
  readonly settings: ProjectSettings;
  readonly lastAuditId?: string;
  readonly lastScore?: number;
  readonly lastGrade?: Grade;
  readonly reportCount: number;
  readonly scoreHistory: readonly ScoreHistoryEntry[];
}

// ─── API Key ────────────────────────────────────────────────────────────────

export interface ApiKey extends BaseDocument {
  readonly userId: string;
  readonly name: string;
  readonly keyHash: string;
  readonly keyPrefix: string;
  readonly scopes: readonly ApiScope[];
  readonly rateLimit: number;
  readonly lastUsedAt?: Date;
  readonly expiresAt?: Date;
  readonly isActive: boolean;
}

// ─── Subscription ───────────────────────────────────────────────────────────

export interface AuditUsage {
  readonly used: number;
  readonly limit: number;
  readonly resetDate: Date;
}

export interface Subscription extends BaseDocument {
  readonly userId: string;
  readonly stripeCustomerId: string;
  readonly stripeSubscriptionId: string;
  readonly stripePriceId: string;
  readonly status: SubscriptionStatus;
  readonly currentPeriodStart: Date;
  readonly currentPeriodEnd: Date;
  readonly cancelAtPeriodEnd: boolean;
  readonly auditUsage: AuditUsage;
}

// ─── Webhook ────────────────────────────────────────────────────────────────

export interface WebhookDelivery {
  readonly attemptNumber: number;
  readonly statusCode?: number;
  readonly responseBody?: string;
  readonly error?: string;
  readonly deliveredAt: Date;
  readonly durationMs: number;
}

export interface Webhook extends BaseDocument {
  readonly userId: string;
  readonly projectId?: string;
  readonly url: string;
  readonly secret: string;
  readonly events: readonly WebhookEvent[];
  readonly isActive: boolean;
  readonly lastDeliveryStatus?: WebhookDeliveryStatus;
  readonly lastDeliveredAt?: Date;
  readonly failureCount: number;
}

// ─── Notification ───────────────────────────────────────────────────────────

export interface Notification extends BaseDocument {
  readonly userId: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly data?: Readonly<Record<string, unknown>>;
  readonly readAt?: Date;
  readonly actionUrl?: string;
}

// ─── Audit Log ──────────────────────────────────────────────────────────────

export interface AuditLog {
  readonly id: string;
  readonly userId: string;
  readonly action: AuditLogAction;
  readonly ipAddress: string;
  readonly userAgent: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly timestamp: Date;
}

// ─── Team ───────────────────────────────────────────────────────────────────

export type TeamRole = "owner" | "admin" | "editor" | "viewer";

export interface TeamMember {
  readonly userId: string;
  readonly role: TeamRole;
  readonly joinedAt: Date;
}

export interface TeamInvite {
  readonly email: string;
  readonly role: TeamRole;
  readonly invitedBy: string;
  readonly token: string;
  readonly expiresAt: Date;
}

export interface Team extends BaseDocument {
  readonly name: string;
  readonly slug: string;
  readonly ownerId: string;
  readonly members: readonly TeamMember[];
  readonly invites: readonly TeamInvite[];
  readonly plan: UserPlan;
}
