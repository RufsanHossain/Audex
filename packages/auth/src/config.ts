import { jwtCallback, sessionCallback, signInCallback } from "./callbacks.js";
import { credentialsProvider, googleProvider, githubProvider } from "./providers/index.js";

import type { NextAuthConfig } from "next-auth";

/**
 * Core Auth.js v5 configuration for Audex.
 *
 * Strategy: JWT (no database sessions)
 * - Tokens stored in HTTP-only, Secure, SameSite cookies
 * - 30-day session duration
 * - Token rotation on every request
 *
 * This config is consumed by apps/web via:
 *   import { authConfig } from "@audex/auth";
 *   export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
 */
export const authConfig: NextAuthConfig = {
  providers: [credentialsProvider, googleProvider, githubProvider],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Rotate token every 24 hours
  },

  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
    newUser: "/dashboard",
  },

  callbacks: {
    jwt: jwtCallback,
    session: sessionCallback,
    signIn: signInCallback,
  },

  cookies: {
    sessionToken: {
      name: "audex.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: "audex.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: "audex.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  // Security
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",

  events: {
    /**
     * Fires after successful sign-in.
     * TODO (Step 200): Log to auditLogs collection.
     */
    signIn({ user, account }) {
      console.log(`[auth] Sign-in: ${user.email} via ${account?.provider ?? "credentials"}`);
    },
  },
};
