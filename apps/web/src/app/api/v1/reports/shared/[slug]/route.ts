import { connectDb, Report } from "@audex/db";
import { ApiError } from "@audex/validators";

import { jsonOk, withPublicHandler } from "../../../../../../lib/api/index.js";

// Mongoose — must run on Node, never cached. ISR is intentionally NOT used:
// share access can change at any time, and stale cached responses would
// leak revoked content.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SLUG_PATTERN = /^[a-zA-Z0-9_-]{1,32}$/;

// ─── GET /api/v1/reports/shared/:slug ──────────────────────────────────────

/**
 * Public read of a shared report. No authentication.
 *
 * Visibility rules:
 *   - shareAccess `public` or `unlisted` → returned to anyone with the slug
 *   - `private` or unset → 404 (we never confirm existence to unauthorized
 *     callers)
 *   - Only `completed` reports are exposed — in-flight audits stay private
 *
 * The response is scrubbed of internal fields (userId, shareSlug,
 * shareAccess, sharedAt) so a leaked link doesn't reveal owner identity.
 *
 * Step 43 implements the share-configure endpoint that populates these
 * fields. Until then, this route will always return 404.
 */
export const GET = withPublicHandler({}, async ({ params, log }) => {
  const slug = params["slug"];
  if (!slug || !SLUG_PATTERN.test(slug)) {
    throw ApiError.notFound("Shared report");
  }

  await connectDb();

  const doc = await Report.findOne({ shareSlug: slug }).populate("projectId", "name slug").lean();

  if (
    !doc ||
    doc.status !== "completed" ||
    (doc.shareAccess !== "public" && doc.shareAccess !== "unlisted")
  ) {
    // Never confirm existence to unauthorized callers.
    throw ApiError.notFound("Shared report");
  }

  // Strip internal fields before returning to the public.
  const {
    userId: _userId,
    shareSlug: _shareSlug,
    shareAccess: _shareAccess,
    sharedAt: _sharedAt,
    ...publicReport
  } = doc;

  log.debug({ slug, access: doc.shareAccess }, "Served shared report");

  return jsonOk(publicReport);
});
