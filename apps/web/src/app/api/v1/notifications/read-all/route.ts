import { connectDb, Notification } from "@audex/db";
import { Types } from "mongoose";

import { jsonOk, withHandler } from "../../../../../lib/api/index.js";

// Mongoose + auth() in withHandler — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── POST /api/v1/notifications/read-all ───────────────────────────────────

/**
 * Mark every unread notification for the authenticated user as read.
 * Returns the number of records updated.
 */
export const POST = withHandler({}, async ({ auth, log }) => {
  await connectDb();

  const result = await Notification.updateMany(
    { userId: new Types.ObjectId(auth.userId), read: false },
    { read: true },
  );

  log.info({ updated: result.modifiedCount }, "All notifications marked read");

  return jsonOk({ updated: result.modifiedCount });
});
