import type { UserRole } from "@audex/types";

/**
 * Authenticated user context extracted from JWT session.
 * Attached to every authenticated request.
 */
export interface AuthContext {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: Date | null;
}
