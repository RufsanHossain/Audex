/**
 * Integration tests for /api/v1/reports.
 *
 * Verifies: GET ownership, share gating (Pro+), share slug stability,
 * compare diff classification, public shared visibility rules.
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

function makeObjectId(): string {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

const userId = makeObjectId();
const proSession = {
  user: { id: userId, email: "pro@example.com", name: "Pro", role: "pro", emailVerified: null },
};
const freeSession = {
  user: { id: userId, email: "free@example.com", name: "Free", role: "free", emailVerified: null },
};

// ─── Mocks ─────────────────────────────────────────────────────────────────

const mockAuthSession = vi.fn<() => Promise<unknown>>();
vi.mock("../../../../auth", () => ({
  auth: (): Promise<unknown> => mockAuthSession(),
}));

const mockReportFindById = vi.fn();
const mockReportFindOne = vi.fn();
const mockConnectDb = vi.fn().mockResolvedValue(undefined);

vi.mock("@audex/db", () => ({
  connectDb: mockConnectDb,
  Report: { findById: mockReportFindById, findOne: mockReportFindOne },
}));

vi.mock("@audex/env", () => ({
  env: { APP_URL: "http://localhost:3000", NODE_ENV: "test" },
  isDev: false,
  isProd: false,
  isStaging: false,
  isTest: true,
}));

const mockEnqueueExport = vi.fn().mockResolvedValue("job-export-1");
const mockCheckRateLimit = vi.fn().mockResolvedValue({
  allowed: true,
  remaining: 99,
  resetAt: Date.now() + 60_000,
  limit: 100,
  retryAfterSeconds: 0,
});
vi.mock("@audex/infra", () => ({
  enqueueExport: mockEnqueueExport,
  checkApiRateLimit: mockCheckRateLimit,
  rateLimitHeaders: () => ({}),
  createRequestLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() })),
  }),
  logReportAction: vi.fn(),
}));

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new Request(url, init));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthSession.mockResolvedValue(proSession);
});

// ─── GET /api/v1/reports/:id ───────────────────────────────────────────────

describe("GET /api/v1/reports/:id", () => {
  it("returns 403 when accessing another user's report", async () => {
    const reportId = makeObjectId();
    mockReportFindById.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({
        _id: reportId,
        userId: { toString: () => makeObjectId() },
        status: "completed",
      }),
    });
    const { GET } = await import("./[id]/route.js");
    const req = makeRequest(`http://localhost/api/v1/reports/${reportId}`);
    const res = await GET(req, { params: Promise.resolve({ id: reportId }) });
    expect(res.status).toBe(403);
  });

  it("returns the report when owned", async () => {
    const reportId = makeObjectId();
    mockReportFindById.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({
        _id: reportId,
        userId: { toString: () => userId },
        status: "completed",
        totalScore: 80,
      }),
    });
    const { GET } = await import("./[id]/route.js");
    const req = makeRequest(`http://localhost/api/v1/reports/${reportId}`);
    const res = await GET(req, { params: Promise.resolve({ id: reportId }) });
    expect(res.status).toBe(200);
  });
});

// ─── POST /api/v1/reports/:id/export ───────────────────────────────────────

describe("POST /api/v1/reports/:id/export", () => {
  it("returns 409 when report is not completed", async () => {
    const reportId = makeObjectId();
    mockReportFindById.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({
        _id: reportId,
        userId: { toString: () => userId },
        status: "queued",
      }),
    });
    const { POST } = await import("./[id]/export/route.js");
    const req = makeRequest(`http://localhost/api/v1/reports/${reportId}/export`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ format: "pdf" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: reportId }) });
    expect(res.status).toBe(409);
  });

  it("returns 202 with exportId on success", async () => {
    const reportId = makeObjectId();
    mockReportFindById.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({
        _id: reportId,
        userId: { toString: () => userId },
        status: "completed",
      }),
    });
    const { POST } = await import("./[id]/export/route.js");
    const req = makeRequest(`http://localhost/api/v1/reports/${reportId}/export`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ format: "json" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: reportId }) });
    expect(res.status).toBe(202);
    const body = (await res.json()) as { data: { exportId: string; format: string } };
    expect(body.data.format).toBe("json");
    expect(body.data.exportId).toMatch(/^[0-9a-f-]+$/);
    expect(mockEnqueueExport).toHaveBeenCalled();
  });
});

// ─── POST /api/v1/reports/:id/share ────────────────────────────────────────

describe("POST /api/v1/reports/:id/share", () => {
  it("returns 403 for Free tier (Pro+ required)", async () => {
    mockAuthSession.mockResolvedValue(freeSession);
    const { POST } = await import("./[id]/share/route.js");
    const id = makeObjectId();
    const req = makeRequest(`http://localhost/api/v1/reports/${id}/share`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ access: "public" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id }) });
    expect(res.status).toBe(403);
  });

  it("generates a slug on first share and returns the URL", async () => {
    const reportId = makeObjectId();
    const save = vi.fn().mockResolvedValue(undefined);
    mockReportFindById.mockResolvedValue({
      _id: reportId,
      userId: { toString: () => userId },
      status: "completed",
      shareSlug: undefined,
      shareAccess: undefined,
      sharedAt: undefined,
      save,
    });
    const { POST } = await import("./[id]/share/route.js");
    const req = makeRequest(`http://localhost/api/v1/reports/${reportId}/share`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ access: "unlisted" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: reportId }) });
    expect(res.status).toBe(200);
    expect(save).toHaveBeenCalled();
    const body = (await res.json()) as {
      data: { shareSlug: string; shareAccess: string; url: string };
    };
    expect(body.data.shareSlug).toMatch(/^[A-Za-z0-9_-]{16}$/);
    expect(body.data.shareAccess).toBe("unlisted");
    expect(body.data.url).toContain(body.data.shareSlug);
  });

  it("preserves existing slug across access changes", async () => {
    const reportId = makeObjectId();
    const existingSlug = "AAAABBBBCCCCDDDD";
    mockReportFindById.mockResolvedValue({
      _id: reportId,
      userId: { toString: () => userId },
      status: "completed",
      shareSlug: existingSlug,
      shareAccess: "unlisted",
      sharedAt: new Date(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const { POST } = await import("./[id]/share/route.js");
    const req = makeRequest(`http://localhost/api/v1/reports/${reportId}/share`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ access: "public" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: reportId }) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { shareSlug: string } };
    expect(body.data.shareSlug).toBe(existingSlug);
  });
});

// ─── POST /api/v1/reports/compare ──────────────────────────────────────────

describe("POST /api/v1/reports/compare", () => {
  it("classifies findings into new/fixed/recurring/regressed", async () => {
    const baseId = makeObjectId();
    const compId = makeObjectId();
    const baseReport = {
      _id: baseId,
      userId: { toString: () => userId },
      status: "completed",
      totalScore: 70,
      grade: "C",
      createdAt: new Date("2026-01-01"),
      dimensions: {
        security: {
          score: 80,
          findings: [
            { ruleId: "SEC-1", severity: "medium", title: "Stays" },
            { ruleId: "SEC-2", severity: "low", title: "Disappears" },
            { ruleId: "SEC-3", severity: "low", title: "Worsens" },
          ],
        },
      },
    };
    const compReport = {
      _id: compId,
      userId: { toString: () => userId },
      status: "completed",
      totalScore: 85,
      grade: "B",
      createdAt: new Date("2026-02-01"),
      dimensions: {
        security: {
          score: 82,
          findings: [
            { ruleId: "SEC-1", severity: "medium", title: "Stays" },
            { ruleId: "SEC-3", severity: "high", title: "Worsens" }, // regressed
            { ruleId: "SEC-4", severity: "low", title: "New" },
          ],
        },
      },
    };
    mockReportFindById
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(baseReport) })
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(compReport) });

    const { POST } = await import("./compare/route.js");
    const req = makeRequest("http://localhost/api/v1/reports/compare", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ baseAuditId: baseId, compareAuditId: compId }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: {
        scoreDelta: number;
        dimensions: {
          dimension: string;
          findings: {
            new: { ruleId: string }[];
            fixed: { ruleId: string }[];
            recurring: { ruleId: string }[];
            regressed: { ruleId: string }[];
          };
        }[];
      };
    };
    expect(body.data.scoreDelta).toBe(15);
    const sec = body.data.dimensions.find((d) => d.dimension === "security");
    expect(sec?.findings.new.map((f) => f.ruleId)).toEqual(["SEC-4"]);
    expect(sec?.findings.fixed.map((f) => f.ruleId)).toEqual(["SEC-2"]);
    expect(sec?.findings.recurring.map((f) => f.ruleId)).toEqual(["SEC-1"]);
    expect(sec?.findings.regressed.map((f) => f.ruleId)).toEqual(["SEC-3"]);
  });
});

// ─── GET /api/v1/reports/shared/:slug (public) ─────────────────────────────

describe("GET /api/v1/reports/shared/:slug", () => {
  it("returns 404 when access is private", async () => {
    mockAuthSession.mockResolvedValue(null);
    mockReportFindOne.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({
        _id: makeObjectId(),
        userId: makeObjectId(),
        shareSlug: "AAAABBBBCCCCDDDD",
        shareAccess: "private",
        status: "completed",
        sharedAt: new Date(),
      }),
    });
    const { GET } = await import("./shared/[slug]/route.js");
    const req = makeRequest("http://localhost/api/v1/reports/shared/AAAABBBBCCCCDDDD");
    const res = await GET(req, { params: Promise.resolve({ slug: "AAAABBBBCCCCDDDD" }) });
    expect(res.status).toBe(404);
  });

  it("returns the report when public + completed", async () => {
    mockAuthSession.mockResolvedValue(null);
    mockReportFindOne.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({
        _id: makeObjectId(),
        userId: makeObjectId(),
        totalScore: 80,
        shareSlug: "AAAABBBBCCCCDDDD",
        shareAccess: "public",
        status: "completed",
        sharedAt: new Date(),
      }),
    });
    const { GET } = await import("./shared/[slug]/route.js");
    const req = makeRequest("http://localhost/api/v1/reports/shared/AAAABBBBCCCCDDDD");
    const res = await GET(req, { params: Promise.resolve({ slug: "AAAABBBBCCCCDDDD" }) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { totalScore: number; userId?: string; shareSlug?: string; shareAccess?: string };
    };
    // Internal fields stripped.
    expect(body.data.userId).toBeUndefined();
    expect(body.data.shareSlug).toBeUndefined();
    expect(body.data.shareAccess).toBeUndefined();
    expect(body.data.totalScore).toBe(80);
  });
});
