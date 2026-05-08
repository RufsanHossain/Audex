// Browser-side Sentry init. Loaded by Next.js automatically on the
// client. Adheres to the budget set in the master plan:
//   - Performance tracing: 10% in production, 100% in dev
//   - Session replay: 1% in production, 0% in dev (avoid local noise)
//
// Replay always masks text and blocks media so we don't leak user input
// or report content into Sentry by default.

import * as Sentry from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === "production";
const dsn = process.env["NEXT_PUBLIC_SENTRY_DSN"];

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: isProd ? 0.1 : 1.0,
    replaysSessionSampleRate: isProd ? 0.01 : 0,
    // Error replays are sampled higher — they're more useful and rarer.
    replaysOnErrorSampleRate: isProd ? 1.0 : 0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
