import { withSentryConfig } from "@sentry/nextjs";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },

  headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ];
  },

  transpilePackages: [
    "@audex/auth",
    "@audex/db",
    "@audex/env",
    "@audex/infra",
    "@audex/realtime",
    "@audex/types",
    "@audex/ui",
    "@audex/validators",
  ],

  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // Native dependencies that load worker threads or non-JS files at runtime.
  // Without this, webpack chunking breaks them in Next.js dev/build.
  // pino + transports use worker_threads via `new Worker(new URL("./worker.js", import.meta.url))`.
  serverExternalPackages: [
    "mongoose",
    "mongodb",
    "ioredis",
    "bullmq",
    "pino",
    "pino-pretty",
    "thread-stream",
    "sonic-boom",
  ],

  webpack: (config: { resolve: { extensionAlias?: Record<string, string[]> } }) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

// Wrap with Sentry to upload source maps + tunnel /monitoring traffic
// past ad-blockers. All Sentry options are no-ops when env is unset, so
// dev builds without Sentry env vars succeed silently.
export default withSentryConfig(nextConfig, {
  org: process.env["SENTRY_ORG"],
  project: process.env["SENTRY_PROJECT"],
  authToken: process.env["SENTRY_AUTH_TOKEN"],
  // Source map upload is opt-in via SENTRY_AUTH_TOKEN.
  silent: !process.env["CI"],
  // Tunnel browser SDK requests through this app to dodge ad-blockers.
  // Falls back to default Sentry endpoints when DSN is unset.
  tunnelRoute: "/monitoring",
  // Hide source maps from public production bundles after upload —
  // Sentry still has them via the upload, browsers don't.
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  disableLogger: true,
});
