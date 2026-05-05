import { connectDb, User } from "@audex/db";
import { logAdminAction } from "@audex/infra";
import { ApiError, adminUpdateRoleBodySchema, objectIdSchema } from "@audex/validators";

import { jsonOk, requireAdmin, withHandler } from "../../../../../../../lib/api/index.js";

// Mongoose + auth() in withHandler — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── PATCH /api/v1/admin/users/:id/role ────────────────────────────────────

/**
 * Admin: change a user's role. Refuses to demote the last remaining admin
 * — losing all admins would lock everyone out of admin actions.
 */
export const PATCH = withHandler(
  { body: adminUpdateRoleBodySchema },
  async ({ auth, body, params, log, req }) => {
    requireAdmin(auth);

    const targetId = params["id"];
    if (!targetId || !objectIdSchema.safeParse(targetId).success) {
      throw ApiError.notFound("User");
    }

    await connectDb();

    const target = await User.findById(targetId);
    if (!target) {
      throw ApiError.notFound("User");
    }

    const previousRole = target.role;
    if (previousRole === body.role) {
      return jsonOk({ id: targetId, role: body.role, changed: false });
    }

    // Prevent locking everyone out by demoting the last admin.
    if (previousRole === "admin" && body.role !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        throw ApiError.conflict("Cannot demote the last remaining admin");
      }
    }

    target.role = body.role;
    await target.save();

    const userAgent = req.headers.get("user-agent");
    logAdminAction(
      {
        userId: auth.userId,
        ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
        ...(userAgent ? { userAgent } : {}),
      },
      { action: "user.role-change", targetUserId: targetId, from: previousRole, to: body.role },
    );

    log.info({ targetId, from: previousRole, to: body.role }, "Admin changed user role");

    return jsonOk({ id: targetId, role: target.role, previousRole, changed: true });
  },
);
