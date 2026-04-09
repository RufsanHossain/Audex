import { PlanTier } from "@audex/types";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { getPlanPriority, getQueueConnection } from "./queue.js";

describe("queue", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  describe("getPlanPriority", () => {
    it("returns 1 for enterprise (highest priority)", () => {
      expect(getPlanPriority(PlanTier.Enterprise)).toBe(1);
    });

    it("returns 2 for team", () => {
      expect(getPlanPriority(PlanTier.Team)).toBe(2);
    });

    it("returns 3 for pro", () => {
      expect(getPlanPriority(PlanTier.Pro)).toBe(3);
    });

    it("returns 4 for free (lowest priority)", () => {
      expect(getPlanPriority(PlanTier.Free)).toBe(4);
    });

    it("enterprise processes before free", () => {
      expect(getPlanPriority(PlanTier.Enterprise)).toBeLessThan(getPlanPriority(PlanTier.Free));
    });
  });

  describe("getQueueConnection", () => {
    it("returns null when REDIS_URL is not set", () => {
      vi.stubEnv("REDIS_URL", "");
      expect(getQueueConnection()).toBeNull();
    });

    it("parses REDIS_URL correctly", () => {
      vi.stubEnv("REDIS_URL", "redis://user:pass@localhost:6380");
      vi.stubEnv("REDIS_TLS", "false");

      const conn = getQueueConnection();

      expect(conn).not.toBeNull();
      expect(conn).toHaveProperty("host", "localhost");
      expect(conn).toHaveProperty("port", 6380);
      expect(conn).toHaveProperty("password", "pass");
    });

    it("enables TLS by default", () => {
      vi.stubEnv("REDIS_URL", "redis://localhost:6379");

      const conn = getQueueConnection();

      expect(conn).not.toBeNull();
      expect(conn).toHaveProperty("tls");
    });

    it("disables TLS when REDIS_TLS=false", () => {
      vi.stubEnv("REDIS_URL", "redis://localhost:6379");
      vi.stubEnv("REDIS_TLS", "false");

      const conn = getQueueConnection();

      expect(conn).not.toBeNull();
      expect(conn).not.toHaveProperty("tls");
    });
  });
});
