// ─── @audex/validators — Enum Schemas ───────────────────────────────────────
// Zod schemas that mirror every enum in @audex/types.
// These are used for runtime validation of API inputs.

import { z } from "zod";

// ── Dimensions ──────────────────────────────────────────────────────────────

export const dimensionIdSchema = z.enum([
  "security",
  "performance",
  "accessibility",
  "seo",
  "speed",
  "best-practices",
  "ui",
  "ux",
  "privacy",
  "network",
  "memory",
]);

// ── Scoring ─────────────────────────────────────────────────────────────────

export const gradeSchema = z.enum(["A", "B", "C", "D", "F"]);

export const findingSeveritySchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

export const impactMultiplierSchema = z.union([
  z.literal(0.5),
  z.literal(0.7),
  z.literal(1.0),
  z.literal(1.5),
]);

// ── Audit Lifecycle ─────────────────────────────────────────────────────────

export const auditStatusSchema = z.enum([
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled",
]);

export const auditInputTypeSchema = z.enum(["url", "code"]);

export const deviceTypeSchema = z.enum(["desktop", "mobile"]);

// ── Engine Status ───────────────────────────────────────────────────────────

export const engineStatusSchema = z.enum([
  "pending",
  "running",
  "complete",
  "error",
  "timeout",
  "skipped",
]);

// ── User & Auth ─────────────────────────────────────────────────────────────

export const userRoleSchema = z.enum(["free", "pro", "team", "enterprise", "admin"]);

export const planTierSchema = z.enum(["free", "pro", "team", "enterprise"]);

export const authProviderSchema = z.enum(["credentials", "google", "github"]);

// ── Billing ─────────────────────────────────────────────────────────────────

export const subscriptionStatusSchema = z.enum([
  "active",
  "past_due",
  "canceled",
  "trialing",
  "incomplete",
  "incomplete_expired",
  "unpaid",
  "paused",
]);

// ── API Keys ────────────────────────────────────────────────────────────────

export const apiScopeSchema = z.enum([
  "audit:create",
  "audit:read",
  "report:read",
  "report:export",
  "project:read",
  "project:write",
]);

// ── Export ───────────────────────────────────────────────────────────────────

export const exportFormatSchema = z.enum(["pdf", "json", "csv", "html"]);

// ── Notification ────────────────────────────────────────────────────────────

export const notificationChannelSchema = z.enum(["email", "in-app", "webhook"]);

// ── Webhook Events ──────────────────────────────────────────────────────────

export const webhookEventSchema = z.enum([
  "audit.completed",
  "audit.failed",
  "score.regression",
  "subscription.updated",
  "usage.threshold",
]);

// ── Audit Source ────────────────────────────────────────────────────────────

export const auditSourceSchema = z.enum(["web", "api", "ci", "scheduled"]);

// ── Error Codes (matches API contract) ──────────────────────────────────────

export const errorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "AUDIT_LIMIT_EXCEEDED",
  "INTERNAL_ERROR",
  "SERVICE_UNAVAILABLE",
  "PAYLOAD_TOO_LARGE",
]);
