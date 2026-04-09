import { PlanTier } from "@audex/types";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  checkApiRateLimit,
  checkAuthRateLimit,
  getTierLimit,
  rateLimitHeaders,
} from "./rate-limit.js";

import type { RateLimitResult } from "./rate-limit.js";

// ─── Mock Redis ────────────────────────────────────────────────────────────

const mockEval = vi.fn();

vi.mock("./redis.js", () => ({
  getRedis: () => ({
    eval: mockEval,
  }),
}));

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("rate-limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getTierLimit", () => {
    it("returns 10 for Free tier", () => {
      expect(getTierLimit(PlanTier.Free)).toBe(10);
    });

    it("returns 60 for Pro tier", () => {
      expect(getTierLimit(PlanTier.Pro)).toBe(60);
    });

    it("returns 120 for Team tier", () => {
      expect(getTierLimit(PlanTier.Team)).toBe(120);
    });

    it("returns 300 for Enterprise tier", () => {
      expect(getTierLimit(PlanTier.Enterprise)).toBe(300);
    });
  });

  describe("checkApiRateLimit", () => {
    it("allows request when under limit", async () => {
      mockEval.mockResolvedValue([1, 9, Date.now() + 60000]);

      const result = await checkApiRateLimit("user-1", PlanTier.Free);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.limit).toBe(10);
      expect(result.retryAfterSeconds).toBe(0);
    });

    it("blocks request when over limit", async () => {
      const resetAt = Date.now() + 45000;
      mockEval.mockResolvedValue([0, 0, resetAt]);

      const result = await checkApiRateLimit("user-1", PlanTier.Free);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
    });

    it("uses correct limit per tier", async () => {
      mockEval.mockResolvedValue([1, 59, Date.now() + 60000]);

      const result = await checkApiRateLimit("user-1", PlanTier.Pro);

      expect(result.limit).toBe(60);
    });
  });

  describe("checkAuthRateLimit", () => {
    it("uses fixed limit of 5 per minute", async () => {
      mockEval.mockResolvedValue([1, 4, Date.now() + 60000]);

      const result = await checkAuthRateLimit("192.168.1.1");

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(5);
    });
  });

  describe("rateLimitHeaders", () => {
    it("includes standard headers when allowed", () => {
      const result: RateLimitResult = {
        allowed: true,
        remaining: 5,
        resetAt: Date.now() + 30000,
        limit: 10,
        retryAfterSeconds: 0,
      };

      const headers = rateLimitHeaders(result);

      expect(headers["RateLimit-Limit"]).toBe("10");
      expect(headers["RateLimit-Remaining"]).toBe("5");
      expect(headers["RateLimit-Reset"]).toBeDefined();
      expect(headers["Retry-After"]).toBeUndefined();
    });

    it("includes Retry-After when blocked", () => {
      const result: RateLimitResult = {
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 45000,
        limit: 10,
        retryAfterSeconds: 45,
      };

      const headers = rateLimitHeaders(result);

      expect(headers["Retry-After"]).toBe("45");
    });
  });
});
