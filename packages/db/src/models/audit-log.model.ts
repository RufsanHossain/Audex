// ─── AuditLog Model ────────────────────────────────────────────────────────
// Immutable security audit trail for all sensitive actions.
// 3 indexes: userId+timestamp, timestamp (90-day TTL), action+timestamp

import { model, type Model, Schema, type Document, type Types } from "mongoose";

export interface IAuditLogDoc extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  action: string;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLogDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true, maxlength: 100 },
    ipAddress: { type: String, required: true, maxlength: 45 },
    userAgent: { type: String, maxlength: 500 },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, required: true, default: Date.now },
  },
  {
    // No timestamps — we use explicit `timestamp` field
    collection: "auditlogs",
  },
);

// ── Indexes ─────────────────────────────────────────────────────────────────

// User's activity log
AuditLogSchema.index({ userId: 1, timestamp: -1 });

// TTL index: auto-delete after 90 days
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Admin filtering by action type
AuditLogSchema.index({ action: 1, timestamp: -1 });

export const AuditLog: Model<IAuditLogDoc> = model<IAuditLogDoc>("AuditLog", AuditLogSchema);
