import { connectDb, User } from "@audex/db";
import { logSettingsChange } from "@audex/infra";
import { ApiError, updateMeSchema } from "@audex/validators";

import { jsonOk, withHandler } from "../../../../../lib/api/index.js";

// Mongoose + auth() in withHandler — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── GET /api/v1/users/me ──────────────────────────────────────────────────

/**
 * Return the authenticated user's profile.
 *
 * `passwordHash` is excluded by the model's `select: false` flag, so it
 * never reaches the wire even if a default projection is used elsewhere.
 */
export const GET = withHandler({}, async ({ auth, log }) => {
  await connectDb();

  const user = await User.findById(auth.userId).lean();
  if (!user) {
    throw ApiError.notFound("User");
  }

  log.debug({ userId: auth.userId }, "Fetched user profile");

  return jsonOk(user);
});

// ─── PATCH /api/v1/users/me ────────────────────────────────────────────────

/**
 * Update the authenticated user's profile and/or settings.
 *
 * Accepts any subset of: name, image, settings (defaultDevice + notifications).
 * Settings are merged field-by-field so partial updates don't clobber unrelated
 * preferences.
 */
export const PATCH = withHandler(
  { body: updateMeSchema },
  async ({ auth, body: input, log, req }) => {
    await connectDb();

    const user = await User.findById(auth.userId);
    if (!user) {
      throw ApiError.notFound("User");
    }

    if (input.name !== undefined) user.name = input.name;
    if (input.image !== undefined) user.image = input.image;
    if (input.settings) {
      if (input.settings.defaultDevice !== undefined) {
        user.settings.defaultDevice = input.settings.defaultDevice;
      }
      if (input.settings.notifications) {
        user.settings.notifications = {
          ...user.settings.notifications,
          ...input.settings.notifications,
        };
      }
    }

    await user.save();

    const userAgent = req.headers.get("user-agent");
    logSettingsChange(
      {
        userId: auth.userId,
        ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
        ...(userAgent ? { userAgent } : {}),
      },
      { fields: Object.keys(input) },
    );

    log.info({ userId: auth.userId, fields: Object.keys(input) }, "User profile updated");

    return jsonOk(user.toJSON());
  },
);
