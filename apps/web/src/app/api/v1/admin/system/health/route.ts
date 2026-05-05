import { pingDb } from "@audex/db";
import { getQueueHealth, pingRedis } from "@audex/infra";

import { jsonOk, requireAdmin, withHandler } from "../../../../../../lib/api/index.js";

// Pings external services — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── GET /api/v1/admin/system/health ───────────────────────────────────────

/**
 * Admin deep-health check. Reports MongoDB latency, Redis latency, and
 * per-queue depth. The user-facing /api/health is a lightweight subset;
 * this one always returns 200 with the raw numbers so admins can diagnose
 * even when something is degraded.
 */
export const GET = withHandler({}, async ({ auth, log }) => {
  requireAdmin(auth);

  const [dbLatencyMs, redisLatencyMs, queues] = await Promise.all([
    pingDb(),
    pingRedis(),
    getQueueHealth(),
  ]);

  const status =
    dbLatencyMs !== null && redisLatencyMs !== null
      ? "healthy"
      : dbLatencyMs !== null || redisLatencyMs !== null
        ? "degraded"
        : "unhealthy";

  log.debug({ status, dbLatencyMs, redisLatencyMs }, "Admin checked system health");

  return jsonOk({
    status,
    checks: {
      mongodb: { latencyMs: dbLatencyMs, ok: dbLatencyMs !== null },
      redis: { latencyMs: redisLatencyMs, ok: redisLatencyMs !== null },
    },
    queues,
    checkedAt: new Date().toISOString(),
  });
});
