// ─── @audex/validators — Notification Schemas ──────────────────────────────

import { z } from "zod";

import { objectIdSchema, paginationSchema } from "./common.js";

// ── List Notifications ──────────────────────────────────────────────────────

export const listNotificationsSchema = paginationSchema.extend({
  unread: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
});

// ── Mark Read (params) ──────────────────────────────────────────────────────

export const notificationParamsSchema = z.object({
  id: objectIdSchema,
});

// ── Type Exports ────────────────────────────────────────────────────────────

export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;
export type NotificationParams = z.infer<typeof notificationParamsSchema>;
