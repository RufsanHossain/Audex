import { type ImpactMultiplier, DimensionId, FindingSeverity, Grade, PlanTier } from "./enums.js";

// ─── Severity Weights ───────────────────────────────────────────────────────

/** Points deducted per finding at each severity level */
export const SEVERITY_WEIGHTS: Readonly<Record<FindingSeverity, number>> = {
  [FindingSeverity.Info]: 0.0,
  [FindingSeverity.Low]: 1.0,
  [FindingSeverity.Medium]: 2.5,
  [FindingSeverity.High]: 5.0,
  [FindingSeverity.Critical]: 10.0,
} as const;

// ─── Grade Thresholds ───────────────────────────────────────────────────────

export interface GradeInfo {
  readonly grade: Grade;
  readonly label: string;
  readonly color: string;
  readonly minScore: number;
  readonly maxScore: number;
}

export const GRADE_THRESHOLDS: readonly GradeInfo[] = [
  { grade: Grade.A, label: "Excellent", color: "#22C55E", minScore: 90, maxScore: 100 },
  { grade: Grade.B, label: "Good", color: "#3B82F6", minScore: 80, maxScore: 89 },
  { grade: Grade.C, label: "Needs Improvement", color: "#EAB308", minScore: 70, maxScore: 79 },
  { grade: Grade.D, label: "Poor", color: "#F97316", minScore: 60, maxScore: 69 },
  { grade: Grade.F, label: "Critical", color: "#EF4444", minScore: 0, maxScore: 59 },
] as const;

// ─── Dimension Configuration ────────────────────────────────────────────────

export interface DimensionConfig {
  readonly id: DimensionId;
  readonly name: string;
  readonly shortName: string;
  readonly description: string;
  readonly icon: string;
  readonly weight: number;
  readonly category: "core" | "experience" | "technical";
}

/** Dimension weights for composite score calculation (must sum to 1.0) */
export const DIMENSION_WEIGHTS: Readonly<Record<DimensionId, number>> = {
  [DimensionId.Security]: 0.15,
  [DimensionId.Performance]: 0.12,
  [DimensionId.Accessibility]: 0.12,
  [DimensionId.SEO]: 0.1,
  [DimensionId.Speed]: 0.1,
  [DimensionId.BestPractices]: 0.08,
  [DimensionId.UI]: 0.08,
  [DimensionId.UX]: 0.08,
  [DimensionId.Privacy]: 0.07,
  [DimensionId.Network]: 0.05,
  [DimensionId.Memory]: 0.05,
} as const;

export const DIMENSION_CONFIGS: readonly DimensionConfig[] = [
  {
    id: DimensionId.Security,
    name: "Security",
    shortName: "SEC",
    description: "HTTPS, headers, cookies, vulnerabilities, and data protection",
    icon: "shield",
    weight: 0.15,
    category: "core",
  },
  {
    id: DimensionId.Performance,
    name: "Performance",
    shortName: "PERF",
    description: "Core Web Vitals, Lighthouse performance score, and rendering",
    icon: "gauge",
    weight: 0.12,
    category: "core",
  },
  {
    id: DimensionId.Accessibility,
    name: "Accessibility",
    shortName: "A11Y",
    description: "WCAG 2.2 AA compliance, keyboard navigation, and screen readers",
    icon: "accessibility",
    weight: 0.12,
    category: "core",
  },
  {
    id: DimensionId.SEO,
    name: "SEO",
    shortName: "SEO",
    description: "Meta tags, structured data, crawlability, and mobile-friendliness",
    icon: "search",
    weight: 0.1,
    category: "core",
  },
  {
    id: DimensionId.Speed,
    name: "Speed",
    shortName: "SPD",
    description: "Time to first byte, first contentful paint, and time to interactive",
    icon: "zap",
    weight: 0.1,
    category: "technical",
  },
  {
    id: DimensionId.BestPractices,
    name: "Best Practices",
    shortName: "BP",
    description: "Modern standards, console errors, deprecated APIs, and image formats",
    icon: "check-circle",
    weight: 0.08,
    category: "technical",
  },
  {
    id: DimensionId.UI,
    name: "UI Quality",
    shortName: "UI",
    description: "Responsive design, typography, spacing, and visual consistency",
    icon: "layout",
    weight: 0.08,
    category: "experience",
  },
  {
    id: DimensionId.UX,
    name: "UX Quality",
    shortName: "UX",
    description: "Navigation, form usability, error handling, and interaction design",
    icon: "mouse-pointer",
    weight: 0.08,
    category: "experience",
  },
  {
    id: DimensionId.Privacy,
    name: "Privacy",
    shortName: "PRV",
    description: "Cookies, trackers, fingerprinting, and data exposure",
    icon: "eye-off",
    weight: 0.07,
    category: "core",
  },
  {
    id: DimensionId.Network,
    name: "Network",
    shortName: "NET",
    description: "Request count, payload size, caching, compression, and CDN usage",
    icon: "wifi",
    weight: 0.05,
    category: "technical",
  },
  {
    id: DimensionId.Memory,
    name: "Memory",
    shortName: "MEM",
    description: "Heap usage, DOM leaks, detached nodes, and memory timeline",
    icon: "cpu",
    weight: 0.05,
    category: "technical",
  },
] as const;

// ─── Plan Limits ────────────────────────────────────────────────────────────

export interface PlanLimits {
  readonly tier: PlanTier;
  readonly auditsPerMonth: number;
  readonly concurrentAudits: number;
  readonly projectLimit: number;
  readonly apiKeysLimit: number;
  readonly webhooksLimit: number;
  readonly reportRetentionDays: number;
  readonly dimensions: readonly DimensionId[];
  readonly features: {
    readonly pdfExport: boolean;
    readonly jsonExport: boolean;
    readonly csvExport: boolean;
    readonly aiSummary: boolean;
    readonly reportSharing: boolean;
    readonly apiAccess: boolean;
    readonly webhooks: boolean;
    readonly teamManagement: boolean;
    readonly scheduledAudits: boolean;
    readonly historicalComparison: boolean;
    readonly customBranding: boolean;
    readonly sso: boolean;
    readonly prioritySupport: boolean;
  };
  readonly sseConnections: {
    readonly auditStreams: number;
    readonly userEventStreams: number;
    readonly maxTotal: number;
    readonly idleTimeoutSeconds: number;
    readonly maxDurationSeconds: number;
  };
}

export const PLAN_LIMITS: Readonly<Record<PlanTier, PlanLimits>> = {
  [PlanTier.Free]: {
    tier: PlanTier.Free,
    auditsPerMonth: 3,
    concurrentAudits: 1,
    projectLimit: 1,
    apiKeysLimit: 0,
    webhooksLimit: 0,
    reportRetentionDays: 30,
    dimensions: Object.values(DimensionId) as DimensionId[],
    features: {
      pdfExport: false,
      jsonExport: false,
      csvExport: false,
      aiSummary: false,
      reportSharing: false,
      apiAccess: false,
      webhooks: false,
      teamManagement: false,
      scheduledAudits: false,
      historicalComparison: false,
      customBranding: false,
      sso: false,
      prioritySupport: false,
    },
    sseConnections: {
      auditStreams: 1,
      userEventStreams: 2,
      maxTotal: 3,
      idleTimeoutSeconds: 300,
      maxDurationSeconds: 1800,
    },
  },
  [PlanTier.Pro]: {
    tier: PlanTier.Pro,
    auditsPerMonth: Infinity,
    concurrentAudits: 3,
    projectLimit: 20,
    apiKeysLimit: 3,
    webhooksLimit: 0,
    reportRetentionDays: 365,
    dimensions: Object.values(DimensionId) as DimensionId[],
    features: {
      pdfExport: true,
      jsonExport: true,
      csvExport: true,
      aiSummary: true,
      reportSharing: true,
      apiAccess: true,
      webhooks: false,
      teamManagement: false,
      scheduledAudits: true,
      historicalComparison: true,
      customBranding: false,
      sso: false,
      prioritySupport: false,
    },
    sseConnections: {
      auditStreams: 3,
      userEventStreams: 5,
      maxTotal: 8,
      idleTimeoutSeconds: 600,
      maxDurationSeconds: 3600,
    },
  },
  [PlanTier.Team]: {
    tier: PlanTier.Team,
    auditsPerMonth: Infinity,
    concurrentAudits: 5,
    projectLimit: 100,
    apiKeysLimit: 10,
    webhooksLimit: 10,
    reportRetentionDays: Infinity,
    dimensions: Object.values(DimensionId) as DimensionId[],
    features: {
      pdfExport: true,
      jsonExport: true,
      csvExport: true,
      aiSummary: true,
      reportSharing: true,
      apiAccess: true,
      webhooks: true,
      teamManagement: true,
      scheduledAudits: true,
      historicalComparison: true,
      customBranding: false,
      sso: false,
      prioritySupport: true,
    },
    sseConnections: {
      auditStreams: 5,
      userEventStreams: 10,
      maxTotal: 15,
      idleTimeoutSeconds: 900,
      maxDurationSeconds: 7200,
    },
  },
  [PlanTier.Enterprise]: {
    tier: PlanTier.Enterprise,
    auditsPerMonth: Infinity,
    concurrentAudits: 10,
    projectLimit: Infinity,
    apiKeysLimit: 50,
    webhooksLimit: 50,
    reportRetentionDays: Infinity,
    dimensions: Object.values(DimensionId) as DimensionId[],
    features: {
      pdfExport: true,
      jsonExport: true,
      csvExport: true,
      aiSummary: true,
      reportSharing: true,
      apiAccess: true,
      webhooks: true,
      teamManagement: true,
      scheduledAudits: true,
      historicalComparison: true,
      customBranding: true,
      sso: true,
      prioritySupport: true,
    },
    sseConnections: {
      auditStreams: 10,
      userEventStreams: 20,
      maxTotal: 30,
      idleTimeoutSeconds: 1800,
      maxDurationSeconds: 14400,
    },
  },
} as const;

// ─── Instance Scaling ───────────────────────────────────────────────────────

/** Maximum instance scaling factor to prevent single-rule score collapse */
export const MAX_INSTANCE_SCALE_FACTOR = 4.0;

/** Critical finding caps on dimension score */
export const CRITICAL_CAPS: Readonly<Record<number, number>> = {
  1: 75,
  2: 65,
  3: 55,
  4: 45,
  5: 35,
} as const;

/** Critical finding caps on composite score */
export const COMPOSITE_CRITICAL_CAPS = {
  1: 80,
  3: 65,
  5: 50,
} as const;

// ─── Misc Constants ─────────────────────────────────────────────────────────

/** Valid impact multiplier values for rule definitions */
export const VALID_IMPACT_MULTIPLIERS: readonly ImpactMultiplier[] = [0.5, 0.7, 1.0, 1.5] as const;

/** Maximum findings per dimension embedded in a single report document */
export const MAX_FINDINGS_PER_DIMENSION = 50;

/** Maximum report document target size in bytes */
export const MAX_REPORT_TARGET_SIZE_BYTES = 350_000;

/** Default audit timeout in milliseconds */
export const DEFAULT_AUDIT_TIMEOUT_MS = 60_000;

/** Heartbeat interval for SSE in milliseconds */
export const SSE_HEARTBEAT_INTERVAL_MS = 15_000;

/** User events SSE heartbeat interval in milliseconds */
export const SSE_USER_HEARTBEAT_INTERVAL_MS = 30_000;

/** ID prefix for API keys */
export const API_KEY_PREFIX = "audex_sk_";
