/**
 * Contract validation for the v1 API.
 *
 * The per-route test files exercise individual handlers; this file checks
 * the cross-cutting contracts that bind all routes together:
 *
 *   1. The OpenAPI spec is structurally valid (paths, security schemes,
 *      reusable error component).
 *   2. Every route file under apps/web/src/app/api/v1/ has a matching
 *      path in the OpenAPI spec — drift detection.
 *   3. ApiError serialises to the documented `{ success, error }` envelope.
 *   4. withHandler returns 401 when auth() resolves to null and includes
 *      X-Request-Id on the response.
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";

import { ApiError } from "@audex/validators";
import { describe, expect, it, vi } from "vitest";

import { buildOpenApiDoc } from "./spec.js";

// ─── Mocks ─────────────────────────────────────────────────────────────────
// Minimal stubs so withHandler can run without touching real infra.

const mockAuthSession = vi.fn<() => Promise<unknown>>();
vi.mock("../../auth", () => ({
  auth: (): Promise<unknown> => mockAuthSession(),
}));

vi.mock("@audex/auth", () => ({
  extractAuth: (session: { user: { id: string; role: string } } | null) =>
    session
      ? { userId: session.user.id, role: session.user.role, email: "x@x", emailVerified: null }
      : null,
}));

vi.mock("@audex/infra", () => ({
  checkApiRateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    remaining: 99,
    resetAt: Date.now() + 60_000,
    limit: 100,
    retryAfterSeconds: 0,
  }),
  rateLimitHeaders: () => ({
    "X-RateLimit-Limit": "100",
    "X-RateLimit-Remaining": "99",
    "X-RateLimit-Reset": String(Math.floor((Date.now() + 60_000) / 1000)),
  }),
  createRequestLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

vi.mock("@audex/env", () => ({
  env: { APP_URL: "http://localhost:3000", NODE_ENV: "test" },
  isDev: false,
  isProd: false,
  isStaging: false,
  isTest: true,
}));

vi.mock("@audex/db", () => ({
  connectDb: vi.fn().mockResolvedValue(undefined),
  User: { findById: vi.fn().mockReturnValue({ lean: () => Promise.resolve(null) }) },
}));

// ─── Spec ──────────────────────────────────────────────────────────────────

interface OpenApiDoc {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, Record<string, unknown>>;
  components?: {
    securitySchemes?: Record<string, unknown>;
    schemas?: Record<string, unknown>;
  };
  tags?: { name: string }[];
}

const doc = buildOpenApiDoc("http://localhost:3000") as OpenApiDoc;

// ─── 1. Spec structural validity ───────────────────────────────────────────

describe("OpenAPI spec is structurally valid", () => {
  it("declares OpenAPI 3.1", () => {
    expect(doc.openapi).toBe("3.1.0");
  });

  it("has both auth schemes (sessionAuth + apiKey)", () => {
    expect(doc.components?.securitySchemes?.["sessionAuth"]).toBeDefined();
    expect(doc.components?.securitySchemes?.["apiKey"]).toBeDefined();
  });

  it("registers a reusable ErrorResponse component", () => {
    expect(doc.components?.schemas?.["ErrorResponse"]).toBeDefined();
  });

  it("groups paths under documented tags", () => {
    const tagNames = (doc.tags ?? []).map((t) => t.name);
    expect(tagNames).toEqual(
      expect.arrayContaining([
        "Audits",
        "Projects",
        "Users",
        "API Keys",
        "Webhooks",
        "Notifications",
        "Reports",
        "Billing",
        "Admin",
      ]),
    );
  });
});

// ─── 2. Spec coverage (drift detection) ────────────────────────────────────

/** Convert an absolute route file path to its API path (with `{id}` style params). */
function routeFileToApiPath(absoluteFile: string): string {
  const normalized = absoluteFile.replace(/\\/g, "/");
  const idx = normalized.indexOf("/app/api/");
  if (idx === -1) throw new Error(`Unexpected route file: ${absoluteFile}`);

  const after = normalized.slice(idx + "/app/".length); // "api/v1/admin/dlq/route.ts"
  const trimmed = after.replace(/\/route\.ts$/, "");
  const segments = trimmed
    .split("/")
    .map((seg) => (seg.startsWith("[") && seg.endsWith("]") ? `{${seg.slice(1, -1)}}` : seg));

  return `/${segments.join("/")}`;
}

function listRouteFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listRouteFiles(full));
    } else if (entry.isFile() && entry.name === "route.ts") {
      out.push(full);
    }
  }
  return out;
}

const V1_ROOT = join(__dirname, "../../app/api/v1");
const routeFiles = listRouteFiles(V1_ROOT);

describe("OpenAPI spec covers every v1 route", () => {
  it("finds at least one route file", () => {
    expect(routeFiles.length).toBeGreaterThan(0);
  });

  it.each(routeFiles.map((f) => [routeFileToApiPath(f), f] as const))(
    "%s is documented",
    (apiPath) => {
      expect(
        Object.keys(doc.paths),
        `${apiPath} is missing from openapi.json (paths: ${Object.keys(doc.paths).length})`,
      ).toContain(apiPath);
    },
  );
});

// ─── 3. ApiError envelope shape matches the spec ───────────────────────────

describe("ApiError serialises to the documented envelope", () => {
  it("unauthorized → { success: false, error: { code, message } }", () => {
    const err = ApiError.unauthorized();
    const body = err.toJSON() as { success: boolean; error: { code: string; message: string } };
    expect(body.success).toBe(false);
    expect(typeof body.error.code).toBe("string");
    expect(typeof body.error.message).toBe("string");
    expect(err.statusCode).toBe(401);
  });

  it("validation error includes details with field arrays", () => {
    const validation = ApiError.badRequest("bad", { name: ["required"] });
    const body = validation.toJSON() as { success: boolean; error: { details?: unknown } };
    expect(body.success).toBe(false);
    expect(body.error.details).toEqual({ name: ["required"] });
  });
});

// ─── 4. withHandler chokepoint — auth + headers ────────────────────────────

describe("withHandler enforces the cross-cutting contract", () => {
  it("returns 401 + standard envelope when auth() resolves to null", async () => {
    mockAuthSession.mockResolvedValue(null);
    const { GET } = await import("../../app/api/v1/users/me/route.js");

    const req = new Request("http://localhost/api/v1/users/me");
    const res = await GET(req as never, { params: Promise.resolve({}) });

    expect(res.status).toBe(401);
    const body = (await res.json()) as { success: boolean; error: { code: string } };
    expect(body.success).toBe(false);
    expect(body.error.code).toBeDefined();
  });

  it("attaches X-Request-Id on every response", async () => {
    mockAuthSession.mockResolvedValue(null);
    const { GET } = await import("../../app/api/v1/users/me/route.js");

    const req = new Request("http://localhost/api/v1/users/me");
    const res = await GET(req as never, { params: Promise.resolve({}) });

    const reqId = res.headers.get("x-request-id");
    expect(reqId).toBeTruthy();
    expect(reqId?.length ?? 0).toBeGreaterThan(0);
  });
});
