import { getQueue, logAdminAction } from "@audex/infra";
import { ApiError, dlqJobActionSchema } from "@audex/validators";

import { jsonOk, requireAdmin, withHandler } from "../../../../../../lib/api/index.js";

import type { QueueName } from "@audex/types";

// BullMQ writes — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── POST /api/v1/admin/dlq/discard ────────────────────────────────────────

/**
 * Admin: permanently remove a failed job from the queue. Use when a job
 * is definitely irrecoverable and you don't want it consuming the
 * retain-on-fail window.
 *
 * Body: `{ queue, jobId }`
 */
export const POST = withHandler({ body: dlqJobActionSchema }, async ({ auth, body, log, req }) => {
  requireAdmin(auth);

  const queue = getQueue(body.queue as QueueName);
  if (!queue) {
    throw ApiError.serviceUnavailable("Queue");
  }

  const job = await queue.getJob(body.jobId);
  if (!job) {
    throw ApiError.notFound("Job");
  }

  await job.remove();

  const userAgent = req.headers.get("user-agent");
  logAdminAction(
    {
      userId: auth.userId,
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      ...(userAgent ? { userAgent } : {}),
    },
    { action: "dlq.discard", queue: body.queue, jobId: body.jobId },
  );

  log.info({ queue: body.queue, jobId: body.jobId }, "DLQ job discarded");

  return jsonOk({ queue: body.queue, jobId: body.jobId, discarded: true });
});
