// ─── Subscription Model ─────────────────────────────────────────────────────
// Tracks Stripe billing state. One per user (unique userId).
// 3 indexes: userId (unique), stripeSubscriptionId, auditUsage.resetDate

import { model, type Model, Schema, type Document, type Types } from "mongoose";

export interface ISubscriptionDoc extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: "active" | "past_due" | "canceled" | "trialing" | "incomplete" | "unpaid" | "paused";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  auditUsage: {
    used: number;
    limit: number;
    resetDate: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscriptionDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    stripeCustomerId: { type: String, required: true },
    stripeSubscriptionId: { type: String, required: true },
    stripePriceId: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["active", "past_due", "canceled", "trialing", "incomplete", "unpaid", "paused"],
      default: "active",
    },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    auditUsage: {
      used: { type: Number, default: 0 },
      limit: { type: Number, required: true },
      resetDate: { type: Date, required: true },
    },
  },
  {
    timestamps: true,
    collection: "subscriptions",
  },
);

// ── Indexes ─────────────────────────────────────────────────────────────────

// userId unique is handled by `unique: true` above
SubscriptionSchema.index({ stripeSubscriptionId: 1 });
SubscriptionSchema.index({ "auditUsage.resetDate": 1 });

export const Subscription: Model<ISubscriptionDoc> = model<ISubscriptionDoc>(
  "Subscription",
  SubscriptionSchema,
);
