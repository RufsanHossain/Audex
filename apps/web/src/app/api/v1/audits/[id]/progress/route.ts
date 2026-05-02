import { connectDb, Report } from "@audex/db";
import { createAuditStream, SSE_HEADERS } from "@audex/realtime";
import { ApiError } from "@audex/validators";

import { roleToPlanTier, withHandler } from "../../../../../../lib/api/index.js";

// Force Node runtime — Edge runtime doesn't support full SSE on Vercel.
// Force dynamic — SSE streams must never be cached or pre-rendered.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── GET /api/v1/audits/:id/progress ───────────────────────────────────────

/**
 * Server-Sent Events stream for real-time audit progress.
 *
 * Flow:
 *   1. Auth (withHandler) + ownership check
 *   2. Verify audit is in active state (queued/processing) — completed/failed
 *      audits return immediately with the terminal event
 *   3. Open SSE stream → subscribe to Redis Pub/Sub channel
 *   4. Forward events as Server-Sent Events
 *   5. Heartbeat every 30s
 *   6. Auto-cleanup on client disconnect (AbortSignal)
 *
 * Response: text/event-stream
 */
export const GET = withHandler(
  // No body schema, no rate limit (long-lived connections shouldn't count)
  { rateLimit: false },
  async ({ auth, params, log, req }) => {
    const auditId = params["id"];
    if (!auditId) {
      throw ApiError.notFound("Audit");
    }

    // 1. Verify audit exists + ownership
    await connectDb();
    const audit = await Report.findById(auditId).select("userId status").lean();
    if (!audit) {
      throw ApiError.notFound("Audit");
    }
    if (audit.userId.toString() !== auth.userId) {
      throw ApiError.forbidden("You do not have access to this audit");
    }

    const tier = roleToPlanTier(auth.role);

    // 2. Create the streaming response
    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    let isClosed = false;
    const write = (chunk: string) => {
      if (isClosed) return;
      try {
        void writer.write(encoder.encode(chunk));
      } catch {
        isClosed = true;
      }
    };

    const close = () => {
      if (isClosed) return;
      isClosed = true;
      try {
        void writer.close();
      } catch {
        // already closed
      }
    };

    // 3. Wire up the audit stream
    const stream = await createAuditStream(auditId, {
      userId: auth.userId,
      tier,
      write,
      close,
      signal: req.signal,
    });

    if (!stream) {
      // Connection limit exceeded
      throw ApiError.rateLimited();
    }

    log.info({ auditId }, "SSE stream opened");

    // 4. Cleanup on disconnect (also handled internally by createAuditStream)
    req.signal.addEventListener(
      "abort",
      () => {
        void stream.cleanup().then(close);
      },
      { once: true },
    );

    // 5. Return SSE response
    return new Response(readable, {
      status: 200,
      headers: SSE_HEADERS,
    });
  },
);
