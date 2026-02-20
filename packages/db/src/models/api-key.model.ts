// ─── ApiKey Model ───────────────────────────────────────────────────────────
// Stores hashed API keys for Team/Enterprise API access.
// 2 indexes: keyHash (unique), userId

import { model, type Model, Schema, type Document, type Types } from "mongoose";

const API_SCOPES = [
  "audit:create",
  "audit:read",
  "report:read",
  "report:export",
  "project:read",
  "project:write",
] as const;

export interface IApiKeyDoc extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  keyHash: string;
  keyPrefix: string;
  scopes: (typeof API_SCOPES)[number][];
  rateLimit: number;
  lastUsedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
}

const ApiKeySchema = new Schema<IApiKeyDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    keyHash: { type: String, required: true, unique: true, select: false },
    keyPrefix: { type: String, required: true, maxlength: 12 },
    scopes: {
      type: [String],
      enum: API_SCOPES,
      required: true,
    },
    rateLimit: { type: Number, default: 100, min: 10, max: 10_000 },
    lastUsedAt: { type: Date },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "apikeys",
  },
);

// ── Indexes ─────────────────────────────────────────────────────────────────

// keyHash unique is handled by `unique: true` above
ApiKeySchema.index({ userId: 1 });

export const ApiKey: Model<IApiKeyDoc> = model<IApiKeyDoc>("ApiKey", ApiKeySchema);
