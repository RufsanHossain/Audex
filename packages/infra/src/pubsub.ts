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

// Per-channel handler registry. Multiple subscribe() calls for the same
// channel share a single Redis-level subscription and fan out via this map;
// the channel is only unsubscribed at the Redis level when its handler set
// becomes empty.
const channelHandlers = new Map<string, Set<MessageHandler>>();

function dispatchMessage(channel: string, message: string): void {
  const handlers = channelHandlers.get(channel);
  if (!handlers || handlers.size === 0) return;

  let envelope: SSEEnvelope;
  try {
    envelope = JSON.parse(message) as SSEEnvelope;
  } catch (err) {
    console.error("[infra:pubsub] Failed to parse message:", err);
    return;
  }

  // Snapshot handlers in case one of them unsubscribes synchronously.
  for (const handler of [...handlers]) {
    try {
      handler(envelope);
    } catch (err) {
      console.error("[infra:pubsub] Handler threw:", err);
    }
  }
}

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

  // Single shared dispatcher — keeps EventEmitter listener count at 1
  // regardless of how many subscribe() calls are active.
  subscriber.on("message", dispatchMessage);

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
 *
 * Multiple subscribe() calls for the same channel share a single
 * Redis-level subscription. The channel is only unsubscribed at the
 * Redis level when the last handler removes itself.
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

  let handlers = channelHandlers.get(channel);
  const isFirstHandler = !handlers || handlers.size === 0;
  if (!handlers) {
    handlers = new Set<MessageHandler>();
    channelHandlers.set(channel, handlers);
  }
  handlers.add(handler);

  // Only issue the Redis-level subscribe on the transition 0 → 1.
  if (isFirstHandler) {
    await sub.subscribe(channel);
  }

  return async () => {
    const set = channelHandlers.get(channel);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) {
      channelHandlers.delete(channel);
      await sub.unsubscribe(channel).catch(() => undefined);
    }
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
  channelHandlers.clear();
  if (subscriber) {
    await subscriber.quit();
    subscriber = null;
  }
}
