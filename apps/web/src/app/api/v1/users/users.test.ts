/**
 * Integration tests for /api/v1/users/me + /api/v1/users/me/password.
 *
 * Verifies: auth (401), validation (400), password verification (401),
 * OAuth-only rejection (400), session revocation on password change.
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

const mockUserFindById = vi.fn();
const mockConnectDb = vi.fn().mockResolvedValue(undefined);
vi.mock("@audex/db", () => ({
  connectDb: mockConnectDb,
  User: { findById: mockUserFindById },
}));

const mockHashPassword = vi.fn().mockResolvedValue("$2a$12$newhash");
const mockVerifyPassword = vi.fn();
const mockRevokeAllSessions = vi.fn().mockResolvedValue(undefined);
vi.mock("@audex/auth", () => ({
  hashPassword: mockHashPassword,
  verifyPassword: mockVerifyPassword,
  revokeAllUserSessions: mockRevokeAllSessions,
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
  logSettingsChange: vi.fn(),
  logAuth: vi.fn(),
}));

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new Request(url, init));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthSession.mockResolvedValue(validSession);
});

// ─── GET /api/v1/users/me ──────────────────────────────────────────────────

describe("GET /api/v1/users/me", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuthSession.mockResolvedValue(null);
    const { GET } = await import("./me/route.js");
    const req = makeRequest("http://localhost/api/v1/users/me");
    const res = await GET(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(401);
  });

  it("returns the user profile", async () => {
    mockUserFindById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: userId, name: "Test", email: "x@x" }),
    });
    const { GET } = await import("./me/route.js");
    const req = makeRequest("http://localhost/api/v1/users/me");
    const res = await GET(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { name: string } };
    expect(body.data.name).toBe("Test");
  });
});

// ─── PATCH /api/v1/users/me ────────────────────────────────────────────────

describe("PATCH /api/v1/users/me", () => {
  it("merges settings.notifications without clobbering", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    interface UserDoc {
      _id: string;
      name: string;
      image?: string;
      settings: {
        defaultDevice: "mobile" | "desktop";
        notifications: { auditComplete: boolean; weeklyDigest: boolean; billing: boolean };
      };
      save: typeof save;
      toJSON: () => Record<string, unknown>;
    }
    const userDoc: UserDoc = {
      _id: userId,
      name: "Old",
      settings: {
        defaultDevice: "desktop",
        notifications: { auditComplete: true, weeklyDigest: true, billing: true },
      },
      save,
      toJSON: () => ({ _id: userDoc._id, name: userDoc.name, settings: userDoc.settings }),
    };
    mockUserFindById.mockResolvedValue(userDoc);
    const { PATCH } = await import("./me/route.js");
    const req = makeRequest("http://localhost/api/v1/users/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "New", settings: { notifications: { billing: false } } }),
    });
    const res = await PATCH(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
    expect(save).toHaveBeenCalled();
    const body = (await res.json()) as {
      data: {
        name: string;
        settings: { notifications: { auditComplete: boolean; billing: boolean } };
      };
    };
    expect(body.data.name).toBe("New");
    expect(body.data.settings.notifications.auditComplete).toBe(true);
    expect(body.data.settings.notifications.billing).toBe(false);
  });
});

// ─── POST /api/v1/users/me/password ────────────────────────────────────────

describe("POST /api/v1/users/me/password", () => {
  const validBody = JSON.stringify({
    currentPassword: "OldPass!1",
    newPassword: "NewPass!1A",
    confirmNewPassword: "NewPass!1A",
  });

  it("rejects OAuth-only accounts (no passwordHash)", async () => {
    mockUserFindById.mockReturnValue({
      select: vi.fn().mockResolvedValue({ _id: userId, passwordHash: undefined }),
    });
    const { POST } = await import("./me/password/route.js");
    const req = makeRequest("http://localhost/api/v1/users/me/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: validBody,
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
  });

  it("returns 401 when current password is wrong", async () => {
    mockVerifyPassword.mockResolvedValue(false);
    mockUserFindById.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        _id: userId,
        passwordHash: "$2a$12$old",
        save: vi.fn(),
      }),
    });
    const { POST } = await import("./me/password/route.js");
    const req = makeRequest("http://localhost/api/v1/users/me/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: validBody,
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(401);
    expect(mockRevokeAllSessions).not.toHaveBeenCalled();
  });

  it("hashes new password and revokes all sessions on success", async () => {
    mockVerifyPassword.mockResolvedValue(true);
    const save = vi.fn().mockResolvedValue(undefined);
    const userDoc: { _id: string; passwordHash: string; save: typeof save } = {
      _id: userId,
      passwordHash: "$2a$12$old",
      save,
    };
    mockUserFindById.mockReturnValue({ select: vi.fn().mockResolvedValue(userDoc) });
    const { POST } = await import("./me/password/route.js");
    const req = makeRequest("http://localhost/api/v1/users/me/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: validBody,
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
    expect(mockHashPassword).toHaveBeenCalledWith("NewPass!1A");
    expect(userDoc.passwordHash).toBe("$2a$12$newhash");
    expect(save).toHaveBeenCalled();
    expect(mockRevokeAllSessions).toHaveBeenCalledWith(userId);
  });

  it("rejects body with mismatched confirmation", async () => {
    const { POST } = await import("./me/password/route.js");
    const req = makeRequest("http://localhost/api/v1/users/me/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        currentPassword: "OldPass!1",
        newPassword: "NewPass!1A",
        confirmNewPassword: "Different!1A",
      }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
  });
});
