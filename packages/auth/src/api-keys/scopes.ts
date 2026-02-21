import type { AuthError } from "../guards.js";
import type { ApiScope } from "@audex/types";

/**
 * Verify that an API key has the required scope.
 *
 * Usage:
 *   const error = requireScope(keyResult.scopes, ApiScope.AuditCreate);
 *   if (error) return NextResponse.json({ error: error.message }, { status: error.status });
 */
export function requireScope(keyScopes: ApiScope[], requiredScope: ApiScope): AuthError | null {
  if (!keyScopes.includes(requiredScope)) {
    return {
      code: "FORBIDDEN",
      message: `API key does not have required scope '${requiredScope}'`,
      status: 403,
    };
  }

  return null;
}

/**
 * Verify that an API key has ALL required scopes.
 */
export function requireAllScopes(
  keyScopes: ApiScope[],
  requiredScopes: ApiScope[],
): AuthError | null {
  const scopeSet = new Set(keyScopes);
  const missing = requiredScopes.filter((s) => !scopeSet.has(s));

  if (missing.length > 0) {
    return {
      code: "FORBIDDEN",
      message: `API key is missing required scopes: ${missing.join(", ")}`,
      status: 403,
    };
  }

  return null;
}

/**
 * Verify that an API key has ANY of the required scopes.
 */
export function requireAnyScope(
  keyScopes: ApiScope[],
  requiredScopes: ApiScope[],
): AuthError | null {
  const scopeSet = new Set(keyScopes);
  const hasAny = requiredScopes.some((s) => scopeSet.has(s));

  if (!hasAny) {
    return {
      code: "FORBIDDEN",
      message: `API key requires at least one of: ${requiredScopes.join(", ")}`,
      status: 403,
    };
  }

  return null;
}
