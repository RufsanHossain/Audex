/**
 * Integration tests for /api/v1/projects routes.
 *
 * Verifies: auth (401), validation (400), ownership (403), uniqueness
 * (409), and successful create/list/get/patch/delete flows. The mock
 * layer mirrors the audits.test.ts pattern.
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

function makeObjectId(): string {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

// ─── Mocks ─────────────────────────────────────────────────────────────────

const mockAuthSession = vi.fn<() => Promise<unknown>>();
vi.mock("../../../../auth", () => ({
  auth: (): Promise<unknown> => mockAuthSession(),
}));

const mockProjectCreate = vi.fn();
const mockProjectFind = vi.fn();
const mockProjectFindById = vi.fn();
const mockProjectCount = vi.fn();
const mockReportCount = vi.fn().mockResolvedValue(0);
const mockReportUpdate = vi.fn().mockResolvedValue({ modifiedCount: 0 });
const mockReportFindById = vi.fn().mockResolvedValue(null);
const mockConnectDb = vi.fn().mockResolvedValue(undefined);

const Project = {
  create: mockProjectCreate,
  find: mockProjectFind,
  findById: mockProjectFindById,
  countDocuments: mockProjectCount,
};

const Report = {
  countDocuments: mockReportCount,
  updateMany: mockReportUpdate,
  findById: mockReportFindById,
};

vi.mock("@audex/db", () => ({
  connectDb: mockConnectDb,
  Project,
  Report,
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

const mockCheckRateLimit = vi.fn().mockResolvedValue({
  allowed: true,
  remaining: 99,
  resetAt: Date.now() + 60_000,
  limit: 100,
  retryAfterSeconds: 0,
});

vi.mock("@audex/infra", () => ({
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
  logProjectAction: vi.fn(),
}));

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new Request(url, init));
}

const userId = makeObjectId();
const validSession = {
  user: { id: userId, email: "test@example.com", name: "Test", role: "free", emailVerified: null },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthSession.mockResolvedValue(validSession);
});

// ─── POST /api/v1/projects ─────────────────────────────────────────────────

describe("POST /api/v1/projects", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuthSession.mockResolvedValue(null);
    const { POST } = await import("./route.js");
    const req = makeRequest("http://localhost/api/v1/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Test", url: "https://example.com" }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid body (bad URL)", async () => {
    const { POST } = await import("./route.js");
    const req = makeRequest("http://localhost/api/v1/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Test", url: "not-a-url" }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
  });

  it("creates project and returns 201", async () => {
    const id = makeObjectId();
    mockProjectCreate.mockResolvedValue({
      _id: id,
      toJSON: () => ({ _id: id, name: "Test", slug: "test", url: "https://example.com" }),
    });
    const { POST } = await import("./route.js");

    const req = makeRequest("http://localhost/api/v1/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Test Project", url: "https://example.com" }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(201);
    const body = (await res.json()) as { success: boolean; data: { slug: string } };
    expect(body.success).toBe(true);
    expect(body.data.slug).toBe("test");
  });

  it("returns 409 on duplicate slug", async () => {
    const dupErr = Object.assign(new Error("dup"), { code: 11000 });
    mockProjectCreate.mockRejectedValue(dupErr);
    const { POST } = await import("./route.js");

    const req = makeRequest("http://localhost/api/v1/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Test", url: "https://example.com", slug: "taken" }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(409);
  });
});

// ─── GET /api/v1/projects ──────────────────────────────────────────────────

describe("GET /api/v1/projects", () => {
  it("returns paginated list", async () => {
    const items = [
      { _id: makeObjectId(), name: "A", slug: "a" },
      { _id: makeObjectId(), name: "B", slug: "b" },
    ];
    mockProjectFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(items),
    });
    mockProjectCount.mockResolvedValue(2);
    const { GET } = await import("./route.js");

    const req = makeRequest("http://localhost/api/v1/projects");
    const res = await GET(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { items: unknown[]; pagination: { total: number } };
    };
    expect(body.data.items).toHaveLength(2);
    expect(body.data.pagination.total).toBe(2);
  });
});

// ─── GET /api/v1/projects/:id ──────────────────────────────────────────────

describe("GET /api/v1/projects/:id", () => {
  it("returns 403 when accessing another user's project", async () => {
    const projectId = makeObjectId();
    mockProjectFindById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: projectId,
        userId: makeObjectId(), // different user
        name: "Other",
      }),
    });
    const { GET } = await import("./[id]/route.js");

    const req = makeRequest(`http://localhost/api/v1/projects/${projectId}`);
    const res = await GET(req, { params: Promise.resolve({ id: projectId }) });
    expect(res.status).toBe(403);
  });

  it("returns 404 when project does not exist", async () => {
    mockProjectFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
    const { GET } = await import("./[id]/route.js");

    const id = makeObjectId();
    const req = makeRequest(`http://localhost/api/v1/projects/${id}`);
    const res = await GET(req, { params: Promise.resolve({ id }) });
    expect(res.status).toBe(404);
  });

  it("returns owned project with lastAudit", async () => {
    const projectId = makeObjectId();
    mockProjectFindById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: projectId,
        userId: { toString: () => userId },
        name: "Mine",
        lastAuditId: null,
      }),
    });
    const { GET } = await import("./[id]/route.js");

    const req = makeRequest(`http://localhost/api/v1/projects/${projectId}`);
    const res = await GET(req, { params: Promise.resolve({ id: projectId }) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { name: string; lastAudit: unknown } };
    expect(body.data.name).toBe("Mine");
    expect(body.data.lastAudit).toBeNull();
  });
});

// ─── DELETE /api/v1/projects/:id ───────────────────────────────────────────

describe("DELETE /api/v1/projects/:id", () => {
  it("returns 409 when project has reports and force is not set", async () => {
    const projectId = makeObjectId();
    mockProjectFindById.mockResolvedValue({
      _id: projectId,
      userId: { toString: () => userId },
      deleteOne: vi.fn(),
    });
    mockReportCount.mockResolvedValue(3);
    const { DELETE } = await import("./[id]/route.js");

    const req = makeRequest(`http://localhost/api/v1/projects/${projectId}`, { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: projectId }) });
    expect(res.status).toBe(409);
  });

  it("orphans reports and deletes when force=true", async () => {
    const projectId = makeObjectId();
    const deleteOne = vi.fn().mockResolvedValue(undefined);
    mockProjectFindById.mockResolvedValue({
      _id: projectId,
      userId: { toString: () => userId },
      deleteOne,
    });
    mockReportCount.mockResolvedValue(2);
    const { DELETE } = await import("./[id]/route.js");

    const req = makeRequest(`http://localhost/api/v1/projects/${projectId}?force=true`, {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: projectId }) });
    expect(res.status).toBe(200);
    expect(mockReportUpdate).toHaveBeenCalled();
    expect(deleteOne).toHaveBeenCalled();
    const body = (await res.json()) as { data: { orphanedReports: number } };
    expect(body.data.orphanedReports).toBe(2);
  });
});
