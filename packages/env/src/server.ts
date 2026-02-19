import { z } from "zod";

// ─── Schema Helpers ─────────────────────────────────────────────────────────

const requiredUrl = z
  .string()
  .min(1)
  .refine((s) => {
    try {
      new URL(s);
      return true;
    } catch {
      return false;
    }
  }, "Invalid URL");

const requiredString = z.string().min(1, "Required");
const optionalString = z.string().optional();
const port = z.coerce.number().int().min(1).max(65535).default(3000);

// ─── Server Environment Schema ──────────────────────────────────────────────
// Validated at process startup. If any required variable is missing or
// malformed, the process crashes immediately with a descriptive error.

const serverEnvSchema = z.object({
  // ── Core ────────────────────────────────────────────────────────────────
  NODE_ENV: z.enum(["development", "staging", "production", "test"]).default("development"),
  PORT: port,
  APP_URL: requiredUrl.default("http://localhost:3000"),
  APP_VERSION: requiredString.default("0.0.0"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),

  // ── Database ────────────────────────────────────────────────────────────
  MONGODB_URI: requiredString.describe("MongoDB Atlas connection string"),

  // ── Redis ───────────────────────────────────────────────────────────────
  REDIS_URL: requiredString.describe("Upstash Redis connection URL"),
  REDIS_TLS: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),

  // ── Auth ────────────────────────────────────────────────────────────────
  AUTH_SECRET: requiredString.describe("Auth.js signing secret (min 32 chars)"),
  AUTH_URL: requiredUrl.default("http://localhost:3000"),
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  GITHUB_CLIENT_ID: optionalString,
  GITHUB_CLIENT_SECRET: optionalString,

  // ── Stripe ──────────────────────────────────────────────────────────────
  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  STRIPE_PRO_PRICE_ID: optionalString,
  STRIPE_TEAM_PRICE_ID: optionalString,

  // ── AI ──────────────────────────────────────────────────────────────────
  ANTHROPIC_API_KEY: optionalString,

  // ── Storage (Cloudflare R2) ─────────────────────────────────────────────
  R2_ACCESS_KEY_ID: optionalString,
  R2_SECRET_ACCESS_KEY: optionalString,
  R2_BUCKET_NAME: z.string().default("audex-screenshots"),
  R2_ENDPOINT: optionalString,
  R2_CDN_URL: optionalString,

  // ── Email ───────────────────────────────────────────────────────────────
  RESEND_API_KEY: optionalString,
  EMAIL_FROM: z.string().default("Audex <noreply@audex.dev>"),

  // ── Monitoring ──────────────────────────────────────────────────────────
  SENTRY_DSN: optionalString,

  // ── Workers ─────────────────────────────────────────────────────────────
  BROWSER_POOL_SIZE: z.coerce.number().int().min(1).max(10).default(3),
  BROWSER_RECYCLE_AFTER: z.coerce.number().int().min(1).default(50),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(20).default(3),
  HEALTH_PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  MEMORY_LIMIT_MB: z.coerce.number().int().min(256).default(1800),
});

// ─── Parse & Export ─────────────────────────────────────────────────────────

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function parseServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    const missing: string[] = [];
    const invalid: string[] = [];

    for (const issue of result.error.issues) {
      const key = issue.path.join(".");
      if (issue.message === "Required") {
        missing.push(key);
      } else {
        invalid.push(`  ${key}: ${issue.message}`);
      }
    }

    console.error("\n╔═══════════════════════════════════════════════╗");
    console.error("║   ❌ ENVIRONMENT VALIDATION FAILED            ║");
    console.error("╚═══════════════════════════════════════════════╝\n");

    if (missing.length > 0) {
      console.error("Missing required variables:");
      for (const key of missing) {
        console.error(`  → ${key}`);
      }
      console.error("");
    }

    if (invalid.length > 0) {
      console.error("Invalid variables:");
      for (const line of invalid) {
        console.error(line);
      }
      console.error("");
    }

    console.error("Check your .env.local file or deployment environment variables.\n");

    throw new Error(
      `Environment validation failed: ${missing.length} missing, ${invalid.length} invalid`,
    );
  }

  return result.data;
}

/**
 * Type-safe, Zod-validated environment variables.
 *
 * Access anywhere: `import { env } from "@audex/env"`
 *
 * Fails hard at startup if required variables are missing.
 * Optional variables (Stripe, R2, Sentry, etc.) can be undefined
 * in development — feature modules check for them at usage time.
 */
export const env: ServerEnv = parseServerEnv();

// ─── Convenience Helpers ────────────────────────────────────────────────────

export const isDev = env.NODE_ENV === "development";
export const isStaging = env.NODE_ENV === "staging";
export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
