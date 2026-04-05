import { Redis, type RedisOptions } from "ioredis";

let redis: Redis | null = null;

/**
 * Default Redis options for all Audex services.
 * TLS enabled by default (Upstash requires it).
 * maxRetriesPerRequest: null required for BullMQ compatibility.
 */
function getDefaultOptions(): RedisOptions {
  const useTls = process.env["REDIS_TLS"] !== "false";

  return {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    enableReadyCheck: true,
    retryStrategy(times: number) {
      if (times > 10) return null;
      return Math.min(times * 200, 5000);
    },
    reconnectOnError(err: Error) {
      return err.message.includes("READONLY");
    },
    ...(useTls ? { tls: {} } : {}),
  };
}

/**
 * Lazy singleton Redis client shared across all Audex packages.
 * Returns null if REDIS_URL is not set (graceful degradation).
 */
export function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env["REDIS_URL"];
  if (!url) return null;

  redis = new Redis(url, getDefaultOptions());

  redis.on("error", (err: Error) => {
    console.error("[infra:redis] Connection error:", err.message);
  });

  return redis;
}

/**
 * Health check — returns latency in ms or null if unavailable.
 */
export async function pingRedis(): Promise<number | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const start = Date.now();
    await client.ping();
    return Date.now() - start;
  } catch {
    return null;
  }
}

/**
 * Disconnect Redis client (for graceful shutdown).
 */
export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
