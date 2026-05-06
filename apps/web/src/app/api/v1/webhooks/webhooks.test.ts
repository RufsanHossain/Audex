/**
 * Integration tests for /api/v1/webhooks.
 *
 * Verifies plan gating (Free → 403), secret-on-create, ownership on
 * PATCH/DELETE, and HMAC-signed test delivery.
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

function makeObjectId(): string {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

const userId = makeObjectId();
const teamSession = {
  user: { id: userId, email: "team@example.com", name: "Team", role: "team", emailVerified: null },
};
const freeSession = {
  user: { id: userId, email: "free@example.com", name: "Free", role: "free", emailVerified: null },
};

// ─── Mocks ─────────────────────────────────────────────────────────────────

const mockAuthSession = vi.fn<() => Promise<unknown>>();
vi.mock("../../../../auth", () => ({
  auth: (): Promise<unknown> => mockAuthSession(),
}));

const mockWebhookCreate = vi.fn();
const mockWebhookFind = vi.fn();
const mockWebhookFindById = vi.fn();
const mockWebhookCount = vi.fn();
const mockConnectDb = vi.fn().mockResolvedValue(undefined);

vi.mock("@audex/db", () => ({
  connectDb: mockConnectDb,
  Webhook: {
    create: mockWebhookCreate,
    find: mockWebhookFind,
    findById: mockWebhookFindById,
    countDocuments: mockWebhookCount,
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
  logWebhookAction: vi.fn(),
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
  mockAuthSession.mockResolvedValue(teamSession);
});

// ─── POST /api/v1/webhooks ─────────────────────────────────────────────────

describe("POST /api/v1/webhooks", () => {
  it("returns 403 for Free tier (Team+ only)", async () => {
    mockAuthSession.mockResolvedValue(freeSession);
    const { POST } = await import("./route.js");
    const req = makeRequest("http://localhost/api/v1/webhooks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        url: "https://example.com/hook",
        events: ["audit.completed"],
      }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(403);
  });

  it("returns the secret once on successful create", async () => {
    const id = makeObjectId();
    mockWebhookCreate.mockResolvedValue({
      _id: id,
      toJSON: () => ({ _id: id, url: "https://example.com/hook", events: ["audit.completed"] }),
    });
    const { POST } = await import("./route.js");
    const req = makeRequest("http://localhost/api/v1/webhooks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        url: "https://example.com/hook",
        events: ["audit.completed"],
      }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { secret: string; warning: string } };
    expect(body.data.secret).toMatch(/^[a-f0-9]{64}$/);
    expect(body.data.warning).toContain("Save this secret");
  });
});

// ─── PATCH /api/v1/webhooks/:id ────────────────────────────────────────────

describe("PATCH /api/v1/webhooks/:id", () => {
  it("returns 403 when not the owner", async () => {
    const webhookId = makeObjectId();
    mockWebhookFindById.mockResolvedValue({
      _id: webhookId,
      userId: { toString: () => makeObjectId() }, // different user
      save: vi.fn(),
    });
    const { PATCH } = await import("./[id]/route.js");
    const req = makeRequest(`http://localhost/api/v1/webhooks/${webhookId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: webhookId }) });
    expect(res.status).toBe(403);
  });

  it("updates fields the caller owns", async () => {
    const webhookId = makeObjectId();
    const save = vi.fn().mockResolvedValue(undefined);
    interface WebhookDoc {
      _id: string;
      userId: { toString(): string };
      isActive: boolean;
      url: string;
      save: typeof save;
      toJSON: () => Record<string, unknown>;
    }
    const doc: WebhookDoc = {
      _id: webhookId,
      userId: { toString: () => userId },
      isActive: true,
      url: "https://old.example.com",
      save,
      toJSON: () => ({ _id: doc._id, isActive: doc.isActive, url: doc.url }),
    };
    mockWebhookFindById.mockResolvedValue(doc);
    const { PATCH } = await import("./[id]/route.js");
    const req = makeRequest(`http://localhost/api/v1/webhooks/${webhookId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: webhookId }) });
    expect(res.status).toBe(200);
    expect(save).toHaveBeenCalled();
  });
});

// ─── POST /api/v1/webhooks/:id/test ────────────────────────────────────────

describe("POST /api/v1/webhooks/:id/test", () => {
  it("delivers a signed payload and returns the receiver status", async () => {
    const webhookId = makeObjectId();
    mockWebhookFindById.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        _id: webhookId,
        userId: { toString: () => userId },
        url: "https://example.com/hook",
        secret: "shhh-this-is-a-test-secret",
      }),
    });

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response('{"ok":true}', { status: 200 }));

    const { POST } = await import("./[id]/test/route.js");
    const req = makeRequest(`http://localhost/api/v1/webhooks/${webhookId}/test`, {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: webhookId }) });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { ok: boolean; status: number } };
    expect(body.data.ok).toBe(true);
    expect(body.data.status).toBe(200);

    // Confirm the request was signed.
    const call = fetchSpy.mock.calls[0];
    const init = call?.[1];
    const headers = (init?.headers ?? {}) as Record<string, string>;
    expect(headers["x-audex-signature"]).toMatch(/^sha256=[a-f0-9]{64}$/);
    expect(headers["x-audex-event"]).toBe("webhook.test");

    fetchSpy.mockRestore();
  });
});
