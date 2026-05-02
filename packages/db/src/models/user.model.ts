// ─── User Model ─────────────────────────────────────────────────────────────
// 4 indexes: email (unique), plan.stripeCustomerId (sparse), role, createdAt

import { model, type Model, Schema, type Document, type Types } from "mongoose";

// ── Interface ───────────────────────────────────────────────────────────────

export interface IUserDoc extends Document {
  _id: Types.ObjectId;
  email: string;
  name: string;
  image?: string;
  passwordHash?: string;
  emailVerified?: Date;
  role: "free" | "pro" | "team" | "enterprise" | "admin";
  plan: {
    tier: "free" | "pro" | "team" | "enterprise";
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodEnd?: Date;
  };
  auditCount: number;
  auditLimit: number;
  settings: {
    defaultDevice: "mobile" | "desktop";
    notifications: {
      auditComplete: boolean;
      weeklyDigest: boolean;
      billing: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ──────────────────────────────────────────────────────────────────

const UserSchema = new Schema<IUserDoc>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    image: { type: String },
    passwordHash: { type: String, select: false },
    emailVerified: { type: Date },
    role: {
      type: String,
      enum: ["free", "pro", "team", "enterprise", "admin"],
      default: "free",
    },
    plan: {
      tier: {
        type: String,
        enum: ["free", "pro", "team", "enterprise"],
        default: "free",
      },
      stripeCustomerId: { type: String },
      stripeSubscriptionId: { type: String },
      currentPeriodEnd: { type: Date },
    },
    auditCount: { type: Number, default: 0 },
    auditLimit: { type: Number, default: 3 },
    settings: {
      defaultDevice: { type: String, enum: ["mobile", "desktop"], default: "desktop" },
      notifications: {
        auditComplete: { type: Boolean, default: true },
        weeklyDigest: { type: Boolean, default: true },
        billing: { type: Boolean, default: true },
      },
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

// ── Indexes ─────────────────────────────────────────────────────────────────
// email unique is handled by `unique: true` above
UserSchema.index({ "plan.stripeCustomerId": 1 }, { sparse: true });
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });

// ── Export ───────────────────────────────────────────────────────────────────

export const User: Model<IUserDoc> = model<IUserDoc>("User", UserSchema);
