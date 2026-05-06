import { env, isProd } from "@audex/env";
import { ApiError } from "@audex/validators";
import { NextResponse } from "next/server";

import { withPublicHandler } from "../../../../lib/api/index.js";
import { buildOpenApiDoc } from "../../../../lib/openapi/spec.js";

// Built on first request, then cached in-process for the lifetime of the
// node. Marked dynamic because force-static triggers a prerender during
// `next build`, and OpenApiGeneratorV31 crashes on Zod's private state
// when invoked from the build worker.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
