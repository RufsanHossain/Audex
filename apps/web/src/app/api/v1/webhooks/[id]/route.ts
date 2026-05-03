import { connectDb, Webhook } from "@audex/db";
import { logWebhookAction } from "@audex/infra";
import { PlanTier, UserRole } from "@audex/types";
import { ApiError, objectIdSchema, updateWebhookSchema } from "@audex/validators";

import { isMinPlan, jsonOk, roleToPlanTier, withHandler } from "../../../../../lib/api/index.js";

// Mongoose + auth() in withHandler — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validateWebhookId(raw: string | undefined): string {
  if (!raw || !objectIdSchema.safeParse(raw).success) {
    throw ApiError.notFound("Webhook");
  }
  return raw;
}

function requireTeamPlan(role: UserRole): void {
  if (!isMinPlan(roleToPlanTier(role), PlanTier.Team)) {
    throw ApiError.forbidden("Webhooks require a Team or Enterprise plan");
  }
}

// PATCH body — same as updateWebhookSchema but `id` comes from the URL.
const updateBodySchema = updateWebhookSchema.omit({ id: true });

// ─── PATCH /api/v1/webhooks/:id ────────────────────────────────────────────

/**
 * Update a webhook. Any subset of: url, events, description, isActive.
 * Ownership enforced (admin bypass).
 */
export const PATCH = withHandler(
  { body: updateBodySchema },
  async ({ auth, params, body, log }) => {
    requireTeamPlan(auth.role);
    const webhookId = validateWebhookId(params["id"]);

    await connectDb();

    const webhook = await Webhook.findById(webhookId);
    if (!webhook) {
      throw ApiError.notFound("Webhook");
    }

    if (webhook.userId.toString() !== auth.userId && auth.role !== UserRole.Admin) {
      throw ApiError.forbidden("You do not have access to this webhook");
    }

    if (body.url !== undefined) webhook.url = body.url;
    if (body.events !== undefined) webhook.events = body.events;
    if (body.description !== undefined) webhook.description = body.description;
    if (body.isActive !== undefined) webhook.isActive = body.isActive;

    await webhook.save();

    log.info({ webhookId, fields: Object.keys(body) }, "Webhook updated");

    return jsonOk(webhook.toJSON());
  },
);

// ─── DELETE /api/v1/webhooks/:id ───────────────────────────────────────────

/**
 * Delete a webhook. Ownership enforced (admin bypass).
 */
export const DELETE = withHandler({}, async ({ auth, params, req, log }) => {
  requireTeamPlan(auth.role);
  const webhookId = validateWebhookId(params["id"]);

  await connectDb();

  const webhook = await Webhook.findById(webhookId);
  if (!webhook) {
    throw ApiError.notFound("Webhook");
  }

  if (webhook.userId.toString() !== auth.userId && auth.role !== UserRole.Admin) {
    throw ApiError.forbidden("You do not have access to this webhook");
  }

  await webhook.deleteOne();

  const userAgent = req.headers.get("user-agent");
  logWebhookAction(
    {
      userId: auth.userId,
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      ...(userAgent ? { userAgent } : {}),
    },
    "delete",
    { webhookId },
  );

  log.info({ webhookId }, "Webhook deleted");

  return jsonOk({ id: webhookId, deleted: true });
});
