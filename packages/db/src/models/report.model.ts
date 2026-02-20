// ─── Report Model ───────────────────────────────────────────────────────────
// The central document — one per audit. Contains all 11 dimension results
// embedded as a Map. Avg doc size: ~45KB.
// 4 indexes: userId+createdAt, projectId+createdAt, status, createdAt (TTL)

import { model, type Model, Schema, type Document, type Types } from "mongoose";

import { DimensionResultSchema } from "../schemas/dimension-result.schema.js";

import type { IDimensionResultDoc } from "../schemas/dimension-result.schema.js";

// ── Interface ───────────────────────────────────────────────────────────────

export interface IReportDoc extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  projectId?: Types.ObjectId;
  inputType: "url" | "code";
  inputValue: string;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  device: "mobile" | "desktop";
  source: "web" | "api" | "ci" | "scheduled";
  totalScore?: number;
  grade?: "A" | "B" | "C" | "D" | "F";
  dimensions: Map<string, IDimensionResultDoc>;
  metadata: {
    url?: string;
    statusCode?: number;
    redirectChain?: string[];
    responseTimeMs?: number;
    screenshotUrls?: {
      desktop?: string;
      tablet?: string;
      mobile?: string;
    };
    lighthouseVersion?: string;
    userAgent?: string;
  };
  error?: {
    code: string;
    message: string;
    dimension?: string;
  };
  completedAt?: Date;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ──────────────────────────────────────────────────────────────────

const ReportSchema = new Schema<IReportDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    inputType: { type: String, required: true, enum: ["url", "code"] },
    inputValue: { type: String, required: true, maxlength: 2048 },
    status: {
      type: String,
      required: true,
      enum: ["queued", "processing", "completed", "failed", "cancelled"],
      default: "queued",
    },
    device: { type: String, required: true, enum: ["mobile", "desktop"], default: "desktop" },
    source: {
      type: String,
      required: true,
      enum: ["web", "api", "ci", "scheduled"],
      default: "web",
    },
    totalScore: { type: Number, min: 0, max: 100 },
    grade: { type: String, enum: ["A", "B", "C", "D", "F"] },
    dimensions: {
      type: Map,
      of: DimensionResultSchema,
      default: new Map(),
    },
    metadata: {
      url: { type: String },
      statusCode: { type: Number },
      redirectChain: { type: [String], default: undefined },
      responseTimeMs: { type: Number },
      screenshotUrls: {
        desktop: { type: String },
        tablet: { type: String },
        mobile: { type: String },
      },
      lighthouseVersion: { type: String },
      userAgent: { type: String },
    },
    error: {
      code: { type: String },
      message: { type: String },
      dimension: { type: String },
    },
    completedAt: { type: Date },
    duration: { type: Number },
  },
  {
    timestamps: true,
    collection: "reports",
  },
);

// ── Indexes ─────────────────────────────────────────────────────────────────

// User's reports newest first (dashboard listing)
ReportSchema.index({ userId: 1, createdAt: -1 });

// Project's audit history
ReportSchema.index({ projectId: 1, createdAt: -1 });

// Queue monitoring (find queued/processing jobs)
ReportSchema.index({ status: 1 });

// TTL — free tier 30-day retention (set via migration, not here,
// because TTL value differs per environment). Placeholder index:
ReportSchema.index({ createdAt: 1 });

// ── Export ───────────────────────────────────────────────────────────────────

export const Report: Model<IReportDoc> = model<IReportDoc>("Report", ReportSchema);
