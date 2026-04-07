import { Redis } from "ioredis";

import type {
  AuditProgressEventMap,
  AuditProgressEventType,
  SSEEnvelope,
  UserEventMap,
  UserEventType,
} from "@audex/types";

// ─── Channel Naming ────────────────────────────────────────────────────────

/**
 * Redis Pub/Sub channel for audit progress events.
 * One channel per audit — workers publish, SSE endpoints subscribe.
 */
export function auditChannel(auditId: string): string {
  return `audex:audit:${auditId}`;
}

/**
 * Redis Pub/Sub channel for user-level events.
 * One channel per user — workers publish, dashboard SSE subscribes.
 */
export function userChannel(userId: string): string {
  return `audex:user:${userId}`;
}

// ─── Subscriber Connection ─────────────────────────────────────────────────

let subscriber: Redis | null = null;

/**
 * Get a dedicated Redis connection for Pub/Sub subscriptions.
 *
 * ioredis requires a separate connection for subscribers because
 * a connection in subscriber mode cannot execute other commands.
 */
function getSubscriber(): Redis | null {
  if (subscriber) return subscriber;

  const url = process.env["REDIS_URL"];
  if (!url) return null;

  const useTls = process.env["REDIS_TLS"] !== "false";

  subscriber = new Redis(url, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    enableReadyCheck: true,
    retryStrategy(times: number) {
      if (times > 10) return null;
      return Math.min(times * 200, 5000);
    },
    ...(useTls ? { tls: {} } : {}),
  });

  subscriber.on("error", (err: Error) => {
    console.error("[infra:pubsub] Subscriber connection error:", err.message);
  });

  return subscriber;
}

// ─── Publisher (Worker Side) ───────────────────────────────────────────────

/**
 * Publish a typed audit progress event.
 *
 * Called by workers during audit processing to notify SSE subscribers.
 * Uses the main Redis connection (not the subscriber).
 */
export async function publishAuditEvent<E extends AuditProgressEventType>(
  redis: Redis,
  auditId: string,
  event: E,
  data: AuditProgressEventMap[E],
): Promise<void> {
  const envelope: SSEEnvelope<E, AuditProgressEventMap[E]> = {
    id: `${auditId}-${Date.now()}`,
    event,
    data,
    timestamp: new Date().toISOString(),
  };

  try {
    await redis.publish(auditChannel(auditId), JSON.stringify(envelope));
  } catch (err) {
    console.error(`[infra:pubsub] Failed to publish ${event}:`, err);
  }
}

/**
 * Publish a typed user event.
 *
 * Called by workers to notify a user's dashboard SSE stream.
 */
export async function publishUserEvent<E extends UserEventType>(
  redis: Redis,
  userId: string,
  event: E,
  data: UserEventMap[E],
): Promise<void> {
  const envelope: SSEEnvelope<E, UserEventMap[E]> = {
    id: `${userId}-${Date.now()}`,
    event,
    data,
    timestamp: new Date().toISOString(),
  };

  try {
    await redis.publish(userChannel(userId), JSON.stringify(envelope));
  } catch (err) {
    console.error(`[infra:pubsub] Failed to publish user event ${event}:`, err);
  }
}

// ─── Subscriber (SSE Endpoint Side) ────────────────────────────────────────

type MessageHandler = (envelope: SSEEnvelope) => void;

/**
 * Subscribe to a Redis Pub/Sub channel.
 *
 * Returns an unsubscribe function for cleanup.
 * The handler receives parsed SSEEnvelope objects.
 */
export async function subscribe(
  channel: string,
  handler: MessageHandler,
): Promise<() => Promise<void>> {
  const sub = getSubscriber();
  if (!sub) {
    // No-op unsubscribe when Redis is unavailable
    return () => Promise.resolve();
  }

  const messageHandler = (ch: string, message: string) => {
    if (ch !== channel) return;
    try {
      const envelope = JSON.parse(message) as SSEEnvelope;
      handler(envelope);
    } catch (err) {
      console.error("[infra:pubsub] Failed to parse message:", err);
    }
  };

  sub.on("message", messageHandler);
  await sub.subscribe(channel);

  return async () => {
    sub.off("message", messageHandler);
    await sub.unsubscribe(channel).catch(() => undefined);
  };
}

/**
 * Subscribe to audit progress events for a specific audit.
 */
export async function subscribeToAudit(
  auditId: string,
  handler: MessageHandler,
): Promise<() => Promise<void>> {
  return subscribe(auditChannel(auditId), handler);
}

/**
 * Subscribe to user events for a specific user.
 */
export async function subscribeToUser(
  userId: string,
  handler: MessageHandler,
): Promise<() => Promise<void>> {
  return subscribe(userChannel(userId), handler);
}

// ─── Cleanup ───────────────────────────────────────────────────────────────

/**
 * Disconnect the subscriber connection (for graceful shutdown).
 */
export async function disconnectSubscriber(): Promise<void> {
  if (subscriber) {
    await subscriber.quit();
    subscriber = null;
  }
}
