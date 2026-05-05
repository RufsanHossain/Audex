import { getQueueHealth, getTotalQueueDepth } from "@audex/infra";

import { jsonOk, requireAdmin, withHandler } from "../../../../../../lib/api/index.js";

// BullMQ queries — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── GET /api/v1/admin/system/queues ───────────────────────────────────────

/**
 * Admin: per-queue counters (waiting / active / completed / failed /
 * delayed) for all 5 queues, plus total depth across the fleet.
 */
export const GET = withHandler({}, async ({ auth, log }) => {
  requireAdmin(auth);

  const [queues, totalDepth] = await Promise.all([getQueueHealth(), getTotalQueueDepth()]);

  log.debug({ totalDepth, queueCount: queues.length }, "Admin fetched queue metrics");

  return jsonOk({
    queues,
    totalDepth,
    checkedAt: new Date().toISOString(),
  });
});
