import { requirePermission } from "@audex/auth";
import { connectDb, Report } from "@audex/db";
import {
  acquireAuditSlot,
  enqueueUrlAudit,
  getUsage,
  incrementUsage,
  logAuditAction,
  releaseAuditSlot,
} from "@audex/infra";
import { Permission } from "@audex/types";
import { ApiError, createAuditSchema, listAuditsSchema } from "@audex/validators";

import { jsonAccepted, jsonOk, withHandler } from "../../../../lib/api/index.js";
import { roleToPlanTier } from "../../../../lib/api/plan.js";

import type { DeviceType } from "@audex/types";
import type { CreateAuditInput, ListAuditsInput } from "@audex/validators";

// Mongoose + auth() in withHandler — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Constants ─────────────────────────────────────────────────────────────

const DEFAULT_AUDIT_TIMEOUT_MS = 90_000;
const ALL_DIMENSIONS = [
  "security",
  "performance",
  "accessibility",
  "seo",
  "speed",
  "privacy",
  "network",
  "best-practices",
  "ui",
  "ux",
  "memory",
] as const;

// ─── POST /api/v1/audits ───────────────────────────────────────────────────

/**
 * Create a new audit.
 *
 * Flow:
 *   1. Auth (withHandler)
 *   2. RBAC: audit:create permission
 *   3. Rate limit (withHandler)
 *   4. Zod validation (withHandler)
 *   5. Check monthly usage limit
 *   6. Acquire concurrent audit slot
 *   7. Create Report (status: queued)
 *   8. Increment usage counter
 *   9. Enqueue BullMQ job
 *   10. Return 202 with audit ID
 *
 * Errors release the slot before returning to keep counters consistent.
 */
export const POST = withHandler({ body: createAuditSchema }, async ({ auth, body, log, req }) => {
  const input = body as CreateAuditInput;

  // 1. RBAC
  const permErr = requirePermission(auth, Permission.AuditCreate);
  if (permErr) {
    throw new ApiError(permErr.code, permErr.message);
  }

  const tier = roleToPlanTier(auth.role);

  // 2. Usage limit
  const usage = await getUsage(auth.userId, tier);
  if (usage.exceeded) {
    throw ApiError.auditLimitExceeded(usage.limit, new Date(usage.resetDate));
  }

  // 3. Concurrent slot — generate audit ID up front so we can track the slot
  await connectDb();
  const report = new Report({
    userId: auth.userId,
    projectId: input.projectId,
    inputType: input.type,
    inputValue:
      input.type === "url"
        ? input.url
        : (input.code.entryPoint ?? input.code.files[0]?.path ?? "code"),
    status: "queued",
    device: input.device,
    source: input.source,
    metadata: {},
  });
  const auditId = report._id.toString();

  const slot = await acquireAuditSlot(auth.userId, auditId, tier);
  if (!slot.acquired) {
    throw new ApiError(
      "RATE_LIMITED",
      `Concurrent audit limit reached (${slot.active}/${slot.limit}). Wait for an audit to complete.`,
    );
  }

  try {
    // 4. Persist Report
    await report.save();

    // 5. Increment usage (best-effort — Stripe is source of truth)
    await incrementUsage(auth.userId);

    // 6. Enqueue job
    if (input.type === "url") {
      const dimensions = input.dimensions ?? ALL_DIMENSIONS;
      const jobId = await enqueueUrlAudit(
        {
          auditId,
          userId: auth.userId,
          url: input.url,
          device: input.device as DeviceType,
          dimensions: dimensions as never,
          ...(input.projectId ? { projectId: input.projectId } : {}),
          planTier: tier,
          timeout: DEFAULT_AUDIT_TIMEOUT_MS,
        },
        { planTier: tier },
      );

      log.info({ auditId, jobId, url: input.url }, "Audit queued");
    } else {
      // Code audits — Step 95 wires this up properly
      log.warn({ auditId }, "Code audit queueing not yet implemented");
      throw ApiError.serviceUnavailable("Code audit");
    }

    // 7. Audit log (fire-and-forget)
    const userAgent = req.headers.get("user-agent");
    logAuditAction(
      {
        userId: auth.userId,
        ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
        ...(userAgent ? { userAgent } : {}),
      },
      "create",
      { auditId, type: input.type, source: input.source },
    );

    // 8. Return 202 Accepted
    return jsonAccepted({
      auditId,
      status: "queued",
      progressUrl: `/api/v1/audits/${auditId}/progress`,
      reportUrl: `/api/v1/audits/${auditId}`,
      usage: {
        used: usage.used + 1,
        limit: usage.limit,
        remaining: Math.max(0, usage.remaining - 1),
      },
    });
  } catch (err) {
    // Release slot on any failure to keep counters consistent
    await releaseAuditSlot(auth.userId, auditId);
    throw err;
  }
});

// ─── GET /api/v1/audits ────────────────────────────────────────────────────

/**
 * List the authenticated user's audits with pagination, filters, and sort.
 *
 * Query params (validated via listAuditsSchema):
 *   - page (default 1)
 *   - limit (default 20, max 100)
 *   - status, type, projectId, search, from, to
 *   - sort: createdAt | totalScore | duration (default createdAt)
 *   - order: asc | desc (default desc)
 */
export const GET = withHandler({ query: listAuditsSchema }, async ({ auth, query, log }) => {
  const q = query as ListAuditsInput;

  await connectDb();

  // Build MongoDB filter
  const filter: Record<string, unknown> = { userId: auth.userId };
  if (q.status) filter["status"] = q.status;
  if (q.type) filter["inputType"] = q.type;
  if (q.projectId) filter["projectId"] = q.projectId;
  if (q.search) filter["inputValue"] = { $regex: q.search, $options: "i" };
  if (q.from || q.to) {
    const dateFilter: Record<string, Date> = {};
    if (q.from) dateFilter["$gte"] = q.from;
    if (q.to) dateFilter["$lte"] = q.to;
    filter["createdAt"] = dateFilter;
  }

  const sortField = q.sort;
  const sortOrder = q.order === "asc" ? 1 : -1;
  const skip = (q.page - 1) * q.limit;

  const [items, total] = await Promise.all([
    Report.find(filter)
      .select(
        "inputType inputValue status device source totalScore grade createdAt completedAt duration projectId",
      )
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(q.limit)
      .lean(),
    Report.countDocuments(filter),
  ]);

  log.debug({ count: items.length, total }, "Listed audits");

  return jsonOk({
    items,
    pagination: {
      page: q.page,
      limit: q.limit,
      total,
      pages: Math.ceil(total / q.limit),
      hasNext: skip + items.length < total,
      hasPrev: q.page > 1,
    },
  });
});
