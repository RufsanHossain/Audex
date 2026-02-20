// ─── @audex/validators — API Key Schemas ────────────────────────────────────

import { z } from "zod";

import { objectIdSchema, paginationSchema, safeStringSchema } from "./common.js";
import { apiScopeSchema } from "./enums.js";

// ── Create API Key ──────────────────────────────────────────────────────────

export const createApiKeySchema = z.object({
  name: safeStringSchema(2, 100),
  scopes: z.array(apiScopeSchema).min(1, "At least one scope is required").max(10),
  expiresInDays: z.number().int().min(1).max(365).optional(),
  rateLimit: z.number().int().min(10).max(10_000).optional(),
});

// ── Update API Key ──────────────────────────────────────────────────────────

export const updateApiKeySchema = z.object({
  id: objectIdSchema,
  name: safeStringSchema(2, 100).optional(),
  scopes: z.array(apiScopeSchema).min(1).max(10).optional(),
  isActive: z.boolean().optional(),
});

// ── List API Keys ───────────────────────────────────────────────────────────

export const listApiKeysSchema = paginationSchema;

// ── Revoke API Key ──────────────────────────────────────────────────────────

export const revokeApiKeySchema = z.object({
  id: objectIdSchema,
});

// ── Type Exports ────────────────────────────────────────────────────────────

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type UpdateApiKeyInput = z.infer<typeof updateApiKeySchema>;
export type ListApiKeysInput = z.infer<typeof listApiKeysSchema>;
export type RevokeApiKeyInput = z.infer<typeof revokeApiKeySchema>;
