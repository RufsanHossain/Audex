import { connectDb, Report } from "@audex/db";
import { PlanTier, UserRole } from "@audex/types";
import { ApiError, compareAuditsSchema } from "@audex/validators";

import { isMinPlan, jsonOk, roleToPlanTier, withHandler } from "../../../../../lib/api/index.js";

import type { IFindingDoc } from "@audex/db";

// Mongoose + auth() in withHandler — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Severity ──────────────────────────────────────────────────────────────

const SEVERITY_RANK: Record<IFindingDoc["severity"], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

// ─── Types ─────────────────────────────────────────────────────────────────

interface FindingSummary {
  ruleId: string;
  severity: IFindingDoc["severity"];
  title: string;
  baseSeverity?: IFindingDoc["severity"];
}

interface DimensionDiff {
  dimension: string;
  baseScore: number | null;
  compareScore: number | null;
  scoreDelta: number | null;
  findings: {
    new: FindingSummary[];
    fixed: FindingSummary[];
    recurring: FindingSummary[];
    regressed: FindingSummary[];
  };
}

type DimensionMap = Record<string, { score?: number; findings?: IFindingDoc[] } | undefined>;

// ─── Diff Logic ────────────────────────────────────────────────────────────

function indexFindings(findings: IFindingDoc[] | undefined): Map<string, IFindingDoc> {
  const map = new Map<string, IFindingDoc>();
  for (const f of findings ?? []) map.set(f.ruleId, f);
  return map;
}

function diffDimension(
  dimension: string,
  base: { score?: number; findings?: IFindingDoc[] } | undefined,
  compare: { score?: number; findings?: IFindingDoc[] } | undefined,
): DimensionDiff {
  const baseFindings = indexFindings(base?.findings);
  const compareFindings = indexFindings(compare?.findings);

  const newF: FindingSummary[] = [];
  const fixedF: FindingSummary[] = [];
  const recurring: FindingSummary[] = [];
  const regressed: FindingSummary[] = [];

  for (const [ruleId, cFind] of compareFindings) {
    const bFind = baseFindings.get(ruleId);
    if (!bFind) {
      newF.push({ ruleId, severity: cFind.severity, title: cFind.title });
      continue;
    }
    const summary: FindingSummary = {
      ruleId,
      severity: cFind.severity,
      title: cFind.title,
      baseSeverity: bFind.severity,
    };
    if (SEVERITY_RANK[cFind.severity] > SEVERITY_RANK[bFind.severity]) {
      regressed.push(summary);
    } else {
      recurring.push(summary);
    }
  }

  for (const [ruleId, bFind] of baseFindings) {
    if (!compareFindings.has(ruleId)) {
      fixedF.push({ ruleId, severity: bFind.severity, title: bFind.title });
    }
  }

  const baseScore = base?.score ?? null;
  const compareScore = compare?.score ?? null;
  const scoreDelta = baseScore !== null && compareScore !== null ? compareScore - baseScore : null;

  return {
    dimension,
    baseScore,
    compareScore,
    scoreDelta,
    findings: { new: newF, fixed: fixedF, recurring, regressed },
  };
}

// ─── POST /api/v1/reports/compare ──────────────────────────────────────────

/**
 * Compare two reports.
 *
 * Body: `{ baseAuditId, compareAuditId }`
 *
 * Returns score deltas (overall + per-dimension) and finding classification
 * (new / fixed / recurring / regressed) keyed by ruleId. Severity comparison
 * uses critical > high > medium > low > info ordering — when a recurring
 * rule's severity ticks up, it's classified as `regressed`.
 *
 * Pro+ only. Both reports must be owned by the caller (admin bypass) and
 * in `completed` state.
 *
 * Note: Step 147 (Stage 4) will land a richer comparison engine. This
 * endpoint stays as the public surface; the internals can be swapped to
 * call into that engine without breaking clients.
 */
export const POST = withHandler({ body: compareAuditsSchema }, async ({ auth, body, log }) => {
  if (!isMinPlan(roleToPlanTier(auth.role), PlanTier.Pro)) {
    throw ApiError.forbidden("Comparing reports requires a Pro or higher plan");
  }

  if (body.baseAuditId === body.compareAuditId) {
    throw ApiError.badRequest("baseAuditId and compareAuditId must differ");
  }

  await connectDb();

  const [base, compare] = await Promise.all([
    Report.findById(body.baseAuditId).lean(),
    Report.findById(body.compareAuditId).lean(),
  ]);

  if (!base || !compare) {
    throw ApiError.notFound("Report");
  }

  const isAdmin = auth.role === UserRole.Admin;
  if (!isAdmin) {
    if (base.userId.toString() !== auth.userId || compare.userId.toString() !== auth.userId) {
      throw ApiError.forbidden("You do not have access to one or both reports");
    }
  }

  if (base.status !== "completed" || compare.status !== "completed") {
    throw ApiError.conflict("Both reports must be in 'completed' state");
  }

  // Mongoose .lean() converts Map fields to plain objects, but the model
  // type still says Map. Two-step cast through unknown is safe here.
  const baseDims = base.dimensions as unknown as DimensionMap;
  const compareDims = compare.dimensions as unknown as DimensionMap;

  const dimensionKeys = new Set<string>([...Object.keys(baseDims), ...Object.keys(compareDims)]);

  const dimensions = [...dimensionKeys]
    .map((d) => diffDimension(d, baseDims[d], compareDims[d]))
    .sort((a, b) => a.dimension.localeCompare(b.dimension));

  const totalDelta =
    base.totalScore !== undefined && compare.totalScore !== undefined
      ? compare.totalScore - base.totalScore
      : null;

  log.debug(
    {
      base: body.baseAuditId,
      compare: body.compareAuditId,
      totalDelta,
      dimensions: dimensions.length,
    },
    "Compared reports",
  );

  return jsonOk({
    base: {
      id: body.baseAuditId,
      totalScore: base.totalScore ?? null,
      grade: base.grade ?? null,
      createdAt: base.createdAt,
    },
    compare: {
      id: body.compareAuditId,
      totalScore: compare.totalScore ?? null,
      grade: compare.grade ?? null,
      createdAt: compare.createdAt,
    },
    scoreDelta: totalDelta,
    dimensions,
  });
});
