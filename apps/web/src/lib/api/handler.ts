import { extractAuth } from "@audex/auth";
import { checkApiRateLimit, createRequestLogger, rateLimitHeaders } from "@audex/infra";
import { ApiError } from "@audex/validators";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { auth } from "../../auth";

import { roleToPlanTier } from "./plan.js";

import type { AuthContext } from "@audex/auth";
import type { Logger } from "@audex/infra";
import type { NextRequest } from "next/server";
import type { ZodSchema } from "zod";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface HandlerContext {
  /** The original Next.js request */
  req: NextRequest;
  /** Request ID from x-request-id header (added by edge proxy) */
  requestId: string;
  /** Pino logger scoped to this request */
  log: Logger;
  /** Authenticated user context (only present if requireAuth: true) */
  auth: AuthContext;
  /** Validated request body (only present if a body schema was given) */
  body: unknown;
  /** Validated query params (only present if a query schema was given) */
  query: unknown;
  /** Route params from Next.js dynamic segments */
  params: Record<string, string>;
}

export interface UnauthenticatedHandlerContext extends Omit<HandlerContext, "auth"> {
  auth: null;
}

interface HandlerOptions<
  TBodySchema extends ZodSchema | undefined,
  TQuerySchema extends ZodSchema | undefined,
> {
  /** Require authentication. Defaults to true. */
  requireAuth?: boolean;
  /** Apply tier-based rate limiting. Defaults to true (when authenticated). */
  rateLimit?: boolean;
  /** Zod schema for the JSON request body */
  body?: TBodySchema;
  /** Zod schema for query parameters */
  query?: TQuerySchema;
}

type InferSchema<T> = T extends ZodSchema<infer U> ? U : undefined;

interface ResolvedContext<TBody, TQuery> {
  req: NextRequest;
  requestId: string;
  log: Logger;
  auth: AuthContext;
  body: TBody;
  query: TQuery;
  params: Record<string, string>;
}

interface ResolvedUnauthContext<TBody, TQuery> extends Omit<
  ResolvedContext<TBody, TQuery>,
  "auth"
> {
  auth: null;
}

// ─── Core Handler ──────────────────────────────────────────────────────────

/**
 * Higher-order function for API route handlers.
 *
 * Composable middleware chain:
 *   1. Extract request ID (from x-request-id header set by edge proxy)
 *   2. Create scoped Pino logger with requestId, method, path
 *   3. (If requireAuth) Extract Auth.js session → AuthContext or 401
 *   4. (If rateLimit) Check tier-based rate limit → 429 with Retry-After
 *   5. (If body schema) Parse + validate JSON body
 *   6. (If query schema) Parse + validate query params
 *   7. Run user handler
 *   8. Catch errors → standardized ApiError JSON response + Sentry
 *
 * Usage:
 *   export const POST = withHandler(
 *     { body: createAuditSchema },
 *     async ({ auth, body, log }) => {
 *       log.info({ url: body.url }, "Creating audit");
 *       return NextResponse.json({ success: true });
 *     },
 *   );
 */
/**
 * Authenticated route wrapper (default — most routes).
 * `auth` is guaranteed non-null inside the handler.
 */
type CoreHandler = (ctx: {
  req: NextRequest;
  requestId: string;
  log: Logger;
  auth: AuthContext | null;
  body: unknown;
  query: unknown;
  params: Record<string, string>;
}) => Promise<Response>;

function buildCore(
  options: HandlerOptions<ZodSchema | undefined, ZodSchema | undefined>,
  handler: CoreHandler,
): (req: NextRequest, route: { params: Promise<Record<string, string>> }) => Promise<Response> {
  const { requireAuth = true, rateLimit = true, body: bodySchema, query: querySchema } = options;

  return async (req, route) => {
    // 1. Request ID
    const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
    const url = new URL(req.url);

    // 2. Logger
    const log = createRequestLogger({
      requestId,
      method: req.method,
      path: url.pathname,
    });

    try {
      // 3. Auth
      let authCtx: AuthContext | null = null;
      if (requireAuth) {
        const session = await auth();
        authCtx = extractAuth(session);
        if (!authCtx) {
          throw ApiError.unauthorized();
        }
      }

      // 4. Rate limit (only when authenticated)
      let rlHeaders: Record<string, string> = {};
      if (rateLimit && authCtx) {
        const tier = roleToPlanTier(authCtx.role);
        const rl = await checkApiRateLimit(authCtx.userId, tier);
        rlHeaders = rateLimitHeaders(rl);
        if (!rl.allowed) {
          throw ApiError.rateLimited(rl.retryAfterSeconds);
        }
      }

      // 5. Body validation
      let parsedBody: unknown = undefined;
      if (bodySchema) {
        let raw: unknown;
        try {
          raw = await req.json();
        } catch {
          throw ApiError.badRequest("Invalid JSON body");
        }
        const result = bodySchema.safeParse(raw);
        if (!result.success) throw ApiError.validation(result.error);
        parsedBody = result.data;
      }

      // 6. Query validation
      let parsedQuery: unknown = undefined;
      if (querySchema) {
        const queryObj = Object.fromEntries(url.searchParams.entries());
        const result = querySchema.safeParse(queryObj);
        if (!result.success) throw ApiError.validation(result.error);
        parsedQuery = result.data;
      }

      // 7. Resolve dynamic route params
      const params = await route.params;

      // 8. Run handler
      const response = await handler({
        req,
        requestId,
        log,
        auth: authCtx,
        body: parsedBody,
        query: parsedQuery,
        params,
      });

      // Attach standard headers
      response.headers.set("x-request-id", requestId);
      for (const [k, v] of Object.entries(rlHeaders)) {
        response.headers.set(k, v);
      }

      return response;
    } catch (err) {
      return handleError(err, requestId, log);
    }
  };
}

// ─── withHandler — Authenticated Wrapper ───────────────────────────────────

/**
 * Authenticated route wrapper (default — most routes).
 * `auth` is guaranteed non-null inside the handler.
 */
export function withHandler<
  TBodySchema extends ZodSchema | undefined = undefined,
  TQuerySchema extends ZodSchema | undefined = undefined,
>(
  options: Omit<HandlerOptions<TBodySchema, TQuerySchema>, "requireAuth">,
  handler: (
    ctx: ResolvedContext<InferSchema<TBodySchema>, InferSchema<TQuerySchema>>,
  ) => Promise<Response>,
): (req: NextRequest, route: { params: Promise<Record<string, string>> }) => Promise<Response> {
  return buildCore({ ...options, requireAuth: true }, (ctx) =>
    handler(ctx as ResolvedContext<InferSchema<TBodySchema>, InferSchema<TQuerySchema>>),
  );
}

// ─── withPublicHandler — Unauthenticated Wrapper ───────────────────────────

/**
 * Public route wrapper (no auth required, no rate limit by default).
 * Use for landing pages, public reports, health checks.
 */
export function withPublicHandler<
  TBodySchema extends ZodSchema | undefined = undefined,
  TQuerySchema extends ZodSchema | undefined = undefined,
>(
  options: Omit<HandlerOptions<TBodySchema, TQuerySchema>, "requireAuth" | "rateLimit">,
  handler: (
    ctx: ResolvedUnauthContext<InferSchema<TBodySchema>, InferSchema<TQuerySchema>>,
  ) => Promise<Response>,
): (req: NextRequest, route: { params: Promise<Record<string, string>> }) => Promise<Response> {
  return buildCore({ ...options, requireAuth: false, rateLimit: false }, (ctx) =>
    handler(ctx as ResolvedUnauthContext<InferSchema<TBodySchema>, InferSchema<TQuerySchema>>),
  );
}

// ─── Error Handler ─────────────────────────────────────────────────────────

function reportToSentry(err: unknown, requestId: string, extra?: Record<string, unknown>): void {
  Sentry.withScope((scope) => {
    scope.setTag("request_id", requestId);
    if (extra) scope.setContext("api", extra);
    Sentry.captureException(err);
  });
}

function handleError(err: unknown, requestId: string, log: Logger): NextResponse {
  // Known: ApiError → standardized response
  if (ApiError.isApiError(err)) {
    if (err.isOperational) {
      log.info({ code: err.code, status: err.statusCode }, err.message);
    } else {
      log.error({ err, code: err.code }, err.message);
      reportToSentry(err, requestId, { code: err.code, status: err.statusCode });
    }
    const res = NextResponse.json(err.toJSON(), { status: err.statusCode });
    res.headers.set("x-request-id", requestId);
    return res;
  }

  // Known: Zod error escaped (shouldn't normally happen — withHandler catches them)
  if (err instanceof ZodError) {
    const apiErr = ApiError.validation(err);
    log.info({ code: apiErr.code }, apiErr.message);
    const res = NextResponse.json(apiErr.toJSON(), { status: apiErr.statusCode });
    res.headers.set("x-request-id", requestId);
    return res;
  }

  // Unknown: log + generic 500
  log.error({ err }, "Unhandled error in API route");
  reportToSentry(err, requestId, { kind: "unhandled" });
  const internal = ApiError.internal();
  const res = NextResponse.json(internal.toJSON(), { status: internal.statusCode });
  res.headers.set("x-request-id", requestId);
  return res;
}

// ─── Convenience: JSON Response Helper ─────────────────────────────────────

/**
 * Helper for returning a successful JSON response with standard envelope.
 *
 * Usage: return jsonOk({ user: { ... } });
 */
export function jsonOk(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json({ success: true, data }, init);
}

/**
 * Helper for returning a 202 Accepted response (async work queued).
 */
export function jsonAccepted(data: unknown): NextResponse {
  return NextResponse.json({ success: true, data }, { status: 202 });
}

/**
 * Helper for returning a 201 Created response.
 */
export function jsonCreated(data: unknown): NextResponse {
  return NextResponse.json({ success: true, data }, { status: 201 });
}
