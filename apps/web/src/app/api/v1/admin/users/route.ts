import { connectDb, User } from "@audex/db";
import { adminListUsersSchema } from "@audex/validators";

import { jsonOk, requireAdmin, withHandler } from "../../../../../lib/api/index.js";

import type { AdminListUsersInput } from "@audex/validators";

// Mongoose + auth() in withHandler — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── GET /api/v1/admin/users ───────────────────────────────────────────────

/**
 * Admin: paginated user list with role filter, search, and sort.
 *
 * Query params (validated via adminListUsersSchema):
 *   - page (default 1)
 *   - limit (default 20, max 100)
 *   - role (optional filter)
 *   - search (matches email or name, case-insensitive substring)
 *   - sort: createdAt | name | email | auditCount (default createdAt)
 *   - order: asc | desc (default desc)
 */
export const GET = withHandler({ query: adminListUsersSchema }, async ({ auth, query, log }) => {
  requireAdmin(auth);
  const q = query as AdminListUsersInput;

  await connectDb();

  const filter: Record<string, unknown> = {};
  if (q.role) filter["role"] = q.role;
  if (q.search) {
    const escaped = q.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter["$or"] = [
      { email: { $regex: escaped, $options: "i" } },
      { name: { $regex: escaped, $options: "i" } },
    ];
  }

  const sortOrder = q.order === "asc" ? 1 : -1;
  const skip = (q.page - 1) * q.limit;

  const [items, total] = await Promise.all([
    User.find(filter)
      .select("-passwordHash")
      .sort({ [q.sort]: sortOrder })
      .skip(skip)
      .limit(q.limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  log.debug({ count: items.length, total }, "Admin listed users");

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
