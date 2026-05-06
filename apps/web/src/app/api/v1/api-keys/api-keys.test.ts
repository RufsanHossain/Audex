/**
 * Integration tests for /api/v1/api-keys.
 *
 * Verifies create returns the raw key once, list omits the secret hash,
 * and revoke delegates to @audex/auth/revokeApiKey + treats not-found
 * (or another user's key) as 404.
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

function makeObjectId(): string {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

const userId = makeObjectId();
const validSession = {
  user: { id: userId, email: "test@example.com", name: "Test", role: "team", emailVerified: null },
};

// ─── Mocks ─────────────────────────────────────────────────────────────────

const mockAuthSession = vi.fn<() => Promise<unknown>>();
vi.mock("../../../../auth", () => ({
  auth: (): Promise<unknown> => mockAuthSession(),
}));

const mockApiKeyFind = vi.fn();
const mockApiKeyCount = vi.fn();
const mockConnectDb = vi.fn().mockResolvedValue(undefined);
vi.mock("@audex/db", () => ({
  connectDb: mockConnectDb,
  ApiKey: { find: mockApiKeyFind, countDocuments: mockApiKeyCount },
}));

const mockGenerateApiKey = vi.fn();
const mockRevokeApiKey = vi.fn();
vi.mock("@audex/auth", () => ({
  generateApiKey: mockGenerateApiKey,
  revokeApiKey: mockRevokeApiKey,
  extractAuth: (session: { user: { id: string; role: string } } | null) =>
    session
      ? { userId: session.user.id, role: session.user.role, email: "x@x", emailVerified: null }
      : null,
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
  logApiKeyAction: vi.fn(),
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
  mockAuthSession.mockResolvedValue(validSession);
});

// ─── POST /api/v1/api-keys ─────────────────────────────────────────────────

describe("POST /api/v1/api-keys", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuthSession.mockResolvedValue(null);
    const { POST } = await import("./route.js");
    const req = makeRequest("http://localhost/api/v1/api-keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Test", scopes: ["audit:read"] }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(401);
  });

  it("returns 400 when scopes is empty", async () => {
    const { POST } = await import("./route.js");
    const req = makeRequest("http://localhost/api/v1/api-keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Test", scopes: [] }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
  });

  it("returns the raw key on successful create", async () => {
    mockGenerateApiKey.mockResolvedValue({
      keyId: makeObjectId(),
      rawKey: "audex_sk_abcdef0123456789",
      keyPrefix: "audex_sk_abcdef01",
    });
    const { POST } = await import("./route.js");
    const req = makeRequest("http://localhost/api/v1/api-keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "CI", scopes: ["audit:read", "report:read"] }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { rawKey: string; keyPrefix: string } };
    expect(body.data.rawKey).toBe("audex_sk_abcdef0123456789");
    expect(body.data.keyPrefix).toBe("audex_sk_abcdef01");
  });
});

// ─── GET /api/v1/api-keys ──────────────────────────────────────────────────

describe("GET /api/v1/api-keys", () => {
  it("returns paginated list (no secret hash)", async () => {
    const items = [{ _id: makeObjectId(), name: "CI", keyPrefix: "audex_sk_abc" }];
    mockApiKeyFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(items),
    });
    mockApiKeyCount.mockResolvedValue(1);
    const { GET } = await import("./route.js");
    const req = makeRequest("http://localhost/api/v1/api-keys");
    const res = await GET(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { items: { keyHash?: string }[] } };
    expect(body.data.items[0]?.keyHash).toBeUndefined();
  });
});

// ─── DELETE /api/v1/api-keys/:id ───────────────────────────────────────────

describe("DELETE /api/v1/api-keys/:id", () => {
  it("returns 404 when revokeApiKey reports not found / wrong owner", async () => {
    mockRevokeApiKey.mockResolvedValue(false);
    const { DELETE } = await import("./[id]/route.js");
    const id = makeObjectId();
    const req = makeRequest(`http://localhost/api/v1/api-keys/${id}`, { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id }) });
    expect(res.status).toBe(404);
  });

  it("returns 200 on successful revoke", async () => {
    mockRevokeApiKey.mockResolvedValue(true);
    const { DELETE } = await import("./[id]/route.js");
    const id = makeObjectId();
    const req = makeRequest(`http://localhost/api/v1/api-keys/${id}`, { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id }) });
    expect(res.status).toBe(200);
    expect(mockRevokeApiKey).toHaveBeenCalledWith(id, userId);
  });
});
