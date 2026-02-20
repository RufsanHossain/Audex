// ─── @audex/auth ────────────────────────────────────────────────────────────
// Auth.js v5 configuration, providers, and type augmentations.
//
// Depends on: @audex/db, @audex/env, @audex/types, next-auth
// Consumed by: apps/web

// Type augmentations — importing this file extends next-auth types globally
import "./types.js";

// ── Config ──────────────────────────────────────────────────────────────────
export { authConfig } from "./config.js";

// ── Providers (for testing / direct access) ─────────────────────────────────
export { credentialsProvider } from "./providers/credentials.js";
export { googleProvider } from "./providers/google.js";
export { githubProvider } from "./providers/github.js";

// ── Callbacks (for testing) ─────────────────────────────────────────────────
export { jwtCallback, sessionCallback, signInCallback } from "./callbacks.js";
