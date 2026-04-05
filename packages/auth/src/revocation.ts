import { getRedis } from "@audex/infra/redis";

/**
 * Redis key for individual token revocation set.
 * Sorted set: member = JWT ID (jti), score = expiration timestamp.
 */
const REVOKED_TOKENS_KEY = "auth:revoked:tokens";

/**
 * Redis key prefix for per-user epoch revocation.
 * String: value = epoch timestamp. All tokens issued before this are invalid.
 */
const USER_EPOCH_PREFIX = "auth:epoch:";

/**
 * Default TTL for epoch keys: 31 days.
 * Slightly longer than max session duration (30 days) to cover edge cases.
 */
const EPOCH_TTL_SECONDS = 31 * 24 * 60 * 60;

// ── Individual Token Revocation ─────────────────────────────────────────────

/**
 * Revoke a specific JWT by its ID (jti).
 *
 * The token is added to a Redis sorted set with its expiration time as the score.
 * This allows automatic cleanup of expired entries.
 *
 * @param jti - JWT ID (unique identifier for the token)
 * @param expiresAt - Token expiration timestamp (seconds since epoch)
 */
export async function revokeToken(jti: string, expiresAt: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.zadd(REVOKED_TOKENS_KEY, expiresAt, jti);
  } catch (err) {
    console.error("[auth:revocation] Failed to revoke token:", err);
  }
}

/**
 * Check if a specific JWT has been individually revoked.
 */
export async function isTokenRevoked(jti: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false; // Fail open if Redis is unavailable

  try {
    const score = await redis.zscore(REVOKED_TOKENS_KEY, jti);
    return score !== null;
  } catch {
    return false; // Fail open
  }
}

// ── Per-User Epoch Revocation (Force-Logout All) ────────────────────────────

/**
 * Revoke ALL sessions for a user by setting a revocation epoch.
 *
 * Any JWT issued before this epoch is considered invalid.
 * Use cases:
 * - Password change
 * - Account compromise
 * - User-initiated "sign out everywhere"
 *
 * @param userId - The user's ID
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const epoch = Math.floor(Date.now() / 1000);

  try {
    await redis.set(`${USER_EPOCH_PREFIX}${userId}`, epoch.toString(), "EX", EPOCH_TTL_SECONDS);
  } catch (err) {
    console.error("[auth:revocation] Failed to set user epoch:", err);
  }
}

/**
 * Check if a token was issued before the user's revocation epoch.
 *
 * @param userId - The user's ID
 * @param issuedAt - Token issued-at timestamp (seconds since epoch)
 * @returns true if the token is revoked (issued before epoch)
 */
export async function isTokenBeforeEpoch(userId: string, issuedAt: number): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false; // Fail open

  try {
    const epoch = await redis.get(`${USER_EPOCH_PREFIX}${userId}`);
    if (!epoch) return false;
    return issuedAt < Number(epoch);
  } catch {
    return false; // Fail open
  }
}

// ── Combined Check ──────────────────────────────────────────────────────────

/**
 * Check if a JWT should be rejected.
 *
 * Performs both:
 * 1. Individual token revocation check (by jti)
 * 2. Per-user epoch check (by userId + iat)
 *
 * Usage in JWT callback:
 *   const revoked = await isSessionRevoked({ jti: token.jti, userId: token.id, issuedAt: token.iat });
 *   if (revoked) return null; // Force re-authentication
 */
export async function isSessionRevoked(params: {
  jti?: string;
  userId: string;
  issuedAt: number;
}): Promise<boolean> {
  const { jti, userId, issuedAt } = params;

  // Check both in parallel for speed
  const [tokenRevoked, epochRevoked] = await Promise.all([
    jti ? isTokenRevoked(jti) : Promise.resolve(false),
    isTokenBeforeEpoch(userId, issuedAt),
  ]);

  return tokenRevoked || epochRevoked;
}

// ── Cleanup ─────────────────────────────────────────────────────────────────

/**
 * Remove expired entries from the revoked tokens sorted set.
 *
 * Tokens naturally expire, so their revocation entries become stale.
 * This prevents the sorted set from growing unbounded.
 *
 * Should be called periodically (e.g., every hour via a scheduled job).
 *
 * @returns Number of entries removed
 */
export async function cleanupExpiredRevocations(): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  const now = Math.floor(Date.now() / 1000);

  try {
    // Remove all entries with score (expiration) <= now
    const removed = await redis.zremrangebyscore(REVOKED_TOKENS_KEY, "-inf", now);
    if (removed > 0) {
      console.log(`[auth:revocation] Cleaned up ${removed} expired revocations`);
    }
    return removed;
  } catch (err) {
    console.error("[auth:revocation] Cleanup failed:", err);
    return 0;
  }
}
