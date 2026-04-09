import { createLogger } from "@audex/infra/logger";
import { subscribeToAudit, subscribeToUser } from "@audex/infra/pubsub";
import { getRedis } from "@audex/infra/redis";
import { PLAN_LIMITS } from "@audex/types";

import type { PlanTier, SSEEnvelope } from "@audex/types";

const log = createLogger({ module: "sse" });

// ─── Connection Tracking ───────────────────────────────────────────────────

const CONNECTION_PREFIX = "sse:connections:";

/**
 * Check if a user can open a new SSE connection based on plan limits.
 */
async function canConnect(
  userId: string,
  streamType: "audit" | "user",
  tier: PlanTier,
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true; // Fail open

  const limits = PLAN_LIMITS[tier].sseConnections;
  const maxForType = streamType === "audit" ? limits.auditStreams : limits.userEventStreams;

  try {
    const key = `${CONNECTION_PREFIX}${streamType}:${userId}`;
    const count = await redis.scard(key);
    return count < maxForType;
  } catch {
    return true; // Fail open
  }
}

/**
 * Register an active SSE connection.
 * Returns a cleanup function to call on disconnect.
 */
async function trackConnection(
  userId: string,
  streamType: "audit" | "user",
  connectionId: string,
  tier: PlanTier,
): Promise<() => Promise<void>> {
  const redis = getRedis();
  if (!redis) return () => Promise.resolve();

  const limits = PLAN_LIMITS[tier].sseConnections;
  const key = `${CONNECTION_PREFIX}${streamType}:${userId}`;

  try {
    await redis.sadd(key, connectionId);
    await redis.expire(key, limits.maxDurationSeconds + 60);
  } catch {
    // Non-fatal
  }

  return async () => {
    try {
      await redis.srem(key, connectionId);
    } catch {
      // Non-fatal
    }
  };
}

// ─── SSE Writer ────────────────────────────────────────────────────────────

/**
 * Format an SSEEnvelope as a Server-Sent Events message string.
 */
function formatSSE(envelope: SSEEnvelope): string {
  const lines: string[] = [];
  lines.push(`id: ${envelope.id}`);
  lines.push(`event: ${envelope.event}`);
  lines.push(`data: ${JSON.stringify(envelope.data)}`);
  lines.push(""); // Blank line terminates the event
  return lines.join("\n") + "\n";
}

/**
 * Send a heartbeat SSE event.
 */
function formatHeartbeat(): string {
  return formatSSE({
    id: `hb-${Date.now()}`,
    event: "heartbeat",
    data: { serverTime: new Date().toISOString() },
    timestamp: new Date().toISOString(),
  });
}

// ─── SSE Stream Creators ───────────────────────────────────────────────────

export interface SSEStreamOptions {
  userId: string;
  tier: PlanTier;
  /** Called to write data to the response */
  write: (chunk: string) => void;
  /** Called when the stream should close */
  close: () => void;
  /** AbortSignal from the request (client disconnect) */
  signal?: AbortSignal;
}

/**
 * Create an SSE stream for audit progress events.
 *
 * Subscribes to the audit's Redis Pub/Sub channel and forwards events
 * to the HTTP response as Server-Sent Events.
 *
 * @returns Object with cleanup function, or null if connection limit exceeded
 */
export async function createAuditStream(
  auditId: string,
  options: SSEStreamOptions,
): Promise<{ cleanup: () => Promise<void> } | null> {
  const { userId, tier, write, close, signal } = options;

  // Check connection limit
  const allowed = await canConnect(userId, "audit", tier);
  if (!allowed) return null;

  const connectionId = `${auditId}-${Date.now()}`;

  // Track connection
  const untrack = await trackConnection(userId, "audit", connectionId, tier);

  // Subscribe to audit events
  const unsubscribe = await subscribeToAudit(auditId, (envelope) => {
    try {
      write(formatSSE(envelope));
    } catch {
      // Write failed — client disconnected
    }
  });

  // Heartbeat interval (30s)
  const heartbeatInterval = setInterval(() => {
    try {
      write(formatHeartbeat());
    } catch {
      // Write failed — will be caught by disconnect
    }
  }, 30_000);

  // Max duration timeout
  const limits = PLAN_LIMITS[tier].sseConnections;
  const maxDurationTimeout = setTimeout(() => {
    void cleanup();
    close();
  }, limits.maxDurationSeconds * 1000);

  // Cleanup function
  const cleanup = async () => {
    clearInterval(heartbeatInterval);
    clearTimeout(maxDurationTimeout);
    await unsubscribe();
    await untrack();
    log.debug({ auditId, userId, connectionId }, "Audit SSE stream closed");
  };

  // Handle client disconnect
  if (signal) {
    signal.addEventListener(
      "abort",
      () => {
        void cleanup();
      },
      { once: true },
    );
  }

  // Send initial heartbeat
  write(formatHeartbeat());

  log.debug({ auditId, userId, connectionId, tier }, "Audit SSE stream opened");

  return { cleanup };
}

/**
 * Create an SSE stream for user-level events (dashboard).
 *
 * Subscribes to the user's Redis Pub/Sub channel and forwards events.
 *
 * @returns Object with cleanup function, or null if connection limit exceeded
 */
export async function createUserStream(
  options: SSEStreamOptions,
): Promise<{ cleanup: () => Promise<void> } | null> {
  const { userId, tier, write, close, signal } = options;

  const allowed = await canConnect(userId, "user", tier);
  if (!allowed) return null;

  const connectionId = `user-${userId}-${Date.now()}`;

  const untrack = await trackConnection(userId, "user", connectionId, tier);

  const unsubscribe = await subscribeToUser(userId, (envelope) => {
    try {
      write(formatSSE(envelope));
    } catch {
      // Write failed
    }
  });

  const heartbeatInterval = setInterval(() => {
    try {
      write(formatHeartbeat());
    } catch {
      // Write failed
    }
  }, 30_000);

  const limits = PLAN_LIMITS[tier].sseConnections;
  const maxDurationTimeout = setTimeout(() => {
    void cleanup();
    close();
  }, limits.maxDurationSeconds * 1000);

  const cleanup = async () => {
    clearInterval(heartbeatInterval);
    clearTimeout(maxDurationTimeout);
    await unsubscribe();
    await untrack();
    log.debug({ userId, connectionId }, "User SSE stream closed");
  };

  if (signal) {
    signal.addEventListener(
      "abort",
      () => {
        void cleanup();
      },
      { once: true },
    );
  }

  write(formatHeartbeat());

  log.debug({ userId, connectionId, tier }, "User SSE stream opened");

  return { cleanup };
}

// ─── Late-Join Replay ──────────────────────────────────────────────────────

/**
 * Replay function signature — injected at call site since it requires db access.
 *
 * The caller provides a function that reads current audit state from MongoDB
 * and returns synthetic SSE envelopes to bring the client up to date.
 */
export type ReplayFn = (auditId: string) => Promise<SSEEnvelope[]>;

/**
 * Replay current audit state to a newly connected SSE client.
 *
 * Call this immediately after createAuditStream() to bring late-joiners
 * up to speed with the current audit progress.
 */
export async function replayAuditState(
  auditId: string,
  write: (chunk: string) => void,
  replayFn: ReplayFn,
): Promise<void> {
  try {
    const events = await replayFn(auditId);
    for (const envelope of events) {
      write(formatSSE(envelope));
    }
  } catch (err) {
    log.error({ err, auditId }, "Failed to replay audit state");
  }
}

// ─── SSE Response Headers ──────────────────────────────────────────────────

/**
 * Standard HTTP headers for an SSE response.
 */
export const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
} as const;
