// ─── Embedded Dimension Result Schema ───────────────────────────────────────
// Used as a Map value inside the Report model.

import { Schema } from "mongoose";

import { FindingSchema } from "./finding.schema.js";

import type { IFindingDoc } from "./finding.schema.js";

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

export interface IDimensionResultDoc {
  dimension: (typeof DIMENSION_IDS)[number];
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  findings: IFindingDoc[];
  metrics: Map<string, number | string | boolean>;
  summary: string;
  topPriority: string;
  executionTimeMs: number;
  status: "success" | "error" | "timeout";
}

export const DimensionResultSchema = new Schema<IDimensionResultDoc>(
  {
    dimension: { type: String, required: true, enum: DIMENSION_IDS },
    score: { type: Number, required: true, min: 0, max: 100 },
    grade: { type: String, required: true, enum: ["A", "B", "C", "D", "F"] },
    findings: { type: [FindingSchema], default: [] },
    metrics: { type: Map, of: Schema.Types.Mixed, default: new Map() },
    summary: { type: String, default: "" },
    topPriority: { type: String, default: "" },
    executionTimeMs: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: ["success", "error", "timeout"],
      default: "success",
    },
  },
  { _id: false },
);
