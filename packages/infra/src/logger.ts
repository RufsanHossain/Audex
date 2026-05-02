import pino from "pino";

import type { Logger } from "pino";

// ─── Config ────────────────────────────────────────────────────────────────

const nodeEnv: string = process.env["NODE_ENV"] ?? "development";
const isDev = nodeEnv !== "production" && nodeEnv !== "staging";

// Detect Next.js runtime. Pino's `pino-pretty` transport spawns a worker_thread
// (via thread-stream), which Next/webpack tries to bundle as a vendor chunk and
// fails (`Cannot find module .../vendor-chunks/lib/worker.js`). So inside Next
// we emit plain JSON; workers and scripts still get pretty output. Pipe Next
// dev logs through `pino-pretty` on the CLI if you want colors there too.
const inNext = typeof process.env["NEXT_RUNTIME"] === "string";
const usePrettyTransport = isDev && !inNext;

const level = process.env["LOG_LEVEL"] ?? (isDev ? "debug" : "info");

// ─── Root Logger ───────────────────────────────────────────────────────────

/**
 * Root Pino logger for all Audex services.
 *
 * - Production/staging: JSON output (structured, machine-parseable)
 * - Development (workers/scripts): pretty-printed via pino-pretty
 * - Development (inside Next.js): JSON (transport worker is incompatible with Next bundling)
 */
export const logger: Logger = pino({
  level,
  ...(usePrettyTransport
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  base: {
    service: process.env["SERVICE_NAME"] ?? "audex",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// ─── Child Logger Factory ──────────────────────────────────────────────────

/**
 * Create a child logger with additional context.
 *
 * Usage:
 *   const log = createLogger({ module: "auth", requestId: "abc-123" });
 *   log.info("User signed in");
 *   // → { level: "info", service: "audex", module: "auth", requestId: "abc-123", msg: "User signed in" }
 */
export function createLogger(context: Record<string, unknown>): Logger {
  return logger.child(context);
}

/**
 * Create a request-scoped logger with requestId and userId.
 *
 * Used in API route handlers via withHandler().
 */
export function createRequestLogger(params: {
  requestId: string;
  userId?: string;
  method?: string;
  path?: string;
}): Logger {
  return logger.child({
    requestId: params.requestId,
    ...(params.userId ? { userId: params.userId } : {}),
    ...(params.method ? { method: params.method } : {}),
    ...(params.path ? { path: params.path } : {}),
  });
}

/**
 * Create a worker-scoped logger with worker name and job context.
 *
 * Used in BullMQ worker processors.
 */
export function createWorkerLogger(params: {
  worker: string;
  jobId?: string;
  auditId?: string;
}): Logger {
  return logger.child({
    worker: params.worker,
    ...(params.jobId ? { jobId: params.jobId } : {}),
    ...(params.auditId ? { auditId: params.auditId } : {}),
  });
}
