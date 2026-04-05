import { connectDb, ApiKey } from "@audex/db";
import { getRedis } from "@audex/infra/redis";

/** Redis key prefix — must match authenticate.ts */
const CACHE_PREFIX = "apikey:";

/**
 * Revoke an API key by ID.
 *
 * 1. Set isActive = false in MongoDB
 * 2. Invalidate Redis cache (if cached)
 *
 * Returns true if key was found and revoked, false if not found.
 */
export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
  await connectDb();

  // Find and deactivate — only if owned by the user
  const keyDoc = await ApiKey.findOneAndUpdate(
    { _id: keyId, userId, isActive: true },
    { isActive: false },
    { new: true },
  ).select("+keyHash");

  if (!keyDoc) return false;

  // Invalidate cache
  await invalidateKeyCache(keyDoc.keyHash);

  return true;
}

/**
 * Revoke ALL API keys for a user.
 * Used when account is compromised or user requests full key rotation.
 *
 * Returns the number of keys revoked.
 */
export async function revokeAllUserKeys(userId: string): Promise<number> {
  await connectDb();

  // Fetch all active key hashes before deactivating
  const activeKeys = await ApiKey.find({ userId, isActive: true }, { keyHash: 1 }).select(
    "+keyHash",
  );

  if (activeKeys.length === 0) return 0;

  // Bulk deactivate
  const result = await ApiKey.updateMany({ userId, isActive: true }, { isActive: false });

  // Invalidate all from cache
  const invalidations = activeKeys.map((k) => invalidateKeyCache(k.keyHash));
  await Promise.all(invalidations);

  return result.modifiedCount;
}

/**
 * Remove a specific key hash from Redis cache.
 */
async function invalidateKeyCache(keyHash: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.del(`${CACHE_PREFIX}${keyHash}`);
  } catch {
    // Cache invalidation failure is logged but non-fatal
    console.warn("[auth:api-keys] Failed to invalidate cache for key");
  }
}
