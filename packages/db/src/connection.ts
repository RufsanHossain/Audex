// ─── @audex/db — Connection Manager ─────────────────────────────────────────
// Mongoose connection singleton with retry logic.
// Reuses connection across serverless invocations (Next.js) and
// maintains a persistent connection for long-lived workers.

import { env } from "@audex/env";
import mongoose from "mongoose";

// ── Connection Cache (Serverless-Safe) ──────────────────────────────────────

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// In serverless environments, module-level variables persist across
// warm invocations. This prevents opening a new connection on every request.
const globalForMongoose = globalThis as unknown as {
  __mongooseCache?: MongooseCache;
};

const cached: MongooseCache = globalForMongoose.__mongooseCache ?? {
  conn: null,
  promise: null,
};

globalForMongoose.__mongooseCache = cached;

// ── Connection Options ──────────────────────────────────────────────────────

const CONNECTION_OPTIONS: mongoose.ConnectOptions = {
  // Connection pool
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30_000,

  // Timeouts
  serverSelectionTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
  connectTimeoutMS: 10_000,

  // Heartbeat
  heartbeatFrequencyMS: 10_000,

  // Buffering — disable to fail fast on disconnection
  bufferCommands: false,
};

// ── Connect Function ────────────────────────────────────────────────────────

/**
 * Returns a cached Mongoose connection. Safe for serverless (Next.js)
 * and long-lived (worker) environments.
 *
 * @throws {Error} if the connection fails after retries
 */
export async function connectDb(): Promise<typeof mongoose> {
  // Return cached connection if already established
  if (cached.conn) {
    return cached.conn;
  }

  // Return in-flight connection promise if one is pending
  if (!cached.promise) {
    const uri = env.MONGODB_URI;

    cached.promise = mongoose
      .connect(uri, CONNECTION_OPTIONS)
      .then((m) => {
        console.log("[db] Connected to MongoDB");
        return m;
      })
      .catch((err: unknown) => {
        // Reset promise so next call retries
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// ── Disconnect (for tests and graceful shutdown) ────────────────────────────

export async function disconnectDb(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;

    console.log("[db] Disconnected from MongoDB");
  }
}

// ── Connection Event Listeners ──────────────────────────────────────────────

mongoose.connection.on("error", (err: unknown) => {
  console.error("[db] MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("[db] MongoDB disconnected. Mongoose will auto-reconnect.");
  cached.conn = null;
});

mongoose.connection.on("reconnected", () => {
  console.log("[db] MongoDB reconnected");
});
