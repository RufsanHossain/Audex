import type { UserRole } from "@audex/types";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    emailVerified: Date | null;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
      role: UserRole;
      emailVerified: Date | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    emailVerified: Date | null;
  }
}
