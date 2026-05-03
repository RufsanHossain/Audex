import { hashPassword, revokeAllUserSessions, verifyPassword } from "@audex/auth";
import { connectDb, User } from "@audex/db";
import { logAuth } from "@audex/infra";
import { ApiError, changePasswordSchema } from "@audex/validators";

import { jsonOk, withHandler } from "../../../../../../lib/api/index.js";

// Mongoose + auth() in withHandler — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── POST /api/v1/users/me/password ────────────────────────────────────────

/**
 * Change the authenticated user's password.
 *
 * Flow:
 *   1. Auth (withHandler)
 *   2. Validate body (changePasswordSchema enforces strength + match)
 *   3. Load user with passwordHash (select: false on the model)
 *   4. Reject OAuth-only accounts (no passwordHash to verify against)
 *   5. Verify current password — wrong → 401
 *   6. Hash new password and persist
 *   7. Bump per-user revocation epoch — all existing JWTs are now invalid
 *   8. Audit log
 *
 * Caller must sign in again after this succeeds.
 */
export const POST = withHandler(
  { body: changePasswordSchema },
  async ({ auth, body, log, req }) => {
    await connectDb();

    const user = await User.findById(auth.userId).select("+passwordHash");
    if (!user) {
      throw ApiError.notFound("User");
    }

    if (!user.passwordHash) {
      throw ApiError.badRequest(
        "This account signs in via an OAuth provider; password change is not available",
      );
    }

    const currentValid = await verifyPassword(body.currentPassword, user.passwordHash);
    if (!currentValid) {
      throw ApiError.unauthorized("Current password is incorrect");
    }

    user.passwordHash = await hashPassword(body.newPassword);
    await user.save();

    await revokeAllUserSessions(auth.userId);

    const userAgent = req.headers.get("user-agent");
    logAuth(
      {
        userId: auth.userId,
        ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
        ...(userAgent ? { userAgent } : {}),
      },
      "password_change",
    );

    log.info({ userId: auth.userId }, "Password changed; all sessions revoked");

    return jsonOk({
      message: "Password changed. All existing sessions have been revoked — please sign in again.",
    });
  },
);
