// ─── @audex/validators — Webhook Schemas ────────────────────────────────────

import { z } from "zod";

import { objectIdSchema, paginationSchema, safeStringSchema } from "./common.js";
import { webhookEventSchema } from "./enums.js";

// ── Create Webhook ──────────────────────────────────────────────────────────

export const createWebhookSchema = z.object({
  url: z.string().url("Invalid webhook URL").max(2048),
  events: z.array(webhookEventSchema).min(1, "At least one event is required").max(10),
  projectId: objectIdSchema.optional(),
  description: safeStringSchema(0, 300).optional(),
  isActive: z.boolean().default(true),
});

// ── Update Webhook ──────────────────────────────────────────────────────────

export const updateWebhookSchema = z.object({
  id: objectIdSchema,
  url: z.string().url().max(2048).optional(),
  events: z.array(webhookEventSchema).min(1).max(10).optional(),
  description: safeStringSchema(0, 300).optional(),
  isActive: z.boolean().optional(),
});

// ── List Webhooks ───────────────────────────────────────────────────────────

export const listWebhooksSchema = paginationSchema.extend({
  projectId: objectIdSchema.optional(),
});

// ── Delete Webhook ──────────────────────────────────────────────────────────

export const deleteWebhookSchema = z.object({
  id: objectIdSchema,
});

// ── Test Webhook ────────────────────────────────────────────────────────────

export const testWebhookSchema = z.object({
  id: objectIdSchema,
});

// ── Type Exports ────────────────────────────────────────────────────────────

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;
export type ListWebhooksInput = z.infer<typeof listWebhooksSchema>;
export type DeleteWebhookInput = z.infer<typeof deleteWebhookSchema>;
export type TestWebhookInput = z.infer<typeof testWebhookSchema>;
