import { connectDb, Report } from "@audex/db";
import { UserRole } from "@audex/types";
import { ApiError } from "@audex/validators";

import { jsonOk, withHandler } from "../../../../../lib/api/index.js";

// Mongoose + auth() in withHandler — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── GET /api/v1/audits/:id ────────────────────────────────────────────────

/**
 * Get a single audit by ID.
 *
 * Auth + ownership check (admin can read any audit).
 * Returns the full Report document including embedded dimension results.
 */
export const GET = withHandler({}, async ({ auth, params, log }) => {
  const auditId = params["id"];
  if (!auditId) {
    throw ApiError.notFound("Audit");
  }

  await connectDb();

  const audit = await Report.findById(auditId).populate("projectId", "name slug").lean();

  if (!audit) {
    throw ApiError.notFound("Audit");
  }

  // Ownership check (admin bypass)
  const isOwner = audit.userId.toString() === auth.userId;
  const isAdmin = auth.role === UserRole.Admin;
  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden("You do not have access to this audit");
  }

  log.debug({ auditId }, "Fetched audit");

  return jsonOk(audit);
});
