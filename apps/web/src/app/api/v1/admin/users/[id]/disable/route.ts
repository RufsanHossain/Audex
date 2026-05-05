import { revokeAllUserSessions } from "@audex/auth";
import { connectDb, User } from "@audex/db";
import { logAdminAction } from "@audex/infra";
import { ApiError, adminDisableUserSchema, objectIdSchema } from "@audex/validators";

import { jsonOk, requireAdmin, withHandler } from "../../../../../../../lib/api/index.js";

// Mongoose + Redis (epoch revocation) + auth() — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── PATCH /api/v1/admin/users/:id/disable ─────────────────────────────────

/**
 * Admin: disable or re-enable a user. Disabling also revokes all active
 * sessions (per-user epoch bump) so the user is logged out everywhere
 * immediately. Refuses to disable the caller themselves to avoid
 * accidental self-lockout.
 *
 * Body: `{ disabled: boolean, reason?: string }`
 *
 * NOTE: enforcement of `disabled` at sign-in is the responsibility of the
 * auth provider — that wiring is not part of this step. The flag and the
 * revocation are recorded here so the auth layer can pick them up later.
 */
export const PATCH = withHandler(
  { body: adminDisableUserSchema },
  async ({ auth, body, params, log, req }) => {
    requireAdmin(auth);

    const targetId = params["id"];
    if (!targetId || !objectIdSchema.safeParse(targetId).success) {
      throw ApiError.notFound("User");
    }

    if (targetId === auth.userId && body.disabled) {
      throw ApiError.conflict("You cannot disable your own account");
    }

    await connectDb();

    const target = await User.findById(targetId);
    if (!target) {
      throw ApiError.notFound("User");
    }

    const previous = target.disabled;
    target.disabled = body.disabled;
    if (body.disabled) {
      target.disabledAt = new Date();
      if (body.reason) target.disabledReason = body.reason;
    } else {
      target.disabledAt = undefined;
      target.disabledReason = undefined;
    }
    await target.save();

    if (body.disabled && !previous) {
      await revokeAllUserSessions(targetId);
    }

    const userAgent = req.headers.get("user-agent");
    logAdminAction(
      {
        userId: auth.userId,
        ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
        ...(userAgent ? { userAgent } : {}),
      },
      {
        action: body.disabled ? "user.disable" : "user.enable",
        targetUserId: targetId,
        ...(body.reason ? { reason: body.reason } : {}),
      },
    );

    log.info({ targetId, disabled: body.disabled }, "Admin toggled user disabled");

    return jsonOk({
      id: targetId,
      disabled: target.disabled,
      disabledAt: target.disabledAt,
      disabledReason: target.disabledReason,
      sessionsRevoked: body.disabled && !previous,
    });
  },
);
