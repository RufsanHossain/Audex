import { PlanTier } from "@audex/types";

import { getRedis } from "./redis.js";

// ─── Config ────────────────────────────────────────────────────────────────

/** API calls per minute by plan tier */
const TIER_LIMITS: Record<PlanTier, number> = {
  [PlanTier.Free]: 10,
  [PlanTier.Pro]: 60,
  [PlanTier.Team]: 120,
  [PlanTier.Enterprise]: 300,
};

/** Default window size in seconds */
const DEFAULT_WINDOW_SECONDS = 60;

// ─── Lua Script ────────────────────────────────────────────────────────────

/**
 * Sliding window rate limiter using Redis sorted sets.
 *
 * Atomic Lua script that:
 * 1. Removes expired entries (older than window)
 * 2. Counts remaining entries
 * 3. If under limit, adds new entry
 * 4. Sets TTL on the key for auto-cleanup
 * 5. Returns [allowed (0/1), remaining, resetAtMs]
 */
const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]

-- Remove expired entries
local windowStart = now - window * 1000
redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

-- Count current entries
local count = redis.call('ZCARD', key)

if count < limit then
  -- Under limit: add entry and allow
  redis.call('ZADD', key, now, member)
  redis.call('PEXPIRE', key, window * 1000 + 1000)
  return {1, limit - count - 1, now + window * 1000}
else
  -- Over limit: find when oldest entry expires
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local resetAt = 0
  if #oldest >= 2 then
    resetAt = tonumber(oldest[2]) + window * 1000
  end
  return {0, 0, resetAt}
end
`;

// ─── Rate Limiter ──────────────────────────────────────────────────────────

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining requests in current window */
  remaining: number;
  /** Timestamp (ms) when the limit resets */
  resetAt: number;
  /** Limit for this tier */
  limit: number;
  /** Seconds to wait before retrying (0 if allowed) */
  retryAfterSeconds: number;
}

/**
 * Check and consume a rate limit slot.
 *
 * Uses a sliding window algorithm with Redis sorted sets + Lua for atomicity.
 * Each request is a member scored by timestamp. Entries older than the window
 * are pruned on each check.
 *
 * @param key - Rate limit key (e.g., `ratelimit:api:{userId}`)
 * @param limit - Maximum requests per window
 * @param windowSeconds - Window size in seconds (default: 60)
 * @returns RateLimitResult with allowed, remaining, resetAt, retryAfterSeconds
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number = DEFAULT_WINDOW_SECONDS,
): Promise<RateLimitResult> {
  const redis = getRedis();
  if (!redis) {
    // Fail open if Redis unavailable
    return { allowed: true, remaining: limit, resetAt: 0, limit, retryAfterSeconds: 0 };
  }

  const now = Date.now();
  const member = `${now}:${Math.random().toString(36).slice(2, 8)}`;

  try {
    const result = (await redis.eval(
      SLIDING_WINDOW_LUA,
      1,
      key,
      now.toString(),
      windowSeconds.toString(),
      limit.toString(),
      member,
    )) as [number, number, number];

    const [allowed, remaining, resetAt] = result;
    const retryAfterSeconds = allowed ? 0 : Math.max(0, Math.ceil((resetAt - now) / 1000));

    return {
      allowed: allowed === 1,
      remaining,
      resetAt,
      limit,
      retryAfterSeconds,
    };
  } catch (err) {
    console.error("[infra:rate-limit] Lua eval failed:", err);
    // Fail open
    return { allowed: true, remaining: limit, resetAt: 0, limit, retryAfterSeconds: 0 };
  }
}

/**
 * Check rate limit without consuming a slot (read-only peek).
 *
 * Useful for displaying remaining quota in the UI.
 */
export async function peekRateLimit(
  key: string,
  limit: number,
  windowSeconds: number = DEFAULT_WINDOW_SECONDS,
): Promise<{ remaining: number; resetAt: number }> {
  const redis = getRedis();
  if (!redis) return { remaining: limit, resetAt: 0 };

  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  try {
    await redis.zremrangebyscore(key, "-inf", windowStart);
    const count = await redis.zcard(key);
    const remaining = Math.max(0, limit - count);

    const oldest = await redis.zrange(key, 0, 0, "WITHSCORES");
    const resetAt = oldest.length >= 2 ? Number(oldest[1]) + windowSeconds * 1000 : 0;

    return { remaining, resetAt };
  } catch {
    return { remaining: limit, resetAt: 0 };
  }
}

// ─── Tier-Based Helpers ────────────────────────────────────────────────────

/**
 * Get the API rate limit for a plan tier.
 */
export function getTierLimit(tier: PlanTier): number {
  return TIER_LIMITS[tier];
}

/**
 * Check API rate limit for a user based on their plan tier.
 *
 * Key format: `ratelimit:api:{userId}`
 */
export async function checkApiRateLimit(userId: string, tier: PlanTier): Promise<RateLimitResult> {
  const limit = TIER_LIMITS[tier];
  return checkRateLimit(`ratelimit:api:${userId}`, limit);
}

/**
 * Check auth endpoint rate limit per IP.
 *
 * Fixed: 5 attempts per minute regardless of plan.
 * Key format: `ratelimit:auth:{ip}`
 */
export async function checkAuthRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(`ratelimit:auth:${ip}`, 5);
}

// ─── HTTP Header Helpers ───────────────────────────────────────────────────

/**
 * Generate standard rate limit HTTP headers.
 *
 * Headers follow the IETF RateLimit draft (RFC 9110):
 * - RateLimit-Limit: max requests per window
 * - RateLimit-Remaining: remaining in current window
 * - RateLimit-Reset: seconds until window resets
 * - Retry-After: seconds to wait (only on 429)
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "RateLimit-Limit": result.limit.toString(),
    "RateLimit-Remaining": result.remaining.toString(),
    "RateLimit-Reset": Math.max(0, Math.ceil((result.resetAt - Date.now()) / 1000)).toString(),
  };

  if (!result.allowed) {
    headers["Retry-After"] = result.retryAfterSeconds.toString();
  }

  return headers;
}
