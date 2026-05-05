import { connectDb, Notification } from "@audex/db";
import { Types } from "mongoose";

import { jsonOk, withHandler } from "../../../../../lib/api/index.js";

// Mongoose + auth() in withHandler — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── GET /api/v1/notifications/unread-count ────────────────────────────────

/**
 * Return the count of unread notifications for the authenticated user.
 * Cheap — relies on the userId+read+createdAt compound index.
 */
export const GET = withHandler({}, async ({ auth, log }) => {
  await connectDb();

  const count = await Notification.countDocuments({
    userId: new Types.ObjectId(auth.userId),
    read: false,
  });

  log.debug({ count }, "Unread notification count");

  return jsonOk({ count });
});
