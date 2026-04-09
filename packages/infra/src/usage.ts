import { PLAN_LIMITS } from "@audex/types";

import { getRedis } from "./redis.js";

import type { PlanTier } from "@audex/types";

// ─── Config ────────────────────────────────────────────────────────────────

/** Redis key prefix for monthly audit usage counters */
const USAGE_PREFIX = "usage:audits:";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface UsageInfo {
  /** Audits used in current period */
  used: number;
  /** Maximum allowed for this tier */
  limit: number;
  /** Remaining audits */
  remaining: number;
  /** Whether the limit has been reached */
  exceeded: boolean;
  /** Percent used (0-100) */
  percentUsed: number;
  /** When the current period resets (ISO string) */
  resetDate: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Build the Redis key for a user's monthly usage.
 * Key includes year-month so it naturally partitions per billing period.
 *
 * Format: `usage:audits:{userId}:{YYYY-MM}`
 */
function usageKey(userId: string, date?: Date): string {
  const d = date ?? new Date();
  const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `${USAGE_PREFIX}${userId}:${month}`;
}

/**
 * Get the reset date (first day of next month at midnight UTC).
 */
function getResetDate(date?: Date): Date {
  const d = date ?? new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 1));
}

/**
 * Seconds remaining until the reset date.
 */
function secondsUntilReset(date?: Date): number {
  const reset = getResetDate(date);
  return Math.max(0, Math.ceil((reset.getTime() - Date.now()) / 1000));
}

// ─── Core Functions ────────────────────────────────────────────────────────

/**
 * Get current audit usage for a user.
 *
 * Reads from Redis for speed. The Redis counter is the source of truth
 * for the current billing period, synced from MongoDB Subscription
 * on period boundaries via Stripe webhooks.
 */
export async function getUsage(userId: string, tier: PlanTier): Promise<UsageInfo> {
  const limit = PLAN_LIMITS[tier].auditsPerMonth;
  const resetDate = getResetDate();

  // Unlimited plans
  if (limit === Infinity || limit <= 0) {
    return {
      used: 0,
      limit: Infinity,
      remaining: Infinity,
      exceeded: false,
      percentUsed: 0,
      resetDate: resetDate.toISOString(),
    };
  }

  const redis = getRedis();
  if (!redis) {
    // Fail open — allow if Redis unavailable
    return {
      used: 0,
      limit,
      remaining: limit,
      exceeded: false,
      percentUsed: 0,
      resetDate: resetDate.toISOString(),
    };
  }

  try {
    const key = usageKey(userId);
    const raw = await redis.get(key);
    const used = raw ? Number(raw) : 0;
    const remaining = Math.max(0, limit - used);

    return {
      used,
      limit,
      remaining,
      exceeded: used >= limit,
      percentUsed: Math.min(100, Math.round((used / limit) * 100)),
      resetDate: resetDate.toISOString(),
    };
  } catch {
    return {
      used: 0,
      limit,
      remaining: limit,
      exceeded: false,
      percentUsed: 0,
      resetDate: resetDate.toISOString(),
    };
  }
}

/**
 * Increment the audit usage counter for a user.
 *
 * Called when a new audit is created. The key auto-expires
 * at the end of the billing period (first of next month).
 *
 * @returns The new count after incrementing, or null on failure
 */
export async function incrementUsage(userId: string): Promise<number | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const key = usageKey(userId);
    const count = await redis.incr(key);

    // Set TTL to expire at period reset (idempotent — safe to call multiple times)
    const ttl = secondsUntilReset();
    if (ttl > 0) {
      await redis.expire(key, ttl);
    }

    return count;
  } catch (err) {
    console.error("[infra:usage] Failed to increment usage:", err);
    return null;
  }
}

/**
 * Check if a user can create a new audit (within their plan limit).
 *
 * Convenience function that combines getUsage + limit check.
 * Returns the usage info for display purposes.
 */
export async function canCreateAudit(userId: string, tier: PlanTier): Promise<UsageInfo> {
  return getUsage(userId, tier);
}

/**
 * Reset the usage counter for a user.
 *
 * Called by Stripe webhook when billing period renews,
 * or by the scheduled usage-reset job as a fallback.
 */
export async function resetUsage(userId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    const key = usageKey(userId);
    await redis.del(key);
  } catch (err) {
    console.error("[infra:usage] Failed to reset usage:", err);
  }
}

/**
 * Set the usage counter to a specific value.
 *
 * Used for reconciliation: sync Redis counter with MongoDB Subscription
 * when they drift (e.g., after Redis restart).
 */
export async function setUsage(userId: string, count: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    const key = usageKey(userId);
    await redis.set(key, count.toString());

    const ttl = secondsUntilReset();
    if (ttl > 0) {
      await redis.expire(key, ttl);
    }
  } catch (err) {
    console.error("[infra:usage] Failed to set usage:", err);
  }
}
