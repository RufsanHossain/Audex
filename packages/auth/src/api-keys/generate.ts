import { createHash, randomBytes } from "node:crypto";

import { connectDb, ApiKey } from "@audex/db";

import type { ApiScope } from "@audex/types";

/** Prefix for all Audex API keys — helps identify leaked keys */
const KEY_PREFIX = "audex_sk_";

/** Length of the random portion (32 bytes = 256 bits) */
const KEY_BYTES = 32;

/**
 * Result of key generation.
 * `rawKey` is returned ONCE to the user and never stored.
 */
export interface GeneratedApiKey {
  /** The full key to display to the user (only shown once) */
  rawKey: string;
  /** First 8 chars for identification in UI */
  keyPrefix: string;
  /** The database document ID */
  keyId: string;
}

/**
 * Generate a new API key for a user.
 *
 * Flow:
 * 1. Generate 32 random bytes → hex string
 * 2. Prepend `audex_sk_` prefix
 * 3. SHA-256 hash the full key for storage
 * 4. Store hash + prefix + metadata in MongoDB
 * 5. Return raw key (shown once) + metadata
 */
export async function generateApiKey(params: {
  userId: string;
  name: string;
  scopes: ApiScope[];
  rateLimit?: number;
  expiresInDays?: number;
}): Promise<GeneratedApiKey> {
  const { userId, name, scopes, rateLimit = 100, expiresInDays } = params;

  // 1. Generate random key
  const randomPart = randomBytes(KEY_BYTES).toString("hex");
  const rawKey = `${KEY_PREFIX}${randomPart}`;

  // 2. Hash for storage (SHA-256, one-way)
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  // 3. Extract prefix for display (first 8 chars after audex_sk_)
  const keyPrefix = `${KEY_PREFIX}${randomPart.slice(0, 8)}`;

  // 4. Calculate expiration
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : undefined;

  // 5. Persist to database
  await connectDb();

  const doc = await ApiKey.create({
    userId,
    name,
    keyHash,
    keyPrefix,
    scopes,
    rateLimit,
    expiresAt,
    isActive: true,
  });

  return {
    rawKey,
    keyPrefix,
    keyId: doc._id.toString(),
  };
}

/**
 * Hash a raw API key for lookup.
 * Used by authenticateApiKey() to find the key in the database.
 */
export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}
