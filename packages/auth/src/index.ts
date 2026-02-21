// ─── @audex/auth ────────────────────────────────────────────────────────────
// Auth.js v5 configuration, RBAC, and guards.
//
// Depends on: @audex/db, @audex/env, @audex/types, next-auth
// Consumed by: apps/web

// Type augmentations
import "./types.js";

// ── Config ──────────────────────────────────────────────────────────────────
export { authConfig } from "./config.js";

// ── Providers ───────────────────────────────────────────────────────────────
export { credentialsProvider } from "./providers/credentials.js";
export { googleProvider } from "./providers/google.js";
export { githubProvider } from "./providers/github.js";

// ── Callbacks ───────────────────────────────────────────────────────────────
export { jwtCallback, sessionCallback, signInCallback } from "./callbacks.js";

// ── RBAC ────────────────────────────────────────────────────────────────────
export {
  getPermissions,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isMinRole,
} from "./permissions.js";

// ── Guards ──────────────────────────────────────────────────────────────────
export type { AuthError } from "./guards.js";
export {
  requireAllPermissions,
  requireOwnership,
  requireOwnershipWithPermission,
  requirePermission,
  requireRole,
} from "./guards.js";

// ── Context ─────────────────────────────────────────────────────────────────
export type { AuthContext } from "./context.js";
export { extractAuth } from "./extract-auth.js";

// ── API Keys ────────────────────────────────────────────────────────────────
export {
  authenticateApiKey,
  generateApiKey,
  hashApiKey,
  requireAllScopes,
  requireAnyScope,
  requireScope,
  revokeAllUserKeys,
  revokeApiKey,
} from "./api-keys/index.js";
export type { ApiKeyAuthResult, GeneratedApiKey } from "./api-keys/index.js";

// ── Redis ───────────────────────────────────────────────────────────────────
export { disconnectRedis } from "./redis.js";

// ── Token Revocation ────────────────────────────────────────────────────────
export {
  cleanupExpiredRevocations,
  isSessionRevoked,
  isTokenBeforeEpoch,
  isTokenRevoked,
  revokeAllUserSessions,
  revokeToken,
} from "./revocation.js";
