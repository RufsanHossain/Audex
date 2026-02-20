// ─── @audex/validators — ApiError Class ─────────────────────────────────────
// Standardized error class used across the entire Audex platform.
// Thrown in API routes, caught by error middleware, serialized to the
// standard error envelope: { success: false, error: { code, message, details } }

import type { ZodError } from "zod";

// ── Error Code → HTTP Status Mapping ────────────────────────────────────────

export const ERROR_CODES = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  AUDIT_LIMIT_EXCEEDED: 429,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

// ── ApiError Class ──────────────────────────────────────────────────────────

export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, string[]>;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      details?: Record<string, string[]>;
      cause?: unknown;
      isOperational?: boolean;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "ApiError";
    this.code = code;
    this.statusCode = ERROR_CODES[code];
    this.details = options?.details;
    // Operational errors are expected (bad input, auth failures).
    // Non-operational errors are bugs (null reference, timeout).
    this.isOperational = options?.isOperational === false ? false : true;

    // Maintain proper stack trace in V8
    Error.captureStackTrace(this, ApiError);
  }

  // ── Factory Methods ─────────────────────────────────────────────────────

  /** 400 — Request body/params failed Zod validation */
  static validation(zodError: ZodError): ApiError {
    const details: Record<string, string[]> = {};

    for (const issue of zodError.issues) {
      const key = issue.path.join(".") || "_root";
      const existing = details[key];
      if (existing) {
        existing.push(issue.message);
      } else {
        details[key] = [issue.message];
      }
    }

    return new ApiError("VALIDATION_ERROR", "Request validation failed", {
      details,
      cause: zodError,
    });
  }

  /** 400 — Generic bad request */
  static badRequest(message: string, details?: Record<string, string[]>): ApiError {
    return new ApiError("VALIDATION_ERROR", message, { details });
  }

  /** 401 — Missing or invalid authentication */
  static unauthorized(message = "Authentication required"): ApiError {
    return new ApiError("UNAUTHORIZED", message);
  }

  /** 403 — Authenticated but lacks permission */
  static forbidden(message = "You do not have permission to perform this action"): ApiError {
    return new ApiError("FORBIDDEN", message);
  }

  /** 404 — Resource not found */
  static notFound(resource = "Resource"): ApiError {
    return new ApiError("NOT_FOUND", `${resource} not found`);
  }

  /** 409 — Conflict (duplicate email, slug, etc.) */
  static conflict(message: string): ApiError {
    return new ApiError("CONFLICT", message);
  }

  /** 429 — Rate limit exceeded */
  static rateLimited(retryAfterSeconds?: number): ApiError {
    const message = retryAfterSeconds
      ? `Rate limit exceeded. Retry after ${retryAfterSeconds} seconds.`
      : "Rate limit exceeded. Please try again later.";
    return new ApiError("RATE_LIMITED", message);
  }

  /** 429 — Plan audit limit exceeded */
  static auditLimitExceeded(limit: number, resetDate: Date): ApiError {
    return new ApiError(
      "AUDIT_LIMIT_EXCEEDED",
      `Monthly audit limit of ${limit} reached. Resets on ${resetDate.toISOString().split("T")[0]}.`,
    );
  }

  /** 413 — Payload too large */
  static payloadTooLarge(maxSizeMb: number): ApiError {
    return new ApiError("PAYLOAD_TOO_LARGE", `Payload exceeds the ${maxSizeMb}MB limit`);
  }

  /** 500 — Unexpected server error (non-operational) */
  static internal(message = "An unexpected error occurred", cause?: unknown): ApiError {
    return new ApiError("INTERNAL_ERROR", message, {
      cause,
      isOperational: false,
    });
  }

  /** 503 — Dependent service unavailable */
  static serviceUnavailable(service: string): ApiError {
    return new ApiError(
      "SERVICE_UNAVAILABLE",
      `The ${service} service is temporarily unavailable. Please try again later.`,
      { isOperational: true },
    );
  }

  // ── Serialization ───────────────────────────────────────────────────────

  /** Serialize to the standard API error envelope */
  toJSON(): {
    success: false;
    error: {
      code: ErrorCode;
      message: string;
      details?: Record<string, string[]>;
    };
  } {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }

  // ── Type Guard ──────────────────────────────────────────────────────────

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}
