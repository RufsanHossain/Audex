import { PlanTier } from "@audex/types";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { getUsage, incrementUsage, resetUsage } from "./usage.js";

// ─── Mock Redis ────────────────────────────────────────────────────────────

const mockGet = vi.fn();
const mockIncr = vi.fn();
const mockExpire = vi.fn();
const mockDel = vi.fn();

vi.mock("./redis.js", () => ({
  getRedis: () => ({
    get: mockGet,
    incr: mockIncr,
    expire: mockExpire,
    del: mockDel,
    set: vi.fn(),
  }),
}));

describe("usage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUsage", () => {
    it("returns usage info for Free tier", async () => {
      mockGet.mockResolvedValue("2");

      const usage = await getUsage("user-1", PlanTier.Free);

      expect(usage.used).toBe(2);
      expect(usage.limit).toBe(3);
      expect(usage.remaining).toBe(1);
      expect(usage.exceeded).toBe(false);
      expect(usage.percentUsed).toBe(67);
    });

    it("shows exceeded when at limit", async () => {
      mockGet.mockResolvedValue("3");

      const usage = await getUsage("user-1", PlanTier.Free);

      expect(usage.exceeded).toBe(true);
      expect(usage.remaining).toBe(0);
      expect(usage.percentUsed).toBe(100);
    });

    it("returns 0 used when no Redis key exists", async () => {
      mockGet.mockResolvedValue(null);

      const usage = await getUsage("user-1", PlanTier.Free);

      expect(usage.used).toBe(0);
      expect(usage.remaining).toBe(3);
    });

    it("returns Infinity for unlimited plans", async () => {
      const usage = await getUsage("user-1", PlanTier.Pro);

      expect(usage.limit).toBe(Infinity);
      expect(usage.remaining).toBe(Infinity);
      expect(usage.exceeded).toBe(false);
      // Should NOT call Redis for unlimited plans
      expect(mockGet).not.toHaveBeenCalled();
    });

    it("includes resetDate as ISO string", async () => {
      mockGet.mockResolvedValue("1");

      const usage = await getUsage("user-1", PlanTier.Free);

      expect(usage.resetDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe("incrementUsage", () => {
    it("increments and sets TTL", async () => {
      mockIncr.mockResolvedValue(2);
      mockExpire.mockResolvedValue(1);

      const count = await incrementUsage("user-1");

      expect(count).toBe(2);
      expect(mockIncr).toHaveBeenCalled();
      expect(mockExpire).toHaveBeenCalled();
    });
  });

  describe("resetUsage", () => {
    it("deletes the usage key", async () => {
      mockDel.mockResolvedValue(1);

      await resetUsage("user-1");

      expect(mockDel).toHaveBeenCalled();
    });
  });
});
