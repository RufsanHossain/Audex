import { randomBytes } from "node:crypto";

import { connectDb, Webhook } from "@audex/db";
import { logWebhookAction } from "@audex/infra";
import { PlanTier } from "@audex/types";
import { ApiError, createWebhookSchema, listWebhooksSchema } from "@audex/validators";
import { Types } from "mongoose";

import {
  isMinPlan,
  jsonCreated,
  jsonOk,
  roleToPlanTier,
  withHandler,
} from "../../../../lib/api/index.js";

import type { ListWebhooksInput } from "@audex/validators";

// Mongoose + auth() in withHandler — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECRET_BYTES = 32;

function generateWebhookSecret(): string {
  return randomBytes(SECRET_BYTES).toString("hex");
}

function requireTeamPlan(role: Parameters<typeof roleToPlanTier>[0]): void {
  if (!isMinPlan(roleToPlanTier(role), PlanTier.Team)) {
    throw ApiError.forbidden("Webhooks require a Team or Enterprise plan");
  }
}

// ─── POST /api/v1/webhooks ─────────────────────────────────────────────────

/**
 * Create a webhook. Generates a 64-char hex secret, returned to the caller
 * exactly once — only the secret stored in MongoDB can sign future
 * deliveries (Step 103 implements the delivery system).
 */
export const POST = withHandler({ body: createWebhookSchema }, async ({ auth, body, log, req }) => {
  requireTeamPlan(auth.role);

  await connectDb();

  const secret = generateWebhookSecret();
  const webhook = await Webhook.create({
    userId: new Types.ObjectId(auth.userId),
    ...(body.projectId ? { projectId: new Types.ObjectId(body.projectId) } : {}),
    url: body.url,
    secret,
    events: body.events,
    ...(body.description ? { description: body.description } : {}),
    isActive: body.isActive,
  });

  const userAgent = req.headers.get("user-agent");
  logWebhookAction(
    {
      userId: auth.userId,
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      ...(userAgent ? { userAgent } : {}),
    },
    "create",
    { webhookId: webhook._id.toString(), url: body.url, events: body.events },
  );

  log.info({ webhookId: webhook._id.toString(), url: body.url }, "Webhook created");

  // Return secret with the full record. The model has `select: false` on
  // `secret`, so subsequent GETs will not include it.
  const json = webhook.toJSON();
  return jsonCreated({
    ...json,
    secret,
    warning:
      "Save this secret now — it is needed to verify webhook signatures and will not be shown again.",
  });
});

// ─── GET /api/v1/webhooks ──────────────────────────────────────────────────

/**
 * List the authenticated user's webhooks. The `secret` is excluded by the
 * model's `select: false` flag.
 */
export const GET = withHandler({ query: listWebhooksSchema }, async ({ auth, query, log }) => {
  const q = query as ListWebhooksInput;
  requireTeamPlan(auth.role);

  await connectDb();

  const filter: Record<string, unknown> = { userId: new Types.ObjectId(auth.userId) };
  if (q.projectId) filter["projectId"] = new Types.ObjectId(q.projectId);

  const skip = (q.page - 1) * q.limit;

  const [items, total] = await Promise.all([
    Webhook.find(filter).sort({ createdAt: -1 }).skip(skip).limit(q.limit).lean(),
    Webhook.countDocuments(filter),
  ]);

  log.debug({ count: items.length, total }, "Listed webhooks");

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
