import { connectDb, ApiKey } from "@audex/db";

import { getRedis } from "../redis.js";

import { hashApiKey } from "./generate.js";

import type { AuthContext } from "../context.js";
import type { ApiScope, UserRole } from "@audex/types";

/** Cache TTL for valid API keys: 5 minutes */
const CACHE_TTL_SECONDS = 300;

/** Redis key prefix for API key cache */
const CACHE_PREFIX = "apikey:";

/**
 * Cached API key data stored in Redis.
 */
interface CachedKeyData {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  scopes: ApiScope[];
  rateLimit: number;
  keyId: string;
}

/**
 * Result of API key authentication.
 */
export interface ApiKeyAuthResult {
  auth: AuthContext;
  scopes: ApiScope[];
  rateLimit: number;
  keyId: string;
}

/**
 * Authenticate a request using an API key.
 *
 * Flow:
 * 1. Extract key from Authorization header
 * 2. Hash the key (SHA-256)
 * 3. Check Redis cache → return cached data if valid
 * 4. Cache miss → query MongoDB for keyHash
 * 5. Validate: isActive, not expired
 * 6. Populate user data
 * 7. Cache the result in Redis
 * 8. Update lastUsedAt (fire-and-forget)
 *
 * Returns null if authentication fails.
 */
export async function authenticateApiKey(
  authHeader: string | null | undefined,
): Promise<ApiKeyAuthResult | null> {
  // 1. Extract raw key
  const rawKey = extractKeyFromHeader(authHeader);
  if (!rawKey) return null;

  // 2. Hash for lookup
  const keyHash = hashApiKey(rawKey);

  // 3. Check Redis cache
  const cached = await getCachedKey(keyHash);
  if (cached) {
    // Fire-and-forget lastUsedAt update
    void updateLastUsed(cached.keyId);

    return {
      auth: {
        userId: cached.userId,
        email: cached.email,
        name: cached.name,
        role: cached.role,
        emailVerified: null, // API keys don't carry this
      },
      scopes: cached.scopes,
      rateLimit: cached.rateLimit,
      keyId: cached.keyId,
    };
  }

  // 4. Cache miss → query database
  await connectDb();

  const keyDoc = await ApiKey.findOne({ keyHash }).select("+keyHash").populate<{
    userId: { _id: { toString(): string }; email: string; name: string; role: string };
  }>("userId", "email name role");

  if (!keyDoc) return null;

  // 5. Validate state
  if (!keyDoc.isActive) return null;
  if (keyDoc.expiresAt && keyDoc.expiresAt < new Date()) return null;

  // 6. Extract user data from populated field
  const user = keyDoc.userId as unknown as {
    _id: { toString(): string };
    email: string;
    name: string;
    role: UserRole;
  };

  if (!user.email) return null;

  const keyId = keyDoc._id.toString();
  const result: ApiKeyAuthResult = {
    auth: {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: null,
    },
    scopes: keyDoc.scopes as ApiScope[],
    rateLimit: keyDoc.rateLimit,
    keyId,
  };

  // 7. Cache in Redis
  const cacheData: CachedKeyData = {
    userId: result.auth.userId,
    email: result.auth.email,
    name: result.auth.name,
    role: result.auth.role,
    scopes: result.scopes,
    rateLimit: result.rateLimit,
    keyId,
  };
  void cacheKey(keyHash, cacheData);

  // 8. Update lastUsedAt
  void updateLastUsed(keyId);

  return result;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extract Bearer token from Authorization header.
 * Accepts: `Bearer audex_sk_...` or raw `audex_sk_...`
 */
function extractKeyFromHeader(header: string | null | undefined): string | null {
  if (!header) return null;

  const trimmed = header.trim();

  if (trimmed.startsWith("Bearer ")) {
    const key = trimmed.slice(7).trim();
    return key.startsWith("audex_sk_") ? key : null;
  }

  return trimmed.startsWith("audex_sk_") ? trimmed : null;
}

/**
 * Check Redis for a cached API key.
 */
async function getCachedKey(keyHash: string): Promise<CachedKeyData | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const data = await redis.get(`${CACHE_PREFIX}${keyHash}`);
    if (!data) return null;
    return JSON.parse(data) as CachedKeyData;
  } catch {
    return null;
  }
}

/**
 * Cache an API key in Redis.
 */
async function cacheKey(keyHash: string, data: CachedKeyData): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(`${CACHE_PREFIX}${keyHash}`, JSON.stringify(data), "EX", CACHE_TTL_SECONDS);
  } catch {
    // Cache write failure is non-fatal
  }
}

/**
 * Update lastUsedAt in the database (fire-and-forget).
 */
async function updateLastUsed(keyId: string): Promise<void> {
  try {
    await connectDb();
    await ApiKey.findByIdAndUpdate(keyId, { lastUsedAt: new Date() });
  } catch {
    // Non-critical — don't fail the request
  }
}
