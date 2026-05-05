import { env } from "@audex/env";
import { checkoutSchema } from "@audex/validators";

import { jsonOk, withHandler } from "../../../../../lib/api/index.js";

// auth() in withHandler — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── POST /api/v1/billing/checkout ─────────────────────────────────────────

/**
 * Create a Stripe checkout session.
 *
 * **Stub for now.** Returns a mock URL so the frontend upgrade flow can be
 * built and tested before Stripe is wired. Step 212 replaces this with a
 * real `stripe.checkout.sessions.create()` call. The response shape
 * (`{ url, sessionId }`) is the same one Stripe returns, so the only
 * change at swap-in time is the values.
 */
export const POST = withHandler({ body: checkoutSchema }, ({ auth, body, log }) => {
  const sessionId = `cs_test_mock_${auth.userId.slice(-8)}_${Date.now()}`;
  const base = env.APP_URL.replace(/\/+$/, "");
  const url = `${base}/api/billing/mock-checkout?session=${sessionId}&plan=${body.plan}&interval=${body.interval}`;

  log.info(
    { userId: auth.userId, plan: body.plan, interval: body.interval, mock: true },
    "Mock checkout session created",
  );

  return Promise.resolve(
    jsonOk({
      url,
      sessionId,
      plan: body.plan,
      interval: body.interval,
      mock: true,
      message: "Stripe is not yet wired — this is a development stub. See Step 212.",
    }),
  );
});
