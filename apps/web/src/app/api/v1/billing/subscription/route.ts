import { connectDb, Subscription, User } from "@audex/db";
import { getUsage } from "@audex/infra";

import { jsonOk, roleToPlanTier, withHandler } from "../../../../../lib/api/index.js";

// Mongoose + Redis (usage) + auth() — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── GET /api/v1/billing/subscription ──────────────────────────────────────

/**
 * Return the authenticated user's current subscription state and usage.
 *
 * Stage 6 (Steps 211-218) wires real Stripe data through the Subscription
 * model and webhooks. Until then, this endpoint composes:
 *   - User.plan (the current source of truth before Stripe lands)
 *   - Subscription doc (only present once webhooks land)
 *   - Usage info from Redis + tier limits
 *
 * The shape stays stable across the Stripe migration so the UI doesn't
 * need to branch on the implementation phase.
 */
export const GET = withHandler({}, async ({ auth, log }) => {
  await connectDb();

  const tier = roleToPlanTier(auth.role);

  const [user, subscription, usage] = await Promise.all([
    User.findById(auth.userId).select("plan").lean(),
    Subscription.findOne({ userId: auth.userId }).lean(),
    getUsage(auth.userId, tier),
  ]);

  log.debug({ userId: auth.userId, tier }, "Fetched billing subscription");

  return jsonOk({
    plan: {
      tier: user?.plan.tier ?? tier,
      stripeCustomerId: user?.plan.stripeCustomerId ?? null,
      stripeSubscriptionId: user?.plan.stripeSubscriptionId ?? null,
      currentPeriodEnd: user?.plan.currentPeriodEnd ?? null,
    },
    subscription: subscription
      ? {
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          stripePriceId: subscription.stripePriceId,
        }
      : null,
    usage,
  });
});
