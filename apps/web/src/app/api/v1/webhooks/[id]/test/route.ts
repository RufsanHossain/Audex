import { createHmac, randomUUID } from "node:crypto";

import { connectDb, Webhook } from "@audex/db";
import { PlanTier, UserRole } from "@audex/types";
import { ApiError, objectIdSchema } from "@audex/validators";

import { isMinPlan, jsonOk, roleToPlanTier, withHandler } from "../../../../../../lib/api/index.js";

// Mongoose + outbound fetch — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEST_TIMEOUT_MS = 10_000;
const RESPONSE_BODY_LIMIT = 1_000;

function validateWebhookId(raw: string | undefined): string {
  if (!raw || !objectIdSchema.safeParse(raw).success) {
    throw ApiError.notFound("Webhook");
  }
  return raw;
}

function signPayload(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

// ─── POST /api/v1/webhooks/:id/test ────────────────────────────────────────

/**
 * Send a synthetic `webhook.test` payload to the configured webhook URL,
 * signed with the webhook secret. Returns the receiver's status code,
 * latency, and a truncated response body so the caller can verify their
 * endpoint is wired up correctly.
 *
 * This is a one-shot delivery — no retries, no queue. Step 103 implements
 * the production delivery system. Failures here do NOT increment the
 * webhook's `failureCount`.
 */
export const POST = withHandler({}, async ({ auth, params, log }) => {
  if (!isMinPlan(roleToPlanTier(auth.role), PlanTier.Team)) {
    throw ApiError.forbidden("Webhooks require a Team or Enterprise plan");
  }

  const webhookId = validateWebhookId(params["id"]);

  await connectDb();

  const webhook = await Webhook.findById(webhookId).select("+secret");
  if (!webhook) {
    throw ApiError.notFound("Webhook");
  }

  if (webhook.userId.toString() !== auth.userId && auth.role !== UserRole.Admin) {
    throw ApiError.forbidden("You do not have access to this webhook");
  }

  const deliveryId = randomUUID();
  const payload = {
    id: deliveryId,
    type: "webhook.test",
    createdAt: new Date().toISOString(),
    data: {
      message:
        "This is a test delivery from Audex. If you received this, your webhook is wired up correctly.",
      webhookId,
    },
  };
  const body = JSON.stringify(payload);
  const signature = signPayload(webhook.secret, body);

  const startedAt = Date.now();
  let status: number | null = null;
  let responseBody: string | null = null;
  let error: string | null = null;

  try {
    const res = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Audex-Webhook-Test/1.0",
        "x-audex-event": "webhook.test",
        "x-audex-delivery": deliveryId,
        "x-audex-signature": `sha256=${signature}`,
      },
      body,
      signal: AbortSignal.timeout(TEST_TIMEOUT_MS),
    });
    status = res.status;
    const text = await res.text();
    responseBody = text.slice(0, RESPONSE_BODY_LIMIT);
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown delivery error";
  }

  const durationMs = Date.now() - startedAt;
  const ok = status !== null && status >= 200 && status < 300;

  log.info({ webhookId, status, durationMs, ok, error }, "Webhook test delivery");

  return jsonOk({
    deliveryId,
    ok,
    status,
    durationMs,
    responseBody,
    error,
  });
});
