import { AuditLogAction } from "@audex/types";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  registerAuditLogPersist,
  writeAuditLog,
  logAuth,
  logAuditAction,
  logApiKeyAction,
  logProjectAction,
  logPlanChange,
} from "./audit-log.js";

// Suppress pino output in tests
vi.mock("./logger.js", () => ({
  createLogger: () => ({
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
  }),
}));

describe("audit-log", () => {
  const mockPersist = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPersist.mockResolvedValue(undefined);
    registerAuditLogPersist(mockPersist);
  });

  const ctx = {
    userId: "user-1",
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0",
  };

  describe("writeAuditLog", () => {
    it("calls persist function with correct entry", async () => {
      writeAuditLog({
        ...ctx,
        action: AuditLogAction.AuthLogin,
        metadata: { provider: "google" },
      });

      await vi.waitFor(() => {
        expect(mockPersist).toHaveBeenCalledTimes(1);
      });

      expect(mockPersist).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          action: "auth.login",
          ipAddress: "192.168.1.1",
          metadata: { provider: "google" },
        }),
      );
    });
  });

  describe("convenience helpers", () => {
    it("logAuth maps login correctly", async () => {
      logAuth(ctx, "login");
      await vi.waitFor(() => {
        expect(mockPersist).toHaveBeenCalledTimes(1);
      });
      expect(mockPersist).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditLogAction.AuthLogin }),
      );
    });

    it("logAuth maps failed_login correctly", async () => {
      logAuth(ctx, "failed_login");
      await vi.waitFor(() => {
        expect(mockPersist).toHaveBeenCalledTimes(1);
      });
      expect(mockPersist).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditLogAction.AuthFailedLogin }),
      );
    });

    it("logAuditAction maps create correctly", async () => {
      logAuditAction(ctx, "create", { auditId: "a-1" });
      await vi.waitFor(() => {
        expect(mockPersist).toHaveBeenCalledTimes(1);
      });
      expect(mockPersist).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditLogAction.AuditCreate,
          metadata: { auditId: "a-1" },
        }),
      );
    });

    it("logApiKeyAction maps revoke correctly", async () => {
      logApiKeyAction(ctx, "revoke");
      await vi.waitFor(() => {
        expect(mockPersist).toHaveBeenCalledTimes(1);
      });
      expect(mockPersist).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditLogAction.ApiKeyRevoke }),
      );
    });

    it("logProjectAction maps delete correctly", async () => {
      logProjectAction(ctx, "delete");
      await vi.waitFor(() => {
        expect(mockPersist).toHaveBeenCalledTimes(1);
      });
      expect(mockPersist).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditLogAction.ProjectDelete }),
      );
    });

    it("logPlanChange maps upgrade correctly", async () => {
      logPlanChange(ctx, "upgrade", { from: "free", to: "pro" });
      await vi.waitFor(() => {
        expect(mockPersist).toHaveBeenCalledTimes(1);
      });
      expect(mockPersist).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditLogAction.PlanUpgrade }),
      );
    });
  });
});
