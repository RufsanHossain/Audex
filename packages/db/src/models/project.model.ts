// ─── Project Model ──────────────────────────────────────────────────────────
// Groups audits under a named project with scheduling + alert settings.
// 2 indexes: userId+slug (compound unique), userId+updatedAt

import { model, type Model, Schema, type Document, type Types } from "mongoose";

const DIMENSION_IDS = [
  "security",
  "performance",
  "accessibility",
  "seo",
  "speed",
  "best-practices",
  "ui",
  "ux",
  "privacy",
  "network",
  "memory",
] as const;

export interface IProjectDoc extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  slug: string;
  url: string;
  description?: string;
  settings: {
    dimensions: string[];
    device: "mobile" | "desktop";
    schedule?: {
      enabled: boolean;
      frequency: "daily" | "weekly" | "monthly";
      time: string;
    };
    qualityThreshold?: number;
  };
  lastAuditId?: Types.ObjectId;
  lastScore?: number;
  reportCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProjectDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, trim: true, maxlength: 60 },
    url: { type: String, required: true, maxlength: 2048 },
    description: { type: String, maxlength: 500 },
    settings: {
      dimensions: {
        type: [String],
        enum: DIMENSION_IDS,
        default: [...DIMENSION_IDS],
      },
      device: { type: String, enum: ["mobile", "desktop"], default: "desktop" },
      schedule: {
        enabled: { type: Boolean, default: false },
        frequency: { type: String, enum: ["daily", "weekly", "monthly"], default: "weekly" },
        time: { type: String, default: "06:00" },
      },
      qualityThreshold: { type: Number, min: 0, max: 100 },
    },
    lastAuditId: { type: Schema.Types.ObjectId, ref: "Report" },
    lastScore: { type: Number, min: 0, max: 100 },
    reportCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: "projects",
  },
);

// ── Indexes ─────────────────────────────────────────────────────────────────

// Unique slug per user
ProjectSchema.index({ userId: 1, slug: 1 }, { unique: true });

// User's projects by activity
ProjectSchema.index({ userId: 1, updatedAt: -1 });

export const Project: Model<IProjectDoc> = model<IProjectDoc>("Project", ProjectSchema);
