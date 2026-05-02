import { connectDb, Report } from "@audex/db";
import {
  getQueue,
  getRedis,
  logAuditAction,
  publishAuditEvent,
  releaseAuditSlot,
} from "@audex/infra";
import { QueueName, UserRole } from "@audex/types";
import { ApiError } from "@audex/validators";

import { jsonOk, withHandler } from "../../../../../../lib/api/index.js";

// ─── POST /api/v1/audits/:id/cancel ────────────────────────────────────────

/**
 * Cancel a queued or processing audit.
 *
 * Flow:
 *   1. Auth + ownership check (admin bypass)
 *   2. Verify status is queued or processing — terminal states return 409
 *   3. Remove from BullMQ queue (best-effort — worker may have already picked it up)
 *   4. Update Report status → cancelled
 *   5. Release concurrent slot
 *   6. Publish SSE cancellation event
 *   7. Audit log
 *   8. Return 200 with updated audit
 */
export const POST = withHandler({}, async ({ auth, params, log, req }) => {
  const auditId = params["id"];
  if (!auditId) {
    throw ApiError.notFound("Audit");
  }

  await connectDb();

  const audit = await Report.findById(auditId);
  if (!audit) {
    throw ApiError.notFound("Audit");
  }

  // Ownership check
  const isOwner = audit.userId.toString() === auth.userId;
  const isAdmin = auth.role === UserRole.Admin;
  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden("You do not have access to this audit");
  }

  // State check
  if (audit.status !== "queued" && audit.status !== "processing") {
    throw ApiError.conflict(`Cannot cancel audit in '${audit.status}' state`);
  }

  // 1. Remove from BullMQ queue (best-effort)
  const queueName = audit.inputType === "url" ? QueueName.AuditURL : QueueName.AuditCode;
  const queue = getQueue(queueName);
  if (queue) {
    try {
      // Find the job by name pattern. BullMQ doesn't index by audit ID directly,
      // so we search recent waiting/delayed jobs.
      const jobs = await queue.getJobs(["waiting", "delayed", "active"], 0, 100);
      const targetJob = jobs.find((j) => {
        const data = j.data as { auditId?: string };
        return data.auditId === auditId;
      });
      if (targetJob) {
        await targetJob.remove();
        log.debug({ auditId, jobId: targetJob.id }, "Removed job from queue");
      }
    } catch (err) {
      // Non-fatal — job may already be in-flight, worker will see status=cancelled
      log.warn({ err, auditId }, "Failed to remove job from queue");
    }
  }

  // 2. Update status
  audit.status = "cancelled";
  audit.error = {
    code: "USER_CANCELLED",
    message: "Cancelled by user",
  };
  await audit.save();

  // 3. Release concurrent slot
  await releaseAuditSlot(audit.userId.toString(), auditId);

  // 4. Publish SSE event so any open progress streams see the cancellation
  const redis = getRedis();
  if (redis) {
    await publishAuditEvent(redis, auditId, "audit:cancelled", {
      reason: "Cancelled by user",
      cancelledBy: isAdmin && !isOwner ? "system" : "user",
    });
  }

  // 5. Audit log
  const userAgent = req.headers.get("user-agent");
  logAuditAction(
    {
      userId: auth.userId,
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      ...(userAgent ? { userAgent } : {}),
    },
    "cancel",
    { auditId, byAdmin: isAdmin && !isOwner },
  );

  log.info({ auditId }, "Audit cancelled");

  return jsonOk({
    auditId,
    status: "cancelled",
  });
});
