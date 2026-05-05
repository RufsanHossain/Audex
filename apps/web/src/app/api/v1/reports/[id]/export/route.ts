import { randomUUID } from "node:crypto";

import { requirePermission } from "@audex/auth";
import { connectDb, Report } from "@audex/db";
import { enqueueExport, logReportAction } from "@audex/infra";
import { type ExportFormat, Permission, UserRole } from "@audex/types";
import { ApiError, exportReportSchema, objectIdSchema } from "@audex/validators";

import { jsonAccepted, withHandler } from "../../../../../../lib/api/index.js";

// Mongoose + Redis (queue) + auth() — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Map export format → required permission.
const FORMAT_PERMISSION: Record<string, Permission> = {
  pdf: Permission.ReportExportPdf,
  json: Permission.ReportExportJson,
  csv: Permission.ReportExportCsv,
  // html re-uses the pdf permission (both are rendered outputs)
  html: Permission.ReportExportPdf,
};

// PATCH/POST body — `id` comes from the URL.
const exportBodySchema = exportReportSchema.omit({ id: true });

// ─── POST /api/v1/reports/:id/export ───────────────────────────────────────

/**
 * Trigger an asynchronous report export (PDF, JSON, CSV, or HTML).
 *
 * Flow:
 *   1. Auth (withHandler) + RBAC: report:export:<format>
 *   2. Validate body (format)
 *   3. Verify report exists, is owned by caller (admin bypass), and is
 *      in `completed` state — exporting an unfinished audit is a 409
 *   4. Enqueue export job — Step 93 implements the processor
 *   5. Return 202 with exportId
 */
export const POST = withHandler(
  { body: exportBodySchema },
  async ({ auth, body, params, log, req }) => {
    const reportId = params["id"];
    if (!reportId || !objectIdSchema.safeParse(reportId).success) {
      throw ApiError.notFound("Report");
    }

    const permission = FORMAT_PERMISSION[body.format];
    if (!permission) {
      throw ApiError.badRequest(`Unsupported export format: ${body.format}`);
    }

    const permErr = requirePermission(auth, permission);
    if (permErr) {
      throw permErr.code === "UNAUTHORIZED"
        ? ApiError.unauthorized(permErr.message)
        : ApiError.forbidden(permErr.message);
    }

    await connectDb();

    const report = await Report.findById(reportId).select("userId status").lean();
    if (!report) {
      throw ApiError.notFound("Report");
    }

    const isOwner = report.userId.toString() === auth.userId;
    const isAdmin = auth.role === UserRole.Admin;
    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden("You do not have access to this report");
    }

    if (report.status !== "completed") {
      throw ApiError.conflict(`Cannot export report in '${report.status}' state`);
    }

    const exportId = randomUUID();
    const jobId = await enqueueExport({
      exportId,
      reportId,
      userId: auth.userId,
      format: body.format as ExportFormat,
    });

    if (!jobId) {
      throw ApiError.serviceUnavailable("Export queue");
    }

    const userAgent = req.headers.get("user-agent");
    logReportAction(
      {
        userId: auth.userId,
        ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
        ...(userAgent ? { userAgent } : {}),
      },
      "export",
      { reportId, exportId, format: body.format },
    );

    log.info({ reportId, exportId, jobId, format: body.format }, "Export queued");

    return jsonAccepted({
      exportId,
      reportId,
      format: body.format,
      status: "queued",
      message:
        "Export job queued — poll the export status endpoint for the download URL once ready.",
    });
  },
);
