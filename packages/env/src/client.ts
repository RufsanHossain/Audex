import { z } from "zod";

// ─── Client Environment Schema ──────────────────────────────────────────────
// These are NEXT_PUBLIC_ variables exposed to the browser.
// They contain NO secrets — only public-facing configuration.

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().default("https://us.i.posthog.com"),
});

// ─── Parse & Export ─────────────────────────────────────────────────────────

export type ClientEnv = z.infer<typeof clientEnvSchema>;

function parseClientEnv(): ClientEnv {
  // In the browser, process.env is replaced at build time by Next.js.
  // Only NEXT_PUBLIC_ prefixed vars are available.
  const raw: Record<string, string | undefined> = {
    NEXT_PUBLIC_APP_URL: process.env["NEXT_PUBLIC_APP_URL"],
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
    NEXT_PUBLIC_SENTRY_DSN: process.env["NEXT_PUBLIC_SENTRY_DSN"],
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env["NEXT_PUBLIC_GA_MEASUREMENT_ID"],
    NEXT_PUBLIC_POSTHOG_KEY: process.env["NEXT_PUBLIC_POSTHOG_KEY"],
    NEXT_PUBLIC_POSTHOG_HOST: process.env["NEXT_PUBLIC_POSTHOG_HOST"],
  };

  const result = clientEnvSchema.safeParse(raw);

  if (!result.success) {
    console.error("❌ Client environment validation failed:", result.error.issues);
    throw new Error("Client environment validation failed");
  }

  return result.data;
}

/**
 * Type-safe client-side environment variables.
 *
 * These are safe to use in browser code — they contain no secrets.
 * Only NEXT_PUBLIC_ prefixed variables are included.
 */
export const clientEnv: ClientEnv = parseClientEnv();
