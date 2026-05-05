import { getQueue } from "@audex/infra";
import { ApiError, listDlqJobsSchema } from "@audex/validators";

import { jsonOk, requireAdmin, withHandler } from "../../../../../lib/api/index.js";

import type { QueueName } from "@audex/types";
import type { ListDlqJobsInput } from "@audex/validators";

// BullMQ queries — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DlqJobSummary {
  id: string;
  name: string;
  queue: string;
  attemptsMade: number;
  failedReason?: string;
  failedAt: number | null;
  data: unknown;
}

// ─── GET /api/v1/admin/dlq ─────────────────────────────────────────────────

/**
 * Admin: list dead-letter jobs for one queue. "DLQ" here = the BullMQ
 * `failed` set on a queue — `removeOnFail.count` keeps a rolling window
 * of recent failures for inspection / requeue.
 *
 * Query params: `queue` (required), `page`, `limit`.
 */
export const GET = withHandler({ query: listDlqJobsSchema }, async ({ auth, query, log }) => {
  requireAdmin(auth);
  const q = query as ListDlqJobsInput;

  const queue = getQueue(q.queue as QueueName);
  if (!queue) {
    throw ApiError.serviceUnavailable("Queue");
  }

  const start = (q.page - 1) * q.limit;
  const end = start + q.limit - 1;

  const [jobs, totalCount] = await Promise.all([
    queue.getJobs(["failed"], start, end),
    queue.getFailedCount(),
  ]);

  const items: DlqJobSummary[] = jobs.map((job) => ({
    id: job.id ?? "",
    name: job.name,
    queue: q.queue,
    attemptsMade: job.attemptsMade,
    ...(job.failedReason ? { failedReason: job.failedReason } : {}),
    failedAt: job.finishedOn ?? null,
    data: job.data,
  }));

  log.debug({ queue: q.queue, count: items.length, totalCount }, "Admin listed DLQ");

  return jsonOk({
    queue: q.queue,
    items,
    pagination: {
      page: q.page,
      limit: q.limit,
      total: totalCount,
      pages: Math.ceil(totalCount / q.limit),
      hasNext: end < totalCount - 1,
      hasPrev: q.page > 1,
    },
  });
});
