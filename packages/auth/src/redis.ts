import { Redis } from "ioredis";

let redis: Redis | null = null;

/**
 * Lazy singleton Redis client for auth caching.
 * Uses REDIS_URL from environment.
 *
 * Returns null if REDIS_URL is not set (graceful degradation).
 */
export function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env["REDIS_URL"];
  if (!url) return null;

  redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableReadyCheck: true,
  });

  redis.on("error", (err: Error) => {
    console.error("[auth:redis] Connection error:", err.message);
  });

  return redis;
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
