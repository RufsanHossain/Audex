// ─── Notification Model ─────────────────────────────────────────────────────
// In-app notifications for audit completions, billing events, etc.
// 2 indexes: userId+read+createdAt, createdAt (TTL: 90 days)

import { model, type Model, Schema, type Document, type Types } from "mongoose";

export interface INotificationDoc extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotificationDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true, maxlength: 50 },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 500 },
    link: { type: String, maxlength: 500 },
    read: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "notifications",
  },
);

// ── Indexes ─────────────────────────────────────────────────────────────────

// User's unread notifications first
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

// TTL: auto-delete after 90 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const Notification: Model<INotificationDoc> = model<INotificationDoc>(
  "Notification",
  NotificationSchema,
);
