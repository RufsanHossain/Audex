// ─── @audex/validators — Admin Schemas ──────────────────────────────────────

import { z } from "zod";

import { paginationSchema } from "./common.js";

// ── DLQ ─────────────────────────────────────────────────────────────────────

export const dlqQueueSchema = z.enum([
  "audit:url",
  "audit:code",
  "notifications",
  "exports",
  "scheduled",
]);

export const listDlqJobsSchema = paginationSchema.extend({
  queue: dlqQueueSchema,
});

export const dlqJobActionSchema = z.object({
  queue: dlqQueueSchema,
  jobId: z.string().min(1).max(200),
});

// ── Type Exports ────────────────────────────────────────────────────────────

export type DlqQueue = z.infer<typeof dlqQueueSchema>;
export type ListDlqJobsInput = z.infer<typeof listDlqJobsSchema>;
export type DlqJobActionInput = z.infer<typeof dlqJobActionSchema>;
