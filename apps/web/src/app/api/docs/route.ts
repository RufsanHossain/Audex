import { isProd } from "@audex/env";
import { ApiError } from "@audex/validators";
import { NextResponse } from "next/server";

import { withPublicHandler } from "../../../lib/api/index.js";

export const runtime = "nodejs";
// Match openapi.json — both routes are 404'd in production anyway.
export const dynamic = "force-dynamic";

// Swagger UI from unpkg — keeps the bundle out of the production app.
const SWAGGER_CSS = "https://unpkg.com/swagger-ui-dist@5/swagger-ui.css";
const SWAGGER_BUNDLE = "https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js";
const SWAGGER_PRESET = "https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js";

const HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Audex API — Swagger UI</title>
    <link rel="stylesheet" href="${SWAGGER_CSS}" />
    <style>body{margin:0;background:#fafafa}</style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="${SWAGGER_BUNDLE}" crossorigin></script>
    <script src="${SWAGGER_PRESET}" crossorigin></script>
    <script>
      window.addEventListener("load", () => {
        window.ui = SwaggerUIBundle({
          url: "/api/docs/openapi.json",
          dom_id: "#swagger-ui",
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: "StandaloneLayout",
          persistAuthorization: true,
        });
      });
    </script>
  </body>
</html>`;

// ─── GET /api/docs ─────────────────────────────────────────────────────────

/**
 * Swagger UI for the Audex API. Dev/staging only — production returns 404
 * to avoid leaking implementation details before launch.
 */
export const GET = withPublicHandler({}, () => {
  if (isProd) {
    throw ApiError.notFound("API docs");
  }

  return Promise.resolve(
    new NextResponse(HTML, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    }),
  );
});
