import { PlanTier } from "@audex/types";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { acquireAuditSlot, releaseAuditSlot, getActiveSlotCount } from "./concurrency.js";

// ─── Mock Redis ────────────────────────────────────────────────────────────

const mockScard = vi.fn();
const mockSadd = vi.fn();
const mockSet = vi.fn();
const mockExpire = vi.fn();
const mockSrem = vi.fn();
const mockDel = vi.fn();
const mockSmembers = vi.fn();
const mockPipeline = vi.fn();

vi.mock("./redis.js", () => ({
  getRedis: () => ({
    scard: mockScard,
    sadd: mockSadd,
    set: mockSet,
    expire: mockExpire,
    srem: mockSrem,
    del: mockDel,
    smembers: mockSmembers,
    pipeline: mockPipeline,
  }),
}));

describe("concurrency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no existing slots, pipeline returns empty
    mockSmembers.mockResolvedValue([]);
    mockPipeline.mockReturnValue({
      exists: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    });
  });

  describe("acquireAuditSlot", () => {
    it("acquires slot when under limit", async () => {
      mockScard.mockResolvedValue(0);
      mockSadd.mockResolvedValue(1);
      mockSet.mockResolvedValue("OK");
      mockExpire.mockResolvedValue(1);

      const result = await acquireAuditSlot("user-1", "audit-1", PlanTier.Free);

      expect(result.acquired).toBe(true);
      expect(result.active).toBe(1);
      expect(result.limit).toBe(1);
    });

    it("rejects when at limit for Free tier (1 concurrent)", async () => {
      mockScard.mockResolvedValue(1);

      const result = await acquireAuditSlot("user-1", "audit-2", PlanTier.Free);

      expect(result.acquired).toBe(false);
      expect(result.active).toBe(1);
      expect(result.limit).toBe(1);
    });

    it("allows 3 concurrent for Pro tier", async () => {
      mockScard.mockResolvedValue(2);
      mockSadd.mockResolvedValue(1);
      mockSet.mockResolvedValue("OK");
      mockExpire.mockResolvedValue(1);

      const result = await acquireAuditSlot("user-1", "audit-3", PlanTier.Pro);

      expect(result.acquired).toBe(true);
      expect(result.limit).toBe(3);
    });

    it("rejects at 3 for Pro tier", async () => {
      mockScard.mockResolvedValue(3);

      const result = await acquireAuditSlot("user-1", "audit-4", PlanTier.Pro);

      expect(result.acquired).toBe(false);
      expect(result.limit).toBe(3);
    });
  });

  describe("releaseAuditSlot", () => {
    it("removes slot from Redis", async () => {
      mockSrem.mockResolvedValue(1);
      mockDel.mockResolvedValue(1);

      await releaseAuditSlot("user-1", "audit-1");

      expect(mockSrem).toHaveBeenCalledWith(expect.stringContaining("user-1"), "audit-1");
      expect(mockDel).toHaveBeenCalled();
    });
  });

  describe("getActiveSlotCount", () => {
    it("returns current count", async () => {
      mockScard.mockResolvedValue(2);

      const count = await getActiveSlotCount("user-1");

      expect(count).toBe(2);
    });
  });
});
