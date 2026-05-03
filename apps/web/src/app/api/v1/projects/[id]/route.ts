import { requirePermission } from "@audex/auth";
import { connectDb, Project, Report } from "@audex/db";
import { logProjectAction } from "@audex/infra";
import { Permission, UserRole } from "@audex/types";
import { ApiError, createProjectSchema, objectIdSchema } from "@audex/validators";
import { Types } from "mongoose";

import { jsonOk, withHandler } from "../../../../../lib/api/index.js";

import type { CreateProjectInput } from "@audex/validators";

// Mongoose + auth() in withHandler — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Helpers ───────────────────────────────────────────────────────────────

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}

function validateProjectId(raw: string | undefined): string {
  if (!raw || !objectIdSchema.safeParse(raw).success) {
    throw ApiError.notFound("Project");
  }
  return raw;
}

// PATCH body schema — same fields as create, all optional, but no `id` (it's in the URL).
const updateProjectBodySchema = createProjectSchema.partial();
type UpdateProjectBody = Partial<CreateProjectInput>;

// ─── GET /api/v1/projects/:id ──────────────────────────────────────────────

/**
 * Get a single project by ID. Returns the project plus a `lastAudit` field
 * resolved from `lastAuditId` (if any). Ownership enforced (admin bypass).
 */
export const GET = withHandler({}, async ({ auth, params, log }) => {
  const projectId = validateProjectId(params["id"]);

  const permErr = requirePermission(auth, Permission.ProjectRead);
  if (permErr) {
    throw permErr.code === "UNAUTHORIZED"
      ? ApiError.unauthorized(permErr.message)
      : ApiError.forbidden(permErr.message);
  }

  await connectDb();

  const project = await Project.findById(projectId).lean();
  if (!project) {
    throw ApiError.notFound("Project");
  }

  if (project.userId.toString() !== auth.userId && auth.role !== UserRole.Admin) {
    throw ApiError.forbidden("You do not have access to this project");
  }

  const lastAudit = project.lastAuditId
    ? await Report.findById(project.lastAuditId)
        .select("inputType inputValue status totalScore grade createdAt completedAt duration")
        .lean()
    : null;

  log.debug({ projectId }, "Fetched project");

  return jsonOk({ ...project, lastAudit });
});

// ─── PATCH /api/v1/projects/:id ────────────────────────────────────────────

/**
 * Update a project. Any subset of create fields. Slug uniqueness is enforced
 * if a new slug is provided. Ownership required (admin bypass).
 */
export const PATCH = withHandler(
  { body: updateProjectBodySchema },
  async ({ auth, params, body, log, req }) => {
    const projectId = validateProjectId(params["id"]);
    const input = body as UpdateProjectBody;

    const permErr = requirePermission(auth, Permission.ProjectUpdate);
    if (permErr) {
      throw permErr.code === "UNAUTHORIZED"
        ? ApiError.unauthorized(permErr.message)
        : ApiError.forbidden(permErr.message);
    }

    await connectDb();

    const project = await Project.findById(projectId);
    if (!project) {
      throw ApiError.notFound("Project");
    }

    if (project.userId.toString() !== auth.userId && auth.role !== UserRole.Admin) {
      throw ApiError.forbidden("You do not have access to this project");
    }

    if (input.name !== undefined) project.name = input.name;
    if (input.slug !== undefined) project.slug = input.slug;
    if (input.url !== undefined) project.url = input.url;
    if (input.description !== undefined) project.description = input.description;
    if (input.settings !== undefined) {
      project.settings = { ...project.settings, ...input.settings };
    }

    try {
      await project.save();
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw ApiError.conflict(`A project with slug '${project.slug}' already exists`);
      }
      throw err;
    }

    const userAgent = req.headers.get("user-agent");
    logProjectAction(
      {
        userId: auth.userId,
        ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
        ...(userAgent ? { userAgent } : {}),
      },
      "update",
      { projectId, fields: Object.keys(input) },
    );

    log.info({ projectId, fields: Object.keys(input) }, "Project updated");

    return jsonOk(project.toJSON());
  },
);

// ─── DELETE /api/v1/projects/:id ───────────────────────────────────────────

/**
 * Delete a project. Cascade behavior:
 *   - If the project has linked reports, the request is rejected with 409
 *     and a `reportCount`. Pass `?force=true` to orphan those reports
 *     (set their `projectId` to null) before deleting the project itself.
 *   - Reports are never auto-deleted — they are valuable historical data.
 */
export const DELETE = withHandler({}, async ({ auth, params, req, log }) => {
  const projectId = validateProjectId(params["id"]);

  const permErr = requirePermission(auth, Permission.ProjectDelete);
  if (permErr) {
    throw permErr.code === "UNAUTHORIZED"
      ? ApiError.unauthorized(permErr.message)
      : ApiError.forbidden(permErr.message);
  }

  await connectDb();

  const project = await Project.findById(projectId);
  if (!project) {
    throw ApiError.notFound("Project");
  }

  if (project.userId.toString() !== auth.userId && auth.role !== UserRole.Admin) {
    throw ApiError.forbidden("You do not have access to this project");
  }

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";

  const projectObjectId = new Types.ObjectId(projectId);
  const reportCount = await Report.countDocuments({ projectId: projectObjectId });

  if (reportCount > 0 && !force) {
    throw ApiError.conflict(
      `Project has ${reportCount} linked report(s). Pass ?force=true to orphan them and delete.`,
    );
  }

  if (reportCount > 0) {
    await Report.updateMany({ projectId: projectObjectId }, { $unset: { projectId: "" } });
  }

  await project.deleteOne();

  const userAgent = req.headers.get("user-agent");
  logProjectAction(
    {
      userId: auth.userId,
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      ...(userAgent ? { userAgent } : {}),
    },
    "delete",
    { projectId, reportCount, force },
  );

  log.info({ projectId, reportCount, force }, "Project deleted");

  return jsonOk({ projectId, deleted: true, orphanedReports: reportCount });
});
