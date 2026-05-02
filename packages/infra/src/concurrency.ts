import { PLAN_LIMITS } from "@audex/types";

import { createLogger } from "./logger.js";
import { getRedis } from "./redis.js";

import type { PlanTier } from "@audex/types";

const log = createLogger({ module: "concurrency" });

// ─── Config ────────────────────────────────────────────────────────────────

/** Redis key prefix for concurrent audit slots */
const SLOT_PREFIX = "concurrent:audit:";

/** Safety TTL: auto-release slot after 5 minutes if not explicitly released */
const SLOT_TTL_SECONDS = 300;

// ─── Concurrent Limiter ────────────────────────────────────────────────────

export interface ConcurrencyResult {
  /** Whether a slot was acquired */
  acquired: boolean;
  /** Current active count (after acquire attempt) */
  active: number;
  /** Maximum allowed for this tier */
  limit: number;
}

/**
 * Acquire a concurrent audit slot for a user.
 *
 * Uses a Redis SET with per-member TTL pattern:
 * - Key: `concurrent:audit:{userId}`
 * - Members: audit IDs
 * - Each member has an independent expiry via a companion key
 *
 * The slot auto-expires after 5 minutes as a safety net
 * (in case release is never called due to crash).
 *
 * @param userId - The user requesting the slot
 * @param auditId - Unique audit ID for this slot
 * @param tier - User's plan tier (determines max concurrent)
 * @returns ConcurrencyResult with acquired status
 */
export async function acquireAuditSlot(
  userId: string,
  auditId: string,
  tier: PlanTier,
): Promise<ConcurrencyResult> {
  const limit = PLAN_LIMITS[tier].concurrentAudits;
  const redis = getRedis();

  if (!redis) {
    // Fail open
    return { acquired: true, active: 0, limit };
  }

  const setKey = `${SLOT_PREFIX}${userId}`;
  const memberKey = `${SLOT_PREFIX}${userId}:${auditId}`;

  try {
    // Clean up expired members first
    await cleanupExpiredSlots(userId);

    // Check current count
    const active = await redis.scard(setKey);

    if (active >= limit) {
      return { acquired: false, active, limit };
    }

    // Acquire: add to set + set companion TTL key
    await redis.sadd(setKey, auditId);
    await redis.set(memberKey, "1", "EX", SLOT_TTL_SECONDS);

    // Set TTL on the set itself (cleanup if all members expire)
    await redis.expire(setKey, SLOT_TTL_SECONDS + 60);

    return { acquired: true, active: active + 1, limit };
  } catch (err) {
    // Intentionally fail open — see rate-limit.ts for the reasoning.
    log.error({ err, userId, auditId }, "Failed to acquire slot; concurrency failing open");
    return { acquired: true, active: 0, limit };
  }
}

/**
 * Release a concurrent audit slot.
 *
 * Called when an audit completes, fails, or is cancelled.
 */
export async function releaseAuditSlot(userId: string, auditId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const setKey = `${SLOT_PREFIX}${userId}`;
  const memberKey = `${SLOT_PREFIX}${userId}:${auditId}`;

  try {
    await redis.srem(setKey, auditId);
    await redis.del(memberKey);
  } catch (err) {
    log.error({ err, userId, auditId }, "Failed to release slot");
  }
}

/**
 * Get the current number of active audit slots for a user.
 */
export async function getActiveSlotCount(userId: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  try {
    await cleanupExpiredSlots(userId);
    return await redis.scard(`${SLOT_PREFIX}${userId}`);
  } catch {
    return 0;
  }
}

/**
 * Get active audit IDs for a user.
 */
export async function getActiveAuditIds(userId: string): Promise<string[]> {
  const redis = getRedis();
  if (!redis) return [];

  try {
    await cleanupExpiredSlots(userId);
    return await redis.smembers(`${SLOT_PREFIX}${userId}`);
  } catch {
    return [];
  }
}

// ─── Internal ──────────────────────────────────────────────────────────────

/**
 * Remove members whose companion TTL key has expired.
 * This handles cases where release was never called (worker crash).
 */
async function cleanupExpiredSlots(userId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const setKey = `${SLOT_PREFIX}${userId}`;
  const members = await redis.smembers(setKey);

  if (members.length === 0) return;

  // Check which companion keys still exist
  const pipeline = redis.pipeline();
  for (const member of members) {
    pipeline.exists(`${SLOT_PREFIX}${userId}:${member}`);
  }
  const results = await pipeline.exec();
  if (!results) return;

  // Remove members whose companion key expired
  const expired: string[] = [];
  for (let i = 0; i < members.length; i++) {
    const [err, exists] = results[i] ?? [];
    const member = members[i];
    if (!err && exists === 0 && member) {
      expired.push(member);
    }
  }

  if (expired.length > 0) {
    await redis.srem(setKey, ...expired);
  }
}
