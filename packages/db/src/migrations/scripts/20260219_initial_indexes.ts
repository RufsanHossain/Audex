import type { Migration } from "../types.js";
import type { mongo } from "mongoose";
type Db = mongo.Db;

export const migration: Migration = {
  version: "20260219000000",
  description: "Create initial collection indexes",

  async up(db: Db): Promise<void> {
    // ── Users ─────────────────────────────────────────────────────────────
    // email unique index is declared on the schema (User.email: { unique: true })
    // and created by Mongoose autoIndex; not duplicated here.
    await db.collection("users").createIndex(
      { "plan.stripeCustomerId": 1 },
      {
        unique: true,
        sparse: true,
        name: "idx_users_stripe_customer",
      },
    );
    await db.collection("users").createIndex({ role: 1 }, { name: "idx_users_role" });
    await db.collection("users").createIndex({ createdAt: -1 }, { name: "idx_users_created" });

    // ── Reports ───────────────────────────────────────────────────────────
    await db
      .collection("reports")
      .createIndex({ userId: 1, createdAt: -1 }, { name: "idx_reports_user_created" });
    await db
      .collection("reports")
      .createIndex({ status: 1, createdAt: -1 }, { name: "idx_reports_status_created" });
    await db
      .collection("reports")
      .createIndex(
        { projectId: 1, createdAt: -1 },
        { sparse: true, name: "idx_reports_project_created" },
      );

    // ── Projects ──────────────────────────────────────────────────────────
    await db
      .collection("projects")
      .createIndex({ userId: 1, slug: 1 }, { unique: true, name: "idx_projects_user_slug" });
    await db
      .collection("projects")
      .createIndex({ userId: 1, createdAt: -1 }, { name: "idx_projects_user_created" });

    // ── API Keys ──────────────────────────────────────────────────────────
    // keyHash unique index is declared on the schema (ApiKey.keyHash: { unique: true })
    // and created by Mongoose autoIndex; not duplicated here.
    await db
      .collection("apiKeys")
      .createIndex({ userId: 1, isActive: 1 }, { name: "idx_apikeys_user_active" });

    // ── Subscriptions ─────────────────────────────────────────────────────
    // userId unique index is declared on the schema (Subscription.userId: { unique: true })
    // and created by Mongoose autoIndex; not duplicated here.
    await db.collection("subscriptions").createIndex(
      { stripeSubscriptionId: 1 },
      {
        unique: true,
        sparse: true,
        name: "idx_subscriptions_stripe",
      },
    );

    // ── Webhooks ──────────────────────────────────────────────────────────
    await db.collection("webhooks").createIndex({ userId: 1 }, { name: "idx_webhooks_user" });

    // ── Notifications ─────────────────────────────────────────────────────
    await db
      .collection("notifications")
      .createIndex({ userId: 1, read: 1, createdAt: -1 }, { name: "idx_notifications_user_read" });
    await db.collection("notifications").createIndex(
      { createdAt: 1 },
      {
        expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days
        name: "idx_notifications_ttl",
      },
    );

    // ── Audit Logs ────────────────────────────────────────────────────────
    await db
      .collection("auditLogs")
      .createIndex({ userId: 1, action: 1, timestamp: -1 }, { name: "idx_auditlogs_user_action" });
    await db.collection("auditLogs").createIndex(
      { timestamp: 1 },
      {
        expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days
        name: "idx_auditlogs_ttl",
      },
    );
  },

  async down(db: Db): Promise<void> {
    const drops: [string, string][] = [
      ["users", "idx_users_stripe_customer"],
      ["users", "idx_users_role"],
      ["users", "idx_users_created"],
      ["reports", "idx_reports_user_created"],
      ["reports", "idx_reports_status_created"],
      ["reports", "idx_reports_project_created"],
      ["projects", "idx_projects_user_slug"],
      ["projects", "idx_projects_user_created"],
      ["apiKeys", "idx_apikeys_user_active"],
      ["subscriptions", "idx_subscriptions_stripe"],
      ["webhooks", "idx_webhooks_user"],
      ["notifications", "idx_notifications_user_read"],
      ["notifications", "idx_notifications_ttl"],
      ["auditLogs", "idx_auditlogs_user_action"],
      ["auditLogs", "idx_auditlogs_ttl"],
    ];

    for (const [collection, index] of drops) {
      try {
        await db.collection(collection).dropIndex(index);
      } catch {
        // Index may not exist — safe to ignore
      }
    }
  },
};
