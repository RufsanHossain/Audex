import type {
  AuditInputType,
  AuditStatus,
  DeviceType,
  DimensionId,
  ExportFormat,
  Grade,
  ShareAccess,
  WebhookEvent,
} from "./enums.js";
import type {
  AiSummary,
  AuditMetadata,
  DimensionResult,
  ReportComparison,
  ScoreHistoryEntry,
} from "./models.js";

// ─── Common ─────────────────────────────────────────────────────────────────

/** Standard API success response wrapper */
export interface ApiSuccessResponse<T> {
  readonly success: true;
  readonly data: T;
}

/** Standard API error response */
export interface ApiErrorResponse {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: readonly ApiFieldError[];
  };
}

export interface ApiFieldError {
  readonly field: string;
  readonly message: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Paginated list response */
export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly hasMore: boolean;
}

/** Common pagination query params */
export interface PaginationParams {
  readonly page?: number;
  readonly pageSize?: number;
  readonly sortBy?: string;
  readonly sortOrder?: "asc" | "desc";
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  readonly name: string;
  readonly email: string;
  readonly password: string;
}

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

export interface AuthResponse {
  readonly user: UserSummary;
  readonly accessToken: string;
  readonly expiresAt: string;
}

export interface UserSummary {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly image?: string;
  readonly role: string;
  readonly plan: {
    readonly tier: string;
    readonly currentPeriodEnd?: string;
  };
}

// ─── Audits ─────────────────────────────────────────────────────────────────

export interface CreateAuditRequest {
  readonly url?: string;
  readonly inputType: AuditInputType;
  readonly device?: DeviceType;
  readonly projectId?: string;
  readonly dimensions?: readonly DimensionId[];
}

export interface CreateAuditResponse {
  readonly id: string;
  readonly status: AuditStatus;
  readonly streamUrl: string;
  readonly estimatedDuration: number;
}

export interface AuditListItem {
  readonly id: string;
  readonly inputType: AuditInputType;
  readonly inputValue: string;
  readonly status: AuditStatus;
  readonly device: DeviceType;
  readonly totalScore?: number;
  readonly grade?: Grade;
  readonly projectId?: string;
  readonly projectName?: string;
  readonly reportId?: string;
  readonly duration?: number;
  readonly createdAt: string;
  readonly completedAt?: string;
}

export interface AuditListParams extends PaginationParams {
  readonly status?: AuditStatus;
  readonly projectId?: string;
  readonly inputType?: AuditInputType;
}

export interface AuditDetail extends AuditListItem {
  readonly config: {
    readonly dimensions: readonly DimensionId[];
    readonly device: DeviceType;
  };
  readonly metadata: AuditMetadata;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly retryable: boolean;
  };
}

// ─── Reports ────────────────────────────────────────────────────────────────

export interface ReportSummary {
  readonly id: string;
  readonly auditId: string;
  readonly inputValue: string;
  readonly device: DeviceType;
  readonly totalScore: number;
  readonly grade: Grade;
  readonly totalFindings: number;
  readonly isPartial: boolean;
  readonly duration: number;
  readonly auditedAt: string;
  readonly createdAt: string;
}

export interface ReportDetail {
  readonly id: string;
  readonly auditId: string;
  readonly userId: string;
  readonly projectId?: string;
  readonly inputType: AuditInputType;
  readonly inputValue: string;
  readonly device: DeviceType;
  readonly totalScore: number;
  readonly grade: Grade;
  readonly dimensions: Readonly<Record<DimensionId, DimensionResult>>;
  readonly metadata: AuditMetadata;
  readonly aiSummary?: AiSummary;
  readonly comparison?: ReportComparison;
  readonly sharing: {
    readonly access: ShareAccess;
    readonly shareSlug?: string;
    readonly shareUrl?: string;
  };
  readonly totalFindings: number;
  readonly isPartial: boolean;
  readonly overflowDimensionIds: readonly DimensionId[];
  readonly duration: number;
  readonly auditedAt: string;
  readonly createdAt: string;
}

export interface ReportOverflowParams {
  readonly dimensionId: DimensionId;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface UpdateReportSharingRequest {
  readonly access: ShareAccess;
  readonly password?: string;
  readonly expiresInDays?: number;
}

export interface ExportReportRequest {
  readonly format: ExportFormat;
  readonly dimensions?: readonly DimensionId[];
}

export interface ExportReportResponse {
  readonly exportId: string;
  readonly status: "processing" | "ready";
  readonly downloadUrl?: string;
  readonly expiresAt?: string;
}

// ─── Projects ───────────────────────────────────────────────────────────────

export interface CreateProjectRequest {
  readonly name: string;
  readonly url: string;
  readonly description?: string;
  readonly dimensions?: readonly DimensionId[];
  readonly device?: DeviceType;
}

export interface UpdateProjectRequest {
  readonly name?: string;
  readonly url?: string;
  readonly description?: string;
  readonly dimensions?: readonly DimensionId[];
  readonly device?: DeviceType;
  readonly qualityThreshold?: number;
}

export interface ProjectListItem {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly url: string;
  readonly lastScore?: number;
  readonly lastGrade?: Grade;
  readonly reportCount: number;
  readonly lastAuditedAt?: string;
  readonly createdAt: string;
}

export interface ProjectDetail extends ProjectListItem {
  readonly description?: string;
  readonly settings: {
    readonly dimensions: readonly DimensionId[];
    readonly device: DeviceType;
    readonly qualityThreshold?: number;
  };
  readonly scoreHistory: readonly ScoreHistoryEntry[];
}

// ─── API Keys ───────────────────────────────────────────────────────────────

export interface CreateApiKeyRequest {
  readonly name: string;
  readonly scopes: readonly string[];
  readonly expiresInDays?: number;
}

export interface CreateApiKeyResponse {
  readonly id: string;
  readonly name: string;
  readonly key: string;
  readonly keyPrefix: string;
  readonly scopes: readonly string[];
  readonly expiresAt?: string;
  readonly createdAt: string;
}

export interface ApiKeyListItem {
  readonly id: string;
  readonly name: string;
  readonly keyPrefix: string;
  readonly scopes: readonly string[];
  readonly lastUsedAt?: string;
  readonly expiresAt?: string;
  readonly isActive: boolean;
  readonly createdAt: string;
}

// ─── Webhooks ───────────────────────────────────────────────────────────────

export interface CreateWebhookRequest {
  readonly url: string;
  readonly events: readonly WebhookEvent[];
  readonly projectId?: string;
}

export interface WebhookListItem {
  readonly id: string;
  readonly url: string;
  readonly events: readonly WebhookEvent[];
  readonly isActive: boolean;
  readonly lastDeliveryStatus?: string;
  readonly lastDeliveredAt?: string;
  readonly failureCount: number;
  readonly createdAt: string;
}

// ─── User Settings ──────────────────────────────────────────────────────────

export interface UpdateUserSettingsRequest {
  readonly name?: string;
  readonly defaultDevice?: DeviceType;
  readonly notifications?: {
    readonly auditComplete?: boolean;
    readonly weeklyDigest?: boolean;
    readonly billing?: boolean;
  };
}

// ─── Billing ────────────────────────────────────────────────────────────────

export interface UsageInfo {
  readonly auditsUsed: number;
  readonly auditsLimit: number;
  readonly periodEnd: string;
  readonly percentUsed: number;
}

export interface BillingInfo {
  readonly plan: {
    readonly tier: string;
    readonly status: string;
    readonly currentPeriodEnd: string;
    readonly cancelAtPeriodEnd: boolean;
  };
  readonly usage: UsageInfo;
  readonly portalUrl?: string;
}

export interface CreateCheckoutRequest {
  readonly priceId: string;
  readonly successUrl: string;
  readonly cancelUrl: string;
}

export interface CreateCheckoutResponse {
  readonly checkoutUrl: string;
  readonly sessionId: string;
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export interface DashboardStats {
  readonly totalAudits: number;
  readonly auditsThisMonth: number;
  readonly averageScore: number;
  readonly projectCount: number;
  readonly recentAudits: readonly AuditListItem[];
  readonly usage: UsageInfo;
}
