import { generateApiKey } from "@audex/auth";
import { ApiKey, connectDb } from "@audex/db";
import { logApiKeyAction } from "@audex/infra";
import { createApiKeySchema, listApiKeysSchema } from "@audex/validators";
import { Types } from "mongoose";

import { jsonCreated, jsonOk, withHandler } from "../../../../lib/api/index.js";

import type { ApiScope } from "@audex/types";
import type { ListApiKeysInput } from "@audex/validators";

// Mongoose + auth() in withHandler — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── POST /api/v1/api-keys ─────────────────────────────────────────────────

/**
 * Create a new API key for the authenticated user.
 *
 * Returns the raw key ONE TIME ONLY — only the SHA-256 hash is stored.
 * Clients must save the raw key immediately; it cannot be recovered.
 */
export const POST = withHandler({ body: createApiKeySchema }, async ({ auth, body, log, req }) => {
  const generated = await generateApiKey({
    userId: auth.userId,
    name: body.name,
    scopes: body.scopes as ApiScope[],
    ...(body.rateLimit !== undefined ? { rateLimit: body.rateLimit } : {}),
    ...(body.expiresInDays !== undefined ? { expiresInDays: body.expiresInDays } : {}),
  });

  const userAgent = req.headers.get("user-agent");
  logApiKeyAction(
    {
      userId: auth.userId,
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      ...(userAgent ? { userAgent } : {}),
    },
    "create",
    { keyId: generated.keyId, name: body.name, scopes: body.scopes },
  );

  log.info({ keyId: generated.keyId, name: body.name }, "API key created");

  return jsonCreated({
    id: generated.keyId,
    name: body.name,
    keyPrefix: generated.keyPrefix,
    scopes: body.scopes,
    rawKey: generated.rawKey,
    warning: "Save this key now — it will not be shown again.",
  });
});

// ─── GET /api/v1/api-keys ──────────────────────────────────────────────────

/**
 * List the authenticated user's API keys (masked — `keyHash` is never
 * returned because the model has `select: false` on it).
 */
export const GET = withHandler({ query: listApiKeysSchema }, async ({ auth, query, log }) => {
  const q = query as ListApiKeysInput;

  await connectDb();

  const filter = { userId: new Types.ObjectId(auth.userId) };
  const skip = (q.page - 1) * q.limit;

  const [items, total] = await Promise.all([
    ApiKey.find(filter).sort({ createdAt: -1 }).skip(skip).limit(q.limit).lean(),
    ApiKey.countDocuments(filter),
  ]);

  log.debug({ count: items.length, total }, "Listed API keys");

  return jsonOk({
    items,
    pagination: {
      page: q.page,
      limit: q.limit,
      total,
      pages: Math.ceil(total / q.limit),
      hasNext: skip + items.length < total,
      hasPrev: q.page > 1,
    },
  });
});
