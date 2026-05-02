import { QueueName } from "@audex/types";

import { addJob, getQueue } from "./queue.js";

import type {
  CodeAuditJobData,
  ExportJobData,
  NotificationJobData,
  PlanTier,
  ScheduledJobData,
  URLAuditJobData,
} from "@audex/types";
import type { JobsOptions } from "bullmq";

// ─── Per-Queue Typed Helpers ───────────────────────────────────────────────

/**
 * Enqueue a URL audit job with plan-based priority.
 * Returns the job ID or null if Redis is unavailable.
 */
export async function enqueueUrlAudit(
  data: URLAuditJobData,
  options?: { planTier?: PlanTier },
): Promise<string | null> {
  return addJob(QueueName.AuditURL, `url-audit:${data.auditId}`, data, {
    planTier: options?.planTier ?? data.planTier,
  });
}

/**
 * Enqueue a code audit job with plan-based priority.
 */
export async function enqueueCodeAudit(
  data: CodeAuditJobData,
  options?: { planTier?: PlanTier },
): Promise<string | null> {
  return addJob(QueueName.AuditCode, `code-audit:${data.auditId}`, data, {
    planTier: options?.planTier ?? data.planTier,
  });
}

/**
 * Enqueue a notification for delivery (in-app, email, slack, webhook).
 */
export async function enqueueNotification(data: NotificationJobData): Promise<string | null> {
  return addJob(QueueName.Notifications, `notify:${data.type}:${data.userId}`, data);
}

/**
 * Enqueue a report export job (PDF, JSON, CSV).
 */
export async function enqueueExport(data: ExportJobData): Promise<string | null> {
  return addJob(QueueName.Exports, `export:${data.format}:${data.reportId}`, data);
}

/**
 * Enqueue a scheduled maintenance job.
 */
export async function enqueueScheduledJob(
  data: ScheduledJobData,
  options?: JobsOptions,
): Promise<string | null> {
  return addJob(QueueName.Scheduled, `scheduled:${data.type}`, data, options);
}

// ─── Queue Manager ─────────────────────────────────────────────────────────

interface QueueHealth {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  isPaused: boolean;
}

/**
 * Get health status for all 5 queues.
 * Returns null for queues that couldn't be reached.
 */
export async function getQueueHealth(): Promise<QueueHealth[]> {
  const queueNames = [
    QueueName.AuditURL,
    QueueName.AuditCode,
    QueueName.Notifications,
    QueueName.Exports,
    QueueName.Scheduled,
  ] as const;

  const results: QueueHealth[] = [];

  for (const name of queueNames) {
    const queue = getQueue(name);
    if (!queue) {
      results.push({
        name,
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        isPaused: false,
      });
      continue;
    }

    try {
      const [waiting, active, completed, failed, delayed, isPaused] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
        queue.isPaused(),
      ]);

      results.push({ name, waiting, active, completed, failed, delayed, isPaused });
    } catch {
      results.push({
        name,
        waiting: -1,
        active: -1,
        completed: -1,
        failed: -1,
        delayed: -1,
        isPaused: false,
      });
    }
  }

  return results;
}

/**
 * Get total depth across all queues (waiting + active + delayed).
 */
export async function getTotalQueueDepth(): Promise<number> {
  const health = await getQueueHealth();
  return health.reduce(
    (sum, q) => sum + Math.max(0, q.waiting) + Math.max(0, q.active) + Math.max(0, q.delayed),
    0,
  );
}

/**
 * Graceful shutdown helpers.
 * - closeAllQueues: close just the queue connections.
 * - closeAllWorkers: close just the workers (drain in-flight jobs).
 * - closeAll: workers first, then queues — the standard shutdown entry point.
 */
export { closeAllQueues, closeAllWorkers, closeAll } from "./queue.js";
