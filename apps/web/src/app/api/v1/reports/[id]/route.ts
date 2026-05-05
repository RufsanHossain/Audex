import { connectDb, Report } from "@audex/db";
import { logReportAction } from "@audex/infra";
import { UserRole } from "@audex/types";
import { ApiError, objectIdSchema } from "@audex/validators";

import { jsonOk, withHandler } from "../../../../../lib/api/index.js";

// Mongoose + auth() in withHandler — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── GET /api/v1/reports/:id ───────────────────────────────────────────────

/**
 * Get a single report by ID. Mirrors `/api/v1/audits/:id` — the Report
 * model is the underlying document for both — but lives at the
 * report-shaped URL for clients consuming the report rather than the
 * audit lifecycle.
 *
 * Auth + ownership (admin bypass). Logs a `view` action.
 */
export const GET = withHandler({}, async ({ auth, params, log, req }) => {
  const reportId = params["id"];
  if (!reportId || !objectIdSchema.safeParse(reportId).success) {
    throw ApiError.notFound("Report");
  }

  await connectDb();

  const report = await Report.findById(reportId).populate("projectId", "name slug").lean();
  if (!report) {
    throw ApiError.notFound("Report");
  }

  const isOwner = report.userId.toString() === auth.userId;
  const isAdmin = auth.role === UserRole.Admin;
  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden("You do not have access to this report");
  }

  const userAgent = req.headers.get("user-agent");
  logReportAction(
    {
      userId: auth.userId,
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      ...(userAgent ? { userAgent } : {}),
    },
    "view",
    { reportId, byAdmin: isAdmin && !isOwner },
  );

  log.debug({ reportId }, "Fetched report");

  return jsonOk(report);
});
