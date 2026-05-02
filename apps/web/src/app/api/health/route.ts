import { pingDb } from "@audex/db";
import { pingRedis } from "@audex/infra";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DependencyStatus {
  status: "ok" | "down";
  latencyMs: number | null;
}

interface HealthResponse {
  status: "ok" | "degraded";
  timestamp: string;
  version: string;
  uptime: number;
  dependencies: {
    mongodb: DependencyStatus;
    redis: DependencyStatus;
  };
}

// ─── GET /api/health ───────────────────────────────────────────────────────

/**
 * Aggregated health check.
 *
 * Pings MongoDB and Redis in parallel. Returns:
 *   - 200 + status: "ok" — all dependencies healthy
 *   - 503 + status: "degraded" — at least one dependency is down
 *
 * Used by:
 *   - Vercel's built-in health probe
 *   - Better Stack uptime monitoring
 *   - GitHub Actions smoke test
 *   - Worker readiness probes (different endpoint, same shape)
 */
export async function GET(): Promise<NextResponse<HealthResponse>> {
  const [mongoLatency, redisLatency] = await Promise.all([pingDb(), pingRedis()]);

  const mongoOk = mongoLatency !== null;
  const redisOk = redisLatency !== null;
  const allOk = mongoOk && redisOk;

  const response: HealthResponse = {
    status: allOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    version: process.env["npm_package_version"] ?? "0.0.0",
    uptime: process.uptime(),
    dependencies: {
      mongodb: {
        status: mongoOk ? "ok" : "down",
        latencyMs: mongoLatency,
      },
      redis: {
        status: redisOk ? "ok" : "down",
        latencyMs: redisLatency,
      },
    },
  };

  return NextResponse.json(response, {
    status: allOk ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
