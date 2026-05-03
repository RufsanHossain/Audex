import { requirePermission } from "@audex/auth";
import { connectDb, Project } from "@audex/db";
import { logProjectAction } from "@audex/infra";
import { Permission } from "@audex/types";
import { ApiError, createProjectSchema, listProjectsSchema } from "@audex/validators";
import { Types } from "mongoose";

import { jsonCreated, jsonOk, withHandler } from "../../../../lib/api/index.js";

import type { CreateProjectInput, ListProjectsInput } from "@audex/validators";

// Mongoose + auth() in withHandler — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Helpers ───────────────────────────────────────────────────────────────

function deriveSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}

// ─── POST /api/v1/projects ─────────────────────────────────────────────────

/**
 * Create a project.
 *
 * Flow:
 *   1. Auth (withHandler) + RBAC: project:create
 *   2. Rate limit (withHandler)
 *   3. Zod validation (withHandler)
 *   4. Derive slug from name if not provided
 *   5. Insert — duplicate (userId+slug) → 409
 *   6. Audit log
 *   7. Return 201 with project
 */
export const POST = withHandler({ body: createProjectSchema }, async ({ auth, body, log, req }) => {
  const input = body as CreateProjectInput;

  const permErr = requirePermission(auth, Permission.ProjectCreate);
  if (permErr) {
    throw permErr.code === "UNAUTHORIZED"
      ? ApiError.unauthorized(permErr.message)
      : ApiError.forbidden(permErr.message);
  }

  const slug = input.slug ?? deriveSlug(input.name);
  if (slug.length < 3) {
    throw ApiError.badRequest(
      "Could not derive a valid slug from the project name; provide one explicitly",
    );
  }

  await connectDb();

  let project;
  try {
    project = await Project.create({
      userId: new Types.ObjectId(auth.userId),
      name: input.name,
      slug,
      url: input.url,
      ...(input.description ? { description: input.description } : {}),
      ...(input.settings ? { settings: input.settings } : {}),
    });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw ApiError.conflict(`A project with slug '${slug}' already exists`);
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
    "create",
    { projectId: project._id.toString(), slug, url: input.url },
  );

  log.info({ projectId: project._id.toString(), slug }, "Project created");

  return jsonCreated(project.toJSON());
});

// ─── GET /api/v1/projects ──────────────────────────────────────────────────

/**
 * List the authenticated user's projects with pagination, search, and sort.
 *
 * Query params (validated via listProjectsSchema):
 *   - page (default 1)
 *   - limit (default 20, max 100)
 *   - sort: createdAt | name | lastScore (default createdAt)
 *   - order: asc | desc (default desc)
 *   - search: substring match on name/url/slug (case-insensitive)
 */
export const GET = withHandler({ query: listProjectsSchema }, async ({ auth, query, log }) => {
  const q = query as ListProjectsInput;

  await connectDb();

  const filter: Record<string, unknown> = { userId: new Types.ObjectId(auth.userId) };
  if (q.search) {
    const escaped = q.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter["$or"] = [
      { name: { $regex: escaped, $options: "i" } },
      { slug: { $regex: escaped, $options: "i" } },
      { url: { $regex: escaped, $options: "i" } },
    ];
  }

  const sortOrder = q.order === "asc" ? 1 : -1;
  const skip = (q.page - 1) * q.limit;

  const [items, total] = await Promise.all([
    Project.find(filter)
      .sort({ [q.sort]: sortOrder })
      .skip(skip)
      .limit(q.limit)
      .lean(),
    Project.countDocuments(filter),
  ]);

  log.debug({ count: items.length, total }, "Listed projects");

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
