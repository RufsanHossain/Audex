import { connectDb, Notification } from "@audex/db";
import { listNotificationsSchema } from "@audex/validators";
import { Types } from "mongoose";

import { jsonOk, withHandler } from "../../../../lib/api/index.js";

import type { ListNotificationsInput } from "@audex/validators";

// Mongoose + auth() in withHandler — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── GET /api/v1/notifications ─────────────────────────────────────────────

/**
 * List the authenticated user's notifications with pagination and an
 * optional unread filter.
 *
 * Query params:
 *   - page (default 1)
 *   - limit (default 20, max 100)
 *   - unread=true|false (optional — filters by read status)
 *
 * Sorted by createdAt desc. The collection has a 90-day TTL on createdAt,
 * so older notifications are auto-deleted by MongoDB.
 */
export const GET = withHandler({ query: listNotificationsSchema }, async ({ auth, query, log }) => {
  const q = query as ListNotificationsInput;

  await connectDb();

  const filter: Record<string, unknown> = { userId: new Types.ObjectId(auth.userId) };
  if (q.unread === true) filter["read"] = false;
  else if (q.unread === false) filter["read"] = true;

  const skip = (q.page - 1) * q.limit;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(q.limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: new Types.ObjectId(auth.userId), read: false }),
  ]);

  log.debug({ count: items.length, total, unreadCount }, "Listed notifications");

  return jsonOk({
    items,
    unreadCount,
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
