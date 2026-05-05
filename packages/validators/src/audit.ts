// ─── @audex/validators — Audit Schemas ──────────────────────────────────────
// Request/response validation for audit endpoints.

import { z } from "zod";

import { objectIdSchema, paginationSchema, sortOrderSchema } from "./common.js";
import {
  auditInputTypeSchema,
  auditSourceSchema,
  auditStatusSchema,
  deviceTypeSchema,
  dimensionIdSchema,
} from "./enums.js";
import { codeUploadSchema } from "./file-path.js";
import { auditUrlSchema } from "./url-sanitizer.js";

// ── Create Audit (URL Mode) ─────────────────────────────────────────────────

export const createUrlAuditSchema = z.object({
  type: z.literal("url"),
  url: auditUrlSchema,
  device: deviceTypeSchema.default("desktop"),
  projectId: objectIdSchema.optional(),
  dimensions: z.array(dimensionIdSchema).min(1, "Select at least one dimension").max(11).optional(),
  source: auditSourceSchema.default("web"),
  callbackUrl: z.string().url().max(2048).optional(),
  metadata: z.record(z.string().max(200)).optional(),
});

// ── Create Audit (Code Mode) ────────────────────────────────────────────────

export const createCodeAuditSchema = z.object({
  type: z.literal("code"),
  code: codeUploadSchema,
  device: deviceTypeSchema.default("desktop"),
  projectId: objectIdSchema.optional(),
  dimensions: z.array(dimensionIdSchema).min(1, "Select at least one dimension").max(11).optional(),
  source: auditSourceSchema.default("web"),
  callbackUrl: z.string().url().max(2048).optional(),
  metadata: z.record(z.string().max(200)).optional(),
});

// ── Create Audit (Discriminated Union) ──────────────────────────────────────

export const createAuditSchema = z.discriminatedUnion("type", [
  createUrlAuditSchema,
  createCodeAuditSchema,
]);

// ── List Audits (Query Params) ──────────────────────────────────────────────

export const listAuditsSchema = paginationSchema.extend({
  status: auditStatusSchema.optional(),
  type: auditInputTypeSchema.optional(),
  projectId: objectIdSchema.optional(),
  sort: z.enum(["createdAt", "totalScore", "duration"]).default("createdAt"),
  order: sortOrderSchema,
  search: z.string().max(200).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

// ── Get Single Audit ────────────────────────────────────────────────────────

export const getAuditParamsSchema = z.object({
  id: objectIdSchema,
});

// ── Cancel Audit ────────────────────────────────────────────────────────────

export const cancelAuditSchema = z.object({
  id: objectIdSchema,
  reason: z.string().max(500).optional(),
});

// ── Retry Audit ─────────────────────────────────────────────────────────────

export const retryAuditSchema = z.object({
  id: objectIdSchema,
});

// ── Export Report ───────────────────────────────────────────────────────────

export const exportReportSchema = z.object({
  id: objectIdSchema,
  format: z.enum(["pdf", "json", "csv", "html"]),
});

// ── Compare Audits ──────────────────────────────────────────────────────────

export const compareAuditsSchema = z.object({
  baseAuditId: objectIdSchema,
  compareAuditId: objectIdSchema,
});

// ── Share Report ────────────────────────────────────────────────────────────

export const shareReportSchema = z.object({
  // Public reports are listed (e.g. could be indexed); unlisted are
  // accessible by anyone with the link but not advertised.
  access: z.enum(["public", "unlisted"]),
});

// ── Type Exports ────────────────────────────────────────────────────────────

export type CreateUrlAuditInput = z.infer<typeof createUrlAuditSchema>;
export type CreateCodeAuditInput = z.infer<typeof createCodeAuditSchema>;
export type CreateAuditInput = z.infer<typeof createAuditSchema>;
export type ListAuditsInput = z.infer<typeof listAuditsSchema>;
export type GetAuditParams = z.infer<typeof getAuditParamsSchema>;
export type CancelAuditInput = z.infer<typeof cancelAuditSchema>;
export type RetryAuditInput = z.infer<typeof retryAuditSchema>;
export type ExportReportInput = z.infer<typeof exportReportSchema>;
export type CompareAuditsInput = z.infer<typeof compareAuditsSchema>;
export type ShareReportInput = z.infer<typeof shareReportSchema>;
