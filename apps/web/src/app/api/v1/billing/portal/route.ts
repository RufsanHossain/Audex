import { env } from "@audex/env";

import { jsonOk, withHandler } from "../../../../../lib/api/index.js";

// auth() in withHandler — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── POST /api/v1/billing/portal ───────────────────────────────────────────

/**
 * Create a Stripe billing portal session.
 *
 * **Stub for now.** Returns a mock URL so the frontend "Manage billing"
 * affordance can be built before Stripe is wired. Step 214 replaces this
 * with a real `stripe.billingPortal.sessions.create()` call.
 */
export const POST = withHandler({}, ({ auth, log }) => {
  const sessionId = `bps_test_mock_${auth.userId.slice(-8)}_${Date.now()}`;
  const base = env.APP_URL.replace(/\/+$/, "");
  const url = `${base}/api/billing/mock-portal?session=${sessionId}`;

  log.info({ userId: auth.userId, mock: true }, "Mock billing portal session created");

  return Promise.resolve(
    jsonOk({
      url,
      sessionId,
      mock: true,
      message: "Stripe is not yet wired — this is a development stub. See Step 214.",
    }),
  );
});
