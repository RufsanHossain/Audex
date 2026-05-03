import { revokeApiKey } from "@audex/auth";
import { logApiKeyAction } from "@audex/infra";
import { ApiError, objectIdSchema } from "@audex/validators";

import { jsonOk, withHandler } from "../../../../../lib/api/index.js";

// Mongoose + Redis + auth() in withHandler — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── DELETE /api/v1/api-keys/:id ───────────────────────────────────────────

/**
 * Revoke an API key. The key is marked inactive in MongoDB and its cache
 * entry is cleared from Redis (handled inside `revokeApiKey`). Subsequent
 * authentication attempts with that key will be rejected.
 *
 * Ownership is enforced inside `revokeApiKey` — passing another user's
 * keyId returns false (treated as 404 here).
 */
export const DELETE = withHandler({}, async ({ auth, params, req, log }) => {
  const keyId = params["id"];
  if (!keyId || !objectIdSchema.safeParse(keyId).success) {
    throw ApiError.notFound("API key");
  }

  const revoked = await revokeApiKey(keyId, auth.userId);
  if (!revoked) {
    throw ApiError.notFound("API key");
  }

  const userAgent = req.headers.get("user-agent");
  logApiKeyAction(
    {
      userId: auth.userId,
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      ...(userAgent ? { userAgent } : {}),
    },
    "revoke",
    { keyId },
  );

  log.info({ keyId }, "API key revoked");

  return jsonOk({ id: keyId, revoked: true });
});
