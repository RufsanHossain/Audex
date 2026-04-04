# ADR-001: Authentication — NextAuth (Self-Hosted)

**Status:** Accepted
**Date:** 2026-04-04
**Category:** Build vs Buy

## Context

Audex needs authentication with email/password, Google OAuth, and GitHub OAuth. RBAC with 5 roles (Free, Pro, Team, Enterprise, Admin) and 22 granular permissions. JWT-based sessions with token revocation. API key authentication for programmatic access.

## Decision

Use **Auth.js v5 (NextAuth)** — free, self-hosted, tightly integrated with Next.js.

## Rationale

- $0/month — no per-MAU pricing
- Full control over JWT strategy, session duration, token revocation
- Native Next.js integration (middleware, server components, API routes)
- 3 providers configured (Credentials, Google, GitHub) with no vendor limits
- RBAC and API key management built custom on top — gives full flexibility
- Token revocation via Redis sorted sets — not possible with managed auth

## Alternatives Considered

| Option              | Cost                          | Why Not                                                                                     |
| ------------------- | ----------------------------- | ------------------------------------------------------------------------------------------- |
| Clerk               | $25/mo at 1K MAU              | Per-MAU pricing punishes growth. Features we don't need yet (org management, SSO).          |
| Auth0               | Free to 7.5K MAU, then $23/mo | More complex setup. Lock-in on token format. Overkill for current needs.                    |
| Supabase Auth       | Free with Supabase            | Would require Supabase as database — we chose MongoDB.                                      |
| Custom from scratch | $0                            | Already what we're doing with Auth.js — it handles OAuth complexity we don't want to build. |

## Upgrade Trigger

Upgrade to Clerk when: need advanced org management, SSO/SAML for enterprise customers, or MFA without building it ourselves. Revenue must justify cost.

## Consequences

- We own the auth complexity (password hashing, token rotation, revocation)
- Must maintain RBAC middleware ourselves
- No hosted login UI — we build our own auth pages (already designed in Step 2)
- Session management is our responsibility (Redis-backed, already implemented)
