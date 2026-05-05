import { connectDb, Notification } from "@audex/db";
import { ApiError, objectIdSchema } from "@audex/validators";
import { Types } from "mongoose";

import { jsonOk, withHandler } from "../../../../../../lib/api/index.js";

// Mongoose + auth() in withHandler — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── POST /api/v1/notifications/:id/read ───────────────────────────────────

/**
 * Mark a single notification as read.
 *
 * Idempotent — re-reading an already-read notification returns the same
 * 200 response. Ownership enforced via the filter (no global lookup +
 * separate ownership check).
 */
export const POST = withHandler({}, async ({ auth, params, log }) => {
  const notificationId = params["id"];
  if (!notificationId || !objectIdSchema.safeParse(notificationId).success) {
    throw ApiError.notFound("Notification");
  }

  await connectDb();

  const result = await Notification.findOneAndUpdate(
    { _id: new Types.ObjectId(notificationId), userId: new Types.ObjectId(auth.userId) },
    { read: true },
    { new: true },
  ).lean();

  if (!result) {
    throw ApiError.notFound("Notification");
  }

  log.debug({ notificationId }, "Notification marked read");

  return jsonOk(result);
});
