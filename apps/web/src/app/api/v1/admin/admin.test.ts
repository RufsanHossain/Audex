/**
 * Integration tests for /api/v1/admin/*.
 *
 * Verifies the requireAdmin gate (non-admin → 403) and the safety rails:
 *   - role change refuses to demote the last admin
 *   - disable refuses self-disable
 *   - DLQ requeue rejects non-failed jobs
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

function makeObjectId(): string {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

const adminId = makeObjectId();
const targetId = makeObjectId();
const adminSession = {
  user: { id: adminId, email: "admin@x", name: "Admin", role: "admin", emailVerified: null },
};
const userSession = {
  user: { id: adminId, email: "user@x", name: "User", role: "free", emailVerified: null },
};

// ─── Mocks ─────────────────────────────────────────────────────────────────

const mockAuthSession = vi.fn<() => Promise<unknown>>();
vi.mock("../../../../auth", () => ({
  auth: (): Promise<unknown> => mockAuthSession(),
}));

const mockUserFind = vi.fn();
const mockUserCount = vi.fn();
const mockUserFindById = vi.fn();
const mockReportCount = vi.fn().mockResolvedValue(0);
const mockReportFindOne = vi.fn();
const mockSubFindOne = vi.fn();
const mockProjectCount = vi.fn().mockResolvedValue(0);
const mockApiKeyCount = vi.fn().mockResolvedValue(0);
const mockNotifCount = vi.fn().mockResolvedValue(0);
const mockAuditLogCount = vi.fn().mockResolvedValue(0);
const mockConnectDb = vi.fn().mockResolvedValue(undefined);

const mockPingDb = vi.fn().mockResolvedValue(2);
vi.mock("@audex/db", () => ({
  connectDb: mockConnectDb,
  pingDb: mockPingDb,
  User: { find: mockUserFind, countDocuments: mockUserCount, findById: mockUserFindById },
  Report: { countDocuments: mockReportCount, findOne: mockReportFindOne },
  Subscription: { findOne: mockSubFindOne },
  Project: { countDocuments: mockProjectCount },
  ApiKey: { countDocuments: mockApiKeyCount },
  Notification: { countDocuments: mockNotifCount },
  AuditLog: { countDocuments: mockAuditLogCount },
}));

const mockRevokeAllSessions = vi.fn().mockResolvedValue(undefined);
const mockRequireRole = vi.fn();
vi.mock("@audex/auth", () => ({
  revokeAllUserSessions: mockRevokeAllSessions,
  requireRole: mockRequireRole,
  extractAuth: (session: { user: { id: string; role: string } } | null) =>
    session
      ? { userId: session.user.id, role: session.user.role, email: "x@x", emailVerified: null }
      : null,
}));

vi.mock("@audex/env", () => ({
  env: { APP_URL: "http://localhost:3000", NODE_ENV: "test" },
  isDev: false,
  isProd: false,
  isStaging: false,
  isTest: true,
}));

const mockGetQueue = vi.fn();
const mockGetQueueHealth = vi.fn().mockResolvedValue([]);
const mockGetTotalQueueDepth = vi.fn().mockResolvedValue(0);
const mockPingRedis = vi.fn().mockResolvedValue(1);
const mockCheckRateLimit = vi.fn().mockResolvedValue({
  allowed: true,
  remaining: 99,
  resetAt: Date.now() + 60_000,
  limit: 100,
  retryAfterSeconds: 0,
});
vi.mock("@audex/infra", () => ({
  getQueue: mockGetQueue,
  getQueueHealth: mockGetQueueHealth,
  getTotalQueueDepth: mockGetTotalQueueDepth,
  pingRedis: mockPingRedis,
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
  logAdminAction: vi.fn(),
}));

vi.mock("mongoose", () => ({
  Types: {
    ObjectId: class {
      readonly value: string;
      constructor(v: string) {
        this.value = v;
      }
      toString(): string {
        return this.value;
      }
    },
  },
}));

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new Request(url, init));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthSession.mockResolvedValue(adminSession);
  mockRequireRole.mockImplementation((auth: { role?: string } | null) =>
    auth?.role === "admin"
      ? null
      : { code: "FORBIDDEN", message: `Role '${auth?.role ?? "?"}' is not admin`, status: 403 },
  );
});

// ─── Admin gate ────────────────────────────────────────────────────────────

describe("requireAdmin gate", () => {
  it("blocks non-admin from listing users", async () => {
    mockAuthSession.mockResolvedValue(userSession);
    const { GET } = await import("./users/route.js");
    const req = makeRequest("http://localhost/api/v1/admin/users");
    const res = await GET(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(403);
  });

  it("blocks non-admin from system stats", async () => {
    mockAuthSession.mockResolvedValue(userSession);
    const { GET } = await import("./system/stats/route.js");
    const req = makeRequest("http://localhost/api/v1/admin/system/stats");
    const res = await GET(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(403);
  });
});

// ─── Users ──────────────────────────────────────────────────────────────────

describe("PATCH /api/v1/admin/users/:id/role", () => {
  it("refuses to demote the last remaining admin (409)", async () => {
    const lastAdmin = {
      _id: targetId,
      role: "admin",
      save: vi.fn().mockResolvedValue(undefined),
    };
    mockUserFindById.mockResolvedValue(lastAdmin);
    mockUserCount.mockResolvedValue(1); // only 1 admin total

    const { PATCH } = await import("./users/[id]/role/route.js");
    const req = makeRequest(`http://localhost/api/v1/admin/users/${targetId}/role`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "free" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: targetId }) });
    expect(res.status).toBe(409);
    expect(lastAdmin.save).not.toHaveBeenCalled();
  });

  it("allows demotion when other admins exist", async () => {
    const target = {
      _id: targetId,
      role: "admin",
      save: vi.fn().mockResolvedValue(undefined),
    };
    mockUserFindById.mockResolvedValue(target);
    mockUserCount.mockResolvedValue(3);

    const { PATCH } = await import("./users/[id]/role/route.js");
    const req = makeRequest(`http://localhost/api/v1/admin/users/${targetId}/role`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "free" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: targetId }) });
    expect(res.status).toBe(200);
    expect(target.role).toBe("free");
    expect(target.save).toHaveBeenCalled();
  });
});

describe("PATCH /api/v1/admin/users/:id/disable", () => {
  it("refuses to disable the calling admin themselves (409)", async () => {
    const { PATCH } = await import("./users/[id]/disable/route.js");
    const req = makeRequest(`http://localhost/api/v1/admin/users/${adminId}/disable`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ disabled: true }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: adminId }) });
    expect(res.status).toBe(409);
  });

  it("disables a user and revokes their sessions", async () => {
    const target = {
      _id: targetId,
      disabled: false,
      disabledAt: undefined,
      disabledReason: undefined,
      save: vi.fn().mockResolvedValue(undefined),
    };
    mockUserFindById.mockResolvedValue(target);

    const { PATCH } = await import("./users/[id]/disable/route.js");
    const req = makeRequest(`http://localhost/api/v1/admin/users/${targetId}/disable`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ disabled: true, reason: "spam" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: targetId }) });
    expect(res.status).toBe(200);
    expect(target.disabled).toBe(true);
    expect(target.disabledReason).toBe("spam");
    expect(mockRevokeAllSessions).toHaveBeenCalledWith(targetId);
  });
});

// ─── DLQ ────────────────────────────────────────────────────────────────────

describe("POST /api/v1/admin/dlq/requeue", () => {
  it("returns 409 when job is not in failed state", async () => {
    const job = {
      id: "job-1",
      getState: vi.fn().mockResolvedValue("active"),
      retry: vi.fn(),
    };
    mockGetQueue.mockReturnValue({ getJob: vi.fn().mockResolvedValue(job) });

    const { POST } = await import("./dlq/requeue/route.js");
    const req = makeRequest("http://localhost/api/v1/admin/dlq/requeue", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ queue: "audit:url", jobId: "job-1" }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(409);
    expect(job.retry).not.toHaveBeenCalled();
  });

  it("retries failed jobs", async () => {
    const job = {
      id: "job-1",
      getState: vi.fn().mockResolvedValue("failed"),
      retry: vi.fn().mockResolvedValue(undefined),
    };
    mockGetQueue.mockReturnValue({ getJob: vi.fn().mockResolvedValue(job) });

    const { POST } = await import("./dlq/requeue/route.js");
    const req = makeRequest("http://localhost/api/v1/admin/dlq/requeue", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ queue: "audit:url", jobId: "job-1" }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
    expect(job.retry).toHaveBeenCalledWith("failed");
  });
});
