// ─── Webhook Model ──────────────────────────────────────────────────────────
// User-configured webhooks for audit events (Team/Enterprise).
// 2 indexes: userId, userId+projectId

import { model, type Model, Schema, type Document, type Types } from "mongoose";

const WEBHOOK_EVENTS = [
  "audit.completed",
  "audit.failed",
  "score.regression",
  "subscription.updated",
  "usage.threshold",
] as const;

export interface IWebhookDoc extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  projectId?: Types.ObjectId;
  url: string;
  secret: string;
  events: (typeof WEBHOOK_EVENTS)[number][];
  description?: string;
  isActive: boolean;
  failureCount: number;
  lastDeliveredAt?: Date;
  lastFailedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookSchema = new Schema<IWebhookDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    url: { type: String, required: true, maxlength: 2048 },
    secret: { type: String, required: true, select: false },
    events: {
      type: [String],
      enum: WEBHOOK_EVENTS,
      required: true,
    },
    description: { type: String, maxlength: 300 },
    isActive: { type: Boolean, default: true },
    failureCount: { type: Number, default: 0 },
    lastDeliveredAt: { type: Date },
    lastFailedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: "webhooks",
  },
);

// ── Indexes ─────────────────────────────────────────────────────────────────

WebhookSchema.index({ userId: 1 });
WebhookSchema.index({ userId: 1, projectId: 1 });

export const Webhook: Model<IWebhookDoc> = model<IWebhookDoc>("Webhook", WebhookSchema);
