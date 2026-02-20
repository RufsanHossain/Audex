import GitHub from "next-auth/providers/github";

/**
 * GitHub OAuth provider.
 *
 * Environment variables (auto-inferred by Auth.js v5):
 * - AUTH_GITHUB_ID
 * - AUTH_GITHUB_SECRET
 */
export const githubProvider = GitHub;
