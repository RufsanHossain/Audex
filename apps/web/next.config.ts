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

export default nextConfig;
