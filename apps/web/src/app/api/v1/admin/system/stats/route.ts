import { ApiKey, AuditLog, connectDb, Notification, Project, Report, User } from "@audex/db";

import { jsonOk, requireAdmin, withHandler } from "../../../../../../lib/api/index.js";

// Mongoose + auth() in withHandler — must run on Node, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

// ─── GET /api/v1/admin/system/stats ────────────────────────────────────────

/**
 * Admin: top-level system counts. Cheap aggregate counts only — does NOT
 * scan large collections. Suitable for a small dashboard hero.
 */
export const GET = withHandler({}, async ({ auth, log }) => {
  requireAdmin(auth);

  await connectDb();

  const since24h = new Date(Date.now() - DAY_MS);
  const since7d = new Date(Date.now() - 7 * DAY_MS);

  const [
    totalUsers,
    usersLast24h,
    totalReports,
    reportsLast24h,
    reportsCompleted,
    reportsFailed,
    totalProjects,
    apiKeys,
    notificationsUnread,
    auditLogsLast7d,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ createdAt: { $gte: since24h } }),
    Report.countDocuments({}),
    Report.countDocuments({ createdAt: { $gte: since24h } }),
    Report.countDocuments({ status: "completed" }),
    Report.countDocuments({ status: "failed" }),
    Project.countDocuments({}),
    ApiKey.countDocuments({ isActive: true }),
    Notification.countDocuments({ read: false }),
    AuditLog.countDocuments({ timestamp: { $gte: since7d } }),
  ]);

  log.debug({ totalUsers, totalReports }, "Admin fetched system stats");

  return jsonOk({
    users: { total: totalUsers, last24h: usersLast24h },
    reports: {
      total: totalReports,
      last24h: reportsLast24h,
      completed: reportsCompleted,
      failed: reportsFailed,
    },
    projects: { total: totalProjects },
    apiKeys: { active: apiKeys },
    notifications: { unread: notificationsUnread },
    auditLogs: { last7d: auditLogsLast7d },
    generatedAt: new Date().toISOString(),
  });
});
