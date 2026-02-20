// ─── Embedded Finding Schema ────────────────────────────────────────────────
// Used within DimensionResult. Represents a single rule violation.

import { Schema } from "mongoose";

export interface IFindingDoc {
  ruleId: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  impactArea: "core" | "standard" | "supporting" | "minor";
  title: string;
  description: string;
  recommendation: string;
  element?: string;
  codeSnippet?: string;
  helpUrl?: string;
  instances?: number;
  deduction: number;
}

export const FindingSchema = new Schema<IFindingDoc>(
  {
    ruleId: { type: String, required: true },
    severity: {
      type: String,
      required: true,
      enum: ["critical", "high", "medium", "low", "info"],
    },
    impactArea: {
      type: String,
      required: true,
      enum: ["core", "standard", "supporting", "minor"],
    },
    title: { type: String, required: true, maxlength: 80 },
    description: { type: String, required: true, maxlength: 500 },
    recommendation: { type: String, required: true, maxlength: 500 },
    element: { type: String },
    codeSnippet: { type: String },
    helpUrl: { type: String },
    instances: { type: Number, default: 1 },
    deduction: { type: Number, required: true },
  },
  { _id: false },
);
