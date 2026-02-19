// ─── @audex/env ─────────────────────────────────────────────────────────────
// Zod-validated environment variables with fail-fast startup behavior.
//
// Usage:
//   import { env, isDev, isProd } from "@audex/env"
//   import { clientEnv } from "@audex/env/client"
//
// Server env: contains secrets, only import in server-side code.
// Client env: NEXT_PUBLIC_ only, safe for browser bundles.

export { env, isDev, isStaging, isProd, isTest } from "./server.js";
export type { ServerEnv } from "./server.js";
