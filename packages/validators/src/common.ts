// ─── @audex/validators — Common Schemas ─────────────────────────────────────
// Shared primitives reused across all domain schemas.

import { z } from "zod";

// ── Primitives ──────────────────────────────────────────────────────────────

/** MongoDB ObjectId as a 24-char hex string */
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId format");

/** ISO 8601 datetime string */
export const isoDateSchema = z.string().datetime({ offset: true });

/** Safe email — trimmed, lowercased, max 254 chars */
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(254, "Email too long")
  .transform((val) => val.trim().toLowerCase());

/** Non-empty trimmed string with configurable limits */
export const safeStringSchema = (min = 1, max = 500) =>
  z
    .string()
    .min(min, `Must be at least ${min} character(s)`)
    .max(max, `Must be at most ${max} character(s)`)
    .transform((val) => val.trim());

/** Slug: lowercase alphanumeric + hyphens, 3–60 chars */
export const slugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(60, "Slug must be at most 60 characters")
  .regex(/^[a-z\d][a-z\d-]*[a-z\d]$/, "Slug must be lowercase letters, numbers, and hyphens only")
  .refine((val) => !val.includes("--"), "Slug cannot contain consecutive hyphens");

// ── Pagination ──────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const cursorPaginationSchema = z.object({
  cursor: objectIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/** Sort direction */
export const sortOrderSchema = z.enum(["asc", "desc"]).default("desc");

// ── Response Envelopes ──────────────────────────────────────────────────────

/** Pagination metadata returned in list responses */
export const paginationMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  hasMore: z.boolean(),
});

/** Standard success response wrapper */
export const apiSuccessSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: paginationMetaSchema.optional(),
  });

/** Standard error response wrapper */
export const apiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.array(z.string())).optional(),
  }),
});

// ── Reusable Fragments ──────────────────────────────────────────────────────

/** Timestamps added by Mongoose */
export const timestampsSchema = z.object({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/** Base document shape for all Mongoose models */
export const baseDocumentSchema = z.object({
  _id: objectIdSchema,
});
