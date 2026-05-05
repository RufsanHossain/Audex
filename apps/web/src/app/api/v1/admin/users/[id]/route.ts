import { connectDb, Report, Subscription, User } from "@audex/db";
import { ApiError, objectIdSchema } from "@audex/validators";
import { Types } from "mongoose";

import { jsonOk, requireAdmin, withHandler } from "../../../../../../lib/api/index.js";

// Mongoose + auth() in withHandler — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── GET /api/v1/admin/users/:id ───────────────────────────────────────────

/**
 * Admin: full user detail. Returns the user document (passwordHash already
 * excluded by `select: false` on the model) plus a small activity summary:
 * total reports, latest report, and subscription record (if any).
 */
export const GET = withHandler({}, async ({ auth, params, log }) => {
  requireAdmin(auth);

  const userId = params["id"];
  if (!userId || !objectIdSchema.safeParse(userId).success) {
    throw ApiError.notFound("User");
  }

  await connectDb();

  const userObjectId = new Types.ObjectId(userId);
  const [user, totalReports, latestReport, subscription] = await Promise.all([
    User.findById(userId).lean(),
    Report.countDocuments({ userId: userObjectId }),
    Report.findOne({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .select("status totalScore grade createdAt completedAt")
      .lean(),
    Subscription.findOne({ userId: userObjectId }).lean(),
  ]);

  if (!user) {
    throw ApiError.notFound("User");
  }

  log.debug({ userId, totalReports }, "Admin fetched user detail");

  return jsonOk({
    user,
    activity: {
      totalReports,
      latestReport,
    },
    subscription,
  });
});
