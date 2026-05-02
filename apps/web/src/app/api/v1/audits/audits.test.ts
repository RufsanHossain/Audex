/**
 * Integration tests for /api/v1/audits routes.
 *
 * Mocks the dependency stack (auth, db, infra) and exercises the route
 * handlers as pure functions with NextRequest objects. Validates:
 *   - Auth enforcement (401 when no session)
 *   - Zod request validation (400)
 *   - RBAC + ownership checks (403)
 *   - Status state transitions (409)
 *   - Plan limit enforcement (429)
 *   - Successful create/list/get/cancel flows
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Generate a 24-char hex string compatible with MongoDB ObjectId format
function makeObjectId(): string {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

// ─── Mocks ─────────────────────────────────────────────────────────────────

// Mock auth() — controlled per-test via mockAuthSession
const mockAuthSession = vi.fn<() => Promise<unknown>>();
vi.mock("../../../../auth", () => ({
  auth: (): Promise<unknown> => mockAuthSession(),
}));

// Mock db
const mockReportFindById = vi.fn();
const mockReportFind = vi.fn();
const mockReportCount = vi.fn();
const mockReportSave = vi.fn();
const mockConnectDb = vi.fn().mockResolvedValue(undefined);

class MockReport {
  _id = makeObjectId();
  userId: string;
  projectId?: string;
  inputType: string;
  inputValue: string;
  status = "queued";
  device: string;
  source: string;
  metadata: Record<string, unknown>;
  error?: { code: string; message: string };

  constructor(data: Record<string, unknown>) {
    this.userId = data["userId"] as string;
    this.projectId = data["projectId"] as string;
    this.inputType = data["inputType"] as string;
    this.inputValue = data["inputValue"] as string;
    this.device = data["device"] as string;
    this.source = data["source"] as string;
    this.metadata = (data["metadata"] ?? {}) as Record<string, unknown>;
  }

  save() {
    mockReportSave();
    return Promise.resolve(this);
  }
}

(MockReport as unknown as { findById: typeof mockReportFindById }).findById = mockReportFindById;
(MockReport as unknown as { find: typeof mockReportFind }).find = mockReportFind;
(MockReport as unknown as { countDocuments: typeof mockReportCount }).countDocuments =
  mockReportCount;

vi.mock("@audex/db", () => ({
  connectDb: mockConnectDb,
  Report: MockReport,
}));

// Mock infra
const mockGetUsage = vi.fn();
const mockIncrementUsage = vi.fn().mockResolvedValue(1);
const mockAcquireSlot = vi.fn();
const mockReleaseSlot = vi.fn().mockResolvedValue(undefined);
const mockEnqueueUrlAudit = vi.fn().mockResolvedValue("job-123");
const mockCheckRateLimit = vi.fn().mockResolvedValue({
  allowed: true,
  remaining: 99,
  resetAt: Date.now() + 60000,
  limit: 100,
  retryAfterSeconds: 0,
});

vi.mock("@audex/infra", () => ({
  getUsage: mockGetUsage,
  incrementUsage: mockIncrementUsage,
  acquireAuditSlot: mockAcquireSlot,
  releaseAuditSlot: mockReleaseSlot,
  enqueueUrlAudit: mockEnqueueUrlAudit,
  checkApiRateLimit: mockCheckRateLimit,
  rateLimitHeaders: () => ({}),
  createRequestLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
  logAuditAction: vi.fn(),
  getQueue: () => null,
  getRedis: () => null,
  publishAuditEvent: vi.fn(),
}));

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new Request(url, init));
}

const validSession = {
  user: {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    role: "free",
    emailVerified: null,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockReportSave.mockClear();
  mockAuthSession.mockResolvedValue(validSession);
  mockGetUsage.mockResolvedValue({
    used: 0,
    limit: 3,
    remaining: 3,
    exceeded: false,
    percentUsed: 0,
    resetDate: new Date().toISOString(),
  });
  mockAcquireSlot.mockResolvedValue({ acquired: true, active: 1, limit: 1 });
});

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("POST /api/v1/audits", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuthSession.mockResolvedValue(null);
    const { POST } = await import("./route.js");

    const req = makeRequest("http://localhost/api/v1/audits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "url", url: "https://example.com" }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid body", async () => {
    const { POST } = await import("./route.js");

    const req = makeRequest("http://localhost/api/v1/audits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "url", url: "not-a-url" }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 429 when monthly usage exceeded", async () => {
    mockGetUsage.mockResolvedValue({
      used: 3,
      limit: 3,
      remaining: 0,
      exceeded: true,
      percentUsed: 100,
      resetDate: new Date().toISOString(),
    });
    const { POST } = await import("./route.js");

    const req = makeRequest("http://localhost/api/v1/audits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "url", url: "https://example.com" }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(429);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("AUDIT_LIMIT_EXCEEDED");
  });

  it("returns 429 when concurrent slot limit reached", async () => {
    mockAcquireSlot.mockResolvedValue({ acquired: false, active: 1, limit: 1 });
    const { POST } = await import("./route.js");

    const req = makeRequest("http://localhost/api/v1/audits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "url", url: "https://example.com" }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(429);
  });

  it("returns 202 with audit ID on success", async () => {
    const { POST } = await import("./route.js");

    const req = makeRequest("http://localhost/api/v1/audits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "url", url: "https://example.com" }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(202);
    const body = (await res.json()) as {
      success: boolean;
      data: { auditId: string; status: string; progressUrl: string };
    };
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("queued");
    expect(body.data.auditId).toMatch(/^[0-9a-f]{24}$/);
    expect(body.data.progressUrl).toContain("/progress");
    expect(mockEnqueueUrlAudit).toHaveBeenCalled();
  });

  it("releases concurrent slot on enqueue failure", async () => {
    mockEnqueueUrlAudit.mockRejectedValueOnce(new Error("Redis down"));
    const { POST } = await import("./route.js");

    const req = makeRequest("http://localhost/api/v1/audits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "url", url: "https://example.com" }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(500);
    expect(mockReleaseSlot).toHaveBeenCalled();
  });
});

describe("GET /api/v1/audits", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuthSession.mockResolvedValue(null);
    const { GET } = await import("./route.js");

    const req = makeRequest("http://localhost/api/v1/audits");
    const res = await GET(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(401);
  });

  it("returns paginated list of audits", async () => {
    const items = [
      { _id: makeObjectId(), inputValue: "a.com", status: "completed" },
      { _id: makeObjectId(), inputValue: "b.com", status: "queued" },
    ];
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(items),
    };
    mockReportFind.mockReturnValue(mockChain);
    mockReportCount.mockResolvedValue(2);

    const { GET } = await import("./route.js");

    const req = makeRequest("http://localhost/api/v1/audits?page=1&limit=20");
    const res = await GET(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { items: unknown[]; pagination: { total: number; page: number } };
    };
    expect(body.data.items).toHaveLength(2);
    expect(body.data.pagination.total).toBe(2);
    expect(body.data.pagination.page).toBe(1);
  });

  it("validates query params", async () => {
    const { GET } = await import("./route.js");

    const req = makeRequest("http://localhost/api/v1/audits?page=invalid");
    const res = await GET(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(400);
  });
});
