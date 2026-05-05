import { requireRole } from "@audex/auth";
import { UserRole } from "@audex/types";
import { ApiError } from "@audex/validators";

import type { AuthContext } from "@audex/auth";

/**
 * Throw if the caller is not an admin. Convenience wrapper around
 * requireRole — every admin route uses the same shape.
 */
export function requireAdmin(auth: AuthContext): void {
  const err = requireRole(auth, UserRole.Admin);
  if (err) {
    throw err.code === "UNAUTHORIZED"
      ? ApiError.unauthorized(err.message)
      : ApiError.forbidden(err.message);
  }
}
