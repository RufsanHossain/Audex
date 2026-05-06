/**
 * Integration tests for /api/v1/notifications.
 *
 * Verifies list with unread filter, mark-single (ownership baked into
 * the findOneAndUpdate filter), mark-all, and unread-count.
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

function makeObjectId(): string {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

const userId = makeObjectId();
const validSession = {
  user: { id: userId, email: "test@example.com", name: "Test", role: "free", emailVerified: null },
};

// ─── Mocks ─────────────────────────────────────────────────────────────────

const mockAuthSession = vi.fn<() => Promise<unknown>>();
vi.mock("../../../../auth", () => ({
  auth: (): Promise<unknown> => mockAuthSession(),
}));

const mockNotifFind = vi.fn();
const mockNotifCount = vi.fn();
const mockNotifFindOneAndUpdate = vi.fn();
const mockNotifUpdateMany = vi.fn();
const mockConnectDb = vi.fn().mockResolvedValue(undefined);

vi.mock("@audex/db", () => ({
  connectDb: mockConnectDb,
  Notification: {
    find: mockNotifFind,
    countDocuments: mockNotifCount,
    findOneAndUpdate: mockNotifFindOneAndUpdate,
    updateMany: mockNotifUpdateMany,
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

// ─── GET /api/v1/notifications ─────────────────────────────────────────────

describe("GET /api/v1/notifications", () => {
  it("returns paginated list with unreadCount", async () => {
    const items = [{ _id: makeObjectId(), title: "A", read: false }];
    mockNotifFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(items),
    });
    mockNotifCount.mockResolvedValueOnce(1).mockResolvedValueOnce(1);

    const { GET } = await import("./route.js");
    const req = makeRequest("http://localhost/api/v1/notifications?unread=true");
    const res = await GET(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { items: unknown[]; unreadCount: number } };
    expect(body.data.items).toHaveLength(1);
    expect(body.data.unreadCount).toBe(1);
  });
});

// ─── POST /api/v1/notifications/:id/read ───────────────────────────────────

describe("POST /api/v1/notifications/:id/read", () => {
  it("returns 404 when not found or not owned", async () => {
    mockNotifFindOneAndUpdate.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
    const { POST } = await import("./[id]/read/route.js");
    const id = makeObjectId();
    const req = makeRequest(`http://localhost/api/v1/notifications/${id}/read`, {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id }) });
    expect(res.status).toBe(404);
  });

  it("returns the updated notification on success", async () => {
    const id = makeObjectId();
    mockNotifFindOneAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: id, read: true, title: "Hi" }),
    });
    const { POST } = await import("./[id]/read/route.js");
    const req = makeRequest(`http://localhost/api/v1/notifications/${id}/read`, {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id }) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { read: boolean } };
    expect(body.data.read).toBe(true);
  });
});

// ─── POST /api/v1/notifications/read-all ───────────────────────────────────

describe("POST /api/v1/notifications/read-all", () => {
  it("returns the updated count", async () => {
    mockNotifUpdateMany.mockResolvedValue({ modifiedCount: 5 });
    const { POST } = await import("./read-all/route.js");
    const req = makeRequest("http://localhost/api/v1/notifications/read-all", { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { updated: number } };
    expect(body.data.updated).toBe(5);
  });
});

// ─── GET /api/v1/notifications/unread-count ────────────────────────────────

describe("GET /api/v1/notifications/unread-count", () => {
  it("returns the unread count", async () => {
    mockNotifCount.mockResolvedValue(3);
    const { GET } = await import("./unread-count/route.js");
    const req = makeRequest("http://localhost/api/v1/notifications/unread-count");
    const res = await GET(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { count: number } };
    expect(body.data.count).toBe(3);
  });
});
