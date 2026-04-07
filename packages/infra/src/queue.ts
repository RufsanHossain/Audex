import {
  Queue,
  Worker,
  type ConnectionOptions,
  type Job,
  type JobsOptions,
  type WorkerOptions,
} from "bullmq";

import type {
  CodeAuditJobData,
  ExportJobData,
  NotificationJobData,
  PlanTier,
  QueueName,
  ScheduledJobData,
  URLAuditJobData,
} from "@audex/types";

// ─── Connection ────────────────────────────────────────────────────────────

/**
 * Build Redis connection options for BullMQ.
 * Reads REDIS_URL from environment. Returns null if not set.
 */
export function getQueueConnection(): ConnectionOptions | null {
  const url = process.env["REDIS_URL"];
  if (!url) return null;

  const useTls = process.env["REDIS_TLS"] !== "false";
  const parsed = new URL(url);

  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    password: parsed.password || undefined,
    username: parsed.username || undefined,
    ...(useTls ? { tls: {} } : {}),
    maxRetriesPerRequest: null,
  };
}

// ─── Queue Map (type-safe job data per queue) ──────────────────────────────

/** Maps queue name to its job data type */
interface QueueJobDataMap {
  "audit:url": URLAuditJobData;
  "audit:code": CodeAuditJobData;
  notifications: NotificationJobData;
  exports: ExportJobData;
  scheduled: ScheduledJobData;
}

// ─── Default Options Per Queue ─────────────────────────────────────────────

const defaultJobOptions: Record<QueueName, JobsOptions> = {
  "audit:url": {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
  "audit:code": {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
  notifications: {
    attempts: 5,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 2000 },
  },
  exports: {
    attempts: 2,
    backoff: { type: "fixed", delay: 5000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 1000 },
  },
  scheduled: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
};

// ─── Queue Factory ─────────────────────────────────────────────────────────

const queues = new Map<string, Queue>();

/**
 * Get or create a typed BullMQ queue.
 *
 * Queues are singletons — calling with the same name returns the same instance.
 * Returns null if Redis is not configured.
 */
export function getQueue<N extends QueueName>(name: N): Queue<QueueJobDataMap[N]> | null {
  const existing = queues.get(name);
  if (existing) return existing as Queue<QueueJobDataMap[N]>;

  const connection = getQueueConnection();
  if (!connection) return null;

  const queue = new Queue<QueueJobDataMap[N]>(name, {
    connection,
    defaultJobOptions: defaultJobOptions[name],
  });

  queues.set(name, queue as Queue);
  return queue;
}

// ─── Worker Factory ────────────────────────────────────────────────────────

/**
 * Create a typed BullMQ worker for a specific queue.
 *
 * Unlike queues, workers are NOT singletons — each call creates a new worker.
 * The caller is responsible for worker lifecycle (close on shutdown).
 */
export function createWorker<N extends QueueName>(
  name: N,
  processor: (job: Job<QueueJobDataMap[N]>) => Promise<void>,
  options?: Partial<WorkerOptions>,
): Worker<QueueJobDataMap[N]> | null {
  const connection = getQueueConnection();
  if (!connection) return null;

  return new Worker<QueueJobDataMap[N]>(name, processor, {
    connection,
    concurrency: 1,
    ...options,
  });
}

// ─── Job Helpers ───────────────────────────────────────────────────────────

/** Plan tier → BullMQ priority (lower = higher priority) */
const PLAN_PRIORITY: Record<PlanTier, number> = {
  enterprise: 1,
  team: 2,
  pro: 3,
  free: 4,
};

/**
 * Get BullMQ job priority based on plan tier.
 * Enterprise jobs process before free-tier jobs.
 */
export function getPlanPriority(planTier: PlanTier): number {
  return PLAN_PRIORITY[planTier];
}

/**
 * Add a typed job to a queue with plan-based priority.
 *
 * Convenience wrapper that handles queue creation + priority.
 * Returns the job ID or null if Redis is unavailable.
 */
export async function addJob<N extends QueueName>(
  queueName: N,
  jobName: string,
  data: QueueJobDataMap[N],
  options?: JobsOptions & { planTier?: PlanTier },
): Promise<string | null> {
  const connection = getQueueConnection();
  if (!connection) return null;

  // Use an untyped queue for the add() call to avoid BullMQ's
  // ExtractNameType/ExtractDataType constraints on generic wrappers.
  const raw = queues.get(queueName) ?? new Queue(queueName, { connection });
  if (!queues.has(queueName)) queues.set(queueName, raw);

  const { planTier, ...jobOptions } = options ?? {};
  const priority = planTier ? getPlanPriority(planTier) : undefined;

  const job = await raw.add(jobName, data, {
    ...defaultJobOptions[queueName],
    ...jobOptions,
    ...(priority !== undefined ? { priority } : {}),
  });

  return job.id ?? null;
}

// ─── Cleanup ───────────────────────────────────────────────────────────────

/**
 * Close all queue connections (for graceful shutdown).
 */
export async function closeAllQueues(): Promise<void> {
  const closePromises = Array.from(queues.values()).map((q) => q.close());
  await Promise.all(closePromises);
  queues.clear();
}
