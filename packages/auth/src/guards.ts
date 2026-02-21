import { hasAllPermissions, hasPermission, isMinRole } from "./permissions.js";

import type { AuthContext } from "./context.js";
import type { Permission, UserRole } from "@audex/types";

export interface AuthError {
  code: "UNAUTHORIZED" | "FORBIDDEN";
  message: string;
  status: 401 | 403;
}

const UNAUTHORIZED: AuthError = {
  code: "UNAUTHORIZED",
  message: "Authentication required",
  status: 401,
};

function forbidden(detail: string): AuthError {
  return {
    code: "FORBIDDEN",
    message: detail,
    status: 403,
  };
}

export function requirePermission(
  auth: AuthContext | null,
  permission: Permission,
): AuthError | null {
  if (!auth) return UNAUTHORIZED;

  if (!hasPermission(auth.role, permission)) {
    return forbidden(`Role '${auth.role}' does not have permission '${permission}'`);
  }

  return null;
}

export function requireAllPermissions(
  auth: AuthContext | null,
  permissions: Permission[],
): AuthError | null {
  if (!auth) return UNAUTHORIZED;

  if (!hasAllPermissions(auth.role, permissions)) {
    return forbidden(`Role '${auth.role}' is missing one or more required permissions`);
  }

  return null;
}

export function requireRole(auth: AuthContext | null, minimumRole: UserRole): AuthError | null {
  if (!auth) return UNAUTHORIZED;

  if (!isMinRole(auth.role, minimumRole)) {
    return forbidden(`Role '${auth.role}' does not meet minimum requirement '${minimumRole}'`);
  }

  return null;
}

export function requireOwnership(
  auth: AuthContext | null,
  resourceOwnerId: string,
): AuthError | null {
  if (!auth) return UNAUTHORIZED;

  if (auth.role === ("admin" as UserRole)) return null;

  if (auth.userId !== resourceOwnerId) {
    return forbidden("You do not have access to this resource");
  }

  return null;
}

export function requireOwnershipWithPermission(
  auth: AuthContext | null,
  resourceOwnerId: string,
  permission: Permission,
): AuthError | null {
  const permError = requirePermission(auth, permission);
  if (permError) return permError;

  const ownerError = requireOwnership(auth, resourceOwnerId);
  if (ownerError) return ownerError;

  return null;
}
