// ─── @audex/validators — Project Schemas ────────────────────────────────────

import { z } from "zod";

import {
  objectIdSchema,
  paginationSchema,
  safeStringSchema,
  slugSchema,
  sortOrderSchema,
} from "./common.js";
import { deviceTypeSchema, dimensionIdSchema } from "./enums.js";
import { auditUrlSchema } from "./url-sanitizer.js";

// ── Create Project ──────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: safeStringSchema(2, 100),
  slug: slugSchema.optional(),
  url: auditUrlSchema,
  description: safeStringSchema(0, 500).optional(),
  settings: z
    .object({
      dimensions: z.array(dimensionIdSchema).min(1).max(11).optional(),
      device: deviceTypeSchema.default("desktop"),
      schedule: z
        .object({
          enabled: z.boolean().default(false),
          frequency: z.enum(["daily", "weekly", "monthly"]).default("weekly"),
          time: z
            .string()
            .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be HH:mm format (UTC)")
            .default("06:00"),
        })
        .optional(),
      qualityThreshold: z.number().int().min(0).max(100).optional(),
    })
    .optional(),
});

// ── Update Project ──────────────────────────────────────────────────────────

export const updateProjectSchema = createProjectSchema.partial().extend({
  id: objectIdSchema,
});

// ── List Projects ───────────────────────────────────────────────────────────

export const listProjectsSchema = paginationSchema.extend({
  sort: z.enum(["createdAt", "name", "lastScore"]).default("createdAt"),
  order: sortOrderSchema,
  search: z.string().max(200).optional(),
});

// ── Get / Delete Project ────────────────────────────────────────────────────

export const projectParamsSchema = z.object({
  id: objectIdSchema,
});

// ── Type Exports ────────────────────────────────────────────────────────────

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsInput = z.infer<typeof listProjectsSchema>;
export type ProjectParams = z.infer<typeof projectParamsSchema>;
