import type { AuthContext } from "./context.js";
import type { UserRole } from "@audex/types";

export function extractAuth(
  session:
    | {
        user?: {
          id?: string;
          email?: string;
          name?: string;
          role?: string;
          emailVerified?: Date | null;
        };
      }
    | null
    | undefined,
): AuthContext | null {
  if (!session?.user?.id || !session.user.email || !session.user.role) {
    return null;
  }

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name ?? "",
    role: session.user.role as UserRole,
    emailVerified: session.user.emailVerified ?? null,
  };
}
