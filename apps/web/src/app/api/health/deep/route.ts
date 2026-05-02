import { requireRole } from "@audex/auth";
import { pingDb } from "@audex/db";
import { getQueueHealth, getTotalQueueDepth, pingRedis } from "@audex/infra";
import { UserRole } from "@audex/types";
import { ApiError } from "@audex/validators";

import { jsonOk, withHandler } from "../../../../lib/api/index.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── GET /api/health/deep ──────────────────────────────────────────────────

/**
 * Deep health diagnostics — admin only.
 *
 * Returns detailed status for:
 *   - MongoDB ping latency
 *   - Redis ping latency
 *   - BullMQ queue depths (waiting/active/completed/failed/delayed per queue)
 *   - Total queue depth across all queues
 *   - Process info (uptime, memory, version)
 *
 * Used for:
 *   - Admin system health page (`/admin/system`)
 *   - On-call debugging
 */
export const GET = withHandler({ rateLimit: false }, async ({ auth }) => {
  // Admin only
  const roleErr = requireRole(auth, UserRole.Admin);
  if (roleErr) {
    throw new ApiError(roleErr.code, roleErr.message);
  }

  const [mongoLatency, redisLatency, queueHealth, totalDepth] = await Promise.all([
    pingDb(),
    pingRedis(),
    getQueueHealth(),
    getTotalQueueDepth(),
  ]);

  const memoryUsage = process.memoryUsage();

  return jsonOk({
    status: mongoLatency !== null && redisLatency !== null && totalDepth >= 0 ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    version: process.env["npm_package_version"] ?? "0.0.0",
    process: {
      uptimeSeconds: process.uptime(),
      memory: {
        rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      },
      nodeVersion: process.version,
    },
    dependencies: {
      mongodb: {
        status: mongoLatency !== null ? "ok" : "down",
        latencyMs: mongoLatency,
      },
      redis: {
        status: redisLatency !== null ? "ok" : "down",
        latencyMs: redisLatency,
      },
    },
    queues: {
      total: totalDepth,
      perQueue: queueHealth,
    },
  });
});
