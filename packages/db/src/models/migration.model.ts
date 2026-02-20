// ─── Migration Model ────────────────────────────────────────────────────────
// Tracks applied database migrations. Used by the migration CLI (Step 26).

import { model, type Model, Schema, type Document } from "mongoose";

export interface IMigrationDoc extends Document {
  name: string;
  appliedAt: Date;
}

const MigrationSchema = new Schema<IMigrationDoc>(
  {
    name: { type: String, required: true, unique: true },
    appliedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "migrations",
  },
);

export const Migration: Model<IMigrationDoc> = model<IMigrationDoc>("Migration", MigrationSchema);
