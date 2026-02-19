import type { DimensionId, FindingSeverity, ImpactMultiplier } from "./enums.js";
import type { Finding } from "./models.js";

// ─── Detection Method ───────────────────────────────────────────────────────

/** How a rule detects issues */
export type DetectionMethod = "playwright" | "lighthouse" | "axe" | "cdp" | "static" | "hybrid";

// ─── Rule Definition ────────────────────────────────────────────────────────

/** Static definition of an analysis rule */
export interface RuleDefinition {
  readonly id: string;
  readonly dimensionId: DimensionId;
  readonly title: string;
  readonly description: string;
  readonly severity: FindingSeverity;
  readonly impactMultiplier: ImpactMultiplier;
  readonly maxDeduction: number;
  readonly detection: DetectionMethod;
  readonly tool: string;
  readonly passCriteria: string;
  readonly failCriteria: string;
  readonly implementation: string;
  readonly helpUrl: string;
  readonly tags: readonly string[];
  readonly tieredGroup?: string;
}

// ─── Rule Execution Result ──────────────────────────────────────────────────

/** Result of executing a single rule */
export interface RuleResult {
  readonly ruleId: string;
  readonly passed: boolean;
  readonly findings: readonly Finding[];
  readonly executionTimeMs: number;
  readonly error?: string;
}

// ─── Engine Interface ───────────────────────────────────────────────────────

/** Context passed to each analysis engine */
export interface EngineContext {
  readonly auditId: string;
  readonly url: string;
  readonly device: string;

  // Browser context (available for URL audits)
  readonly page?: unknown;
  readonly har?: unknown;
  readonly cookies?: readonly unknown[];
  readonly headers?: Readonly<Record<string, string>>;
  readonly consoleMessages?: readonly unknown[];

  // Network data
  readonly requests?: readonly unknown[];
  readonly responseHeaders?: Readonly<Record<string, string>>;

  // Configuration
  readonly rules: readonly RuleDefinition[];
  readonly timeout: number;

  // Callbacks
  readonly onProgress?: (progress: number, currentRule?: string) => void;
  readonly signal?: AbortSignal;
}

/** Result returned by an analysis engine */
export interface EngineResult {
  readonly dimensionId: DimensionId;
  readonly findings: readonly Finding[];
  readonly passedChecks: readonly string[];
  readonly metrics: Readonly<Record<string, number | string | boolean>>;
  readonly executionTimeMs: number;
  readonly rulesExecuted: number;
  readonly rulesTotal: number;
  readonly error?: string;
}
