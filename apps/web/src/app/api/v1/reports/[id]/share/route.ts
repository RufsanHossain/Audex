import { randomBytes } from "node:crypto";

import { requirePermission } from "@audex/auth";
import { connectDb, Report } from "@audex/db";
import { env } from "@audex/env";
import { logReportAction } from "@audex/infra";
import { Permission, PlanTier, UserRole } from "@audex/types";
import { ApiError, objectIdSchema, shareReportSchema } from "@audex/validators";

import { isMinPlan, jsonOk, roleToPlanTier, withHandler } from "../../../../../../lib/api/index.js";

// Mongoose + auth() in withHandler — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SLUG_BYTES = 12; // 96-bit slug → 16 chars base64url

function generateShareSlug(): string {
  return randomBytes(SLUG_BYTES).toString("base64url");
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}

function buildShareUrl(slug: string): string {
  const base = env.APP_URL.replace(/\/+$/, "");
  return `${base}/reports/shared/${slug}`;
}

function requireProPlan(role: UserRole): void {
  if (!isMinPlan(roleToPlanTier(role), PlanTier.Pro)) {
    throw ApiError.forbidden("Sharing reports requires a Pro or higher plan");
  }
}

function validateReportId(raw: string | undefined): string {
  if (!raw || !objectIdSchema.safeParse(raw).success) {
    throw ApiError.notFound("Report");
  }
  return raw;
}

// ─── POST /api/v1/reports/:id/share ────────────────────────────────────────

/**
 * Enable (or change) sharing for a report. Pro+ only.
 *
 * Generates a 96-bit base64url slug on first share. Subsequent calls keep
 * the existing slug and only update `shareAccess`, so the public URL stays
 * stable across access toggles.
 *
 * Body: `{ access: "public" | "unlisted" }`
 *   - public: discoverable / linkable
 *   - unlisted: link-only access (anyone with URL)
 *
 * To revoke sharing entirely, use DELETE.
 */
export const POST = withHandler(
  { body: shareReportSchema },
  async ({ auth, params, body, log, req }) => {
    requireProPlan(auth.role);
    const reportId = validateReportId(params["id"]);

    const permErr = requirePermission(auth, Permission.ReportShare);
    if (permErr) {
      throw permErr.code === "UNAUTHORIZED"
        ? ApiError.unauthorized(permErr.message)
        : ApiError.forbidden(permErr.message);
    }

    await connectDb();

    const report = await Report.findById(reportId);
    if (!report) {
      throw ApiError.notFound("Report");
    }

    if (report.userId.toString() !== auth.userId && auth.role !== UserRole.Admin) {
      throw ApiError.forbidden("You do not have access to this report");
    }

    if (report.status !== "completed") {
      throw ApiError.conflict(`Cannot share a report in '${report.status}' state`);
    }

    // First-time share: assign a slug. Retry once on the absurdly-rare collision.
    if (!report.shareSlug) {
      report.shareSlug = generateShareSlug();
      report.sharedAt = new Date();
    }
    report.shareAccess = body.access;

    try {
      await report.save();
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        report.shareSlug = generateShareSlug();
        await report.save();
      } else {
        throw err;
      }
    }

    const userAgent = req.headers.get("user-agent");
    logReportAction(
      {
        userId: auth.userId,
        ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
        ...(userAgent ? { userAgent } : {}),
      },
      "share",
      { reportId, access: body.access, action: "enable" },
    );

    log.info({ reportId, access: body.access }, "Report sharing enabled");

    return jsonOk({
      reportId,
      shareSlug: report.shareSlug,
      shareAccess: report.shareAccess,
      sharedAt: report.sharedAt,
      url: buildShareUrl(report.shareSlug),
    });
  },
);

// ─── DELETE /api/v1/reports/:id/share ──────────────────────────────────────

/**
 * Revoke sharing for a report. Removes the shareSlug entirely so future
 * shares get a fresh URL (a previously-leaked slug becomes permanently
 * unreachable).
 */
export const DELETE = withHandler({}, async ({ auth, params, log, req }) => {
  requireProPlan(auth.role);
  const reportId = validateReportId(params["id"]);

  await connectDb();

  const report = await Report.findById(reportId);
  if (!report) {
    throw ApiError.notFound("Report");
  }

  if (report.userId.toString() !== auth.userId && auth.role !== UserRole.Admin) {
    throw ApiError.forbidden("You do not have access to this report");
  }

  const wasShared = Boolean(report.shareSlug);

  report.shareSlug = undefined;
  report.shareAccess = undefined;
  report.sharedAt = undefined;
  await report.save();

  if (wasShared) {
    const userAgent = req.headers.get("user-agent");
    logReportAction(
      {
        userId: auth.userId,
        ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
        ...(userAgent ? { userAgent } : {}),
      },
      "share",
      { reportId, action: "revoke" },
    );
  }

  log.info({ reportId, wasShared }, "Report sharing revoked");

  return jsonOk({ reportId, shared: false });
});
