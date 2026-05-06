import { env, isProd } from "@audex/env";
import { ApiError } from "@audex/validators";
import { NextResponse } from "next/server";

import { withPublicHandler } from "../../../../lib/api/index.js";
import { buildOpenApiDoc } from "../../../../lib/openapi/spec.js";

// Pure JSON serialization — no DB or Redis. Cache so subsequent fetches
// don't rebuild the document.
export const runtime = "nodejs";
export const dynamic = "force-static";

let cached: unknown = null;

// ─── GET /api/docs/openapi.json ────────────────────────────────────────────

/**
 * Serve the OpenAPI 3.1 document for the Audex API.
 *
 * Dev/staging only. In production this returns 404 — the API surface is
 * not advertised externally until launch (Step 238 sets up public-facing
 * docs).
 */
export const GET = withPublicHandler({}, () => {
  if (isProd) {
    throw ApiError.notFound("API docs");
  }

  cached ??= buildOpenApiDoc(env.APP_URL);

  return Promise.resolve(
    NextResponse.json(cached, {
      headers: {
        "cache-control": "public, max-age=60",
      },
    }),
  );
});
