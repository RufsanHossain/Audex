// Next.js runtime instrumentation hook. Initialises Sentry once per server
// or edge worker boot. Routes the appropriate Sentry SDK based on
// `NEXT_RUNTIME` so node-only modules don't leak into the edge bundle.
//
// When SENTRY_DSN is unset (dev / test / preview without monitoring),
// Sentry.init becomes a no-op — every Sentry.captureException call is
// safe regardless of whether the SDK is configured.

import * as Sentry from "@sentry/nextjs";

const TRACES_SAMPLE_RATE = process.env.NODE_ENV === "production" ? 0.1 : 1.0;

export function register(): void {
  const dsn = process.env["SENTRY_DSN"];
  if (!dsn) return;

  const common = {
    dsn,
    environment: process.env.NODE_ENV,
    release: process.env["APP_VERSION"],
    tracesSampleRate: TRACES_SAMPLE_RATE,
  };

  if (process.env["NEXT_RUNTIME"] === "nodejs") {
    Sentry.init({
      ...common,
      // Profiling is opt-in; performance traces are enough for the free tier.
      profilesSampleRate: 0,
    });
  } else if (process.env["NEXT_RUNTIME"] === "edge") {
    Sentry.init(common);
  }
}

export const onRequestError = Sentry.captureRequestError;
