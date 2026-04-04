# ADR-002: Database — MongoDB Atlas (Free Tier)

**Status:** Accepted
**Date:** 2026-04-04
**Category:** Build vs Buy

## Context

Audex needs a database for 9 collections: User, Project, Report, AuditLog, Notification, Subscription, ApiKey, Webhook, Migration. Reports contain deeply nested embedded documents (11 dimension results, each with variable-length findings arrays). Average report document is ~45KB.

## Decision

Use **MongoDB Atlas free tier** (M0, 512MB storage) with **Mongoose 9** ORM.

## Rationale

- $0/month on free tier (M0 shared cluster, 512MB)
- Document model naturally fits Audex's nested report structure (dimensions → findings)
- No schema migrations needed for flexible finding schemas per engine
- 39 indexes defined — Atlas handles index management
- Mongoose provides schema validation, virtuals, middleware, TypeScript types
- Serverless-safe connection pooling (globalThis caching pattern already implemented)
- Atlas provides free daily backups on M0

## Alternatives Considered

| Option              | Cost                   | Why Not                                                                                                      |
| ------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| Neon (Postgres)     | Free 512MB             | Report data is deeply nested — would require complex JOINs or JSONB. Relational model doesn't fit naturally. |
| Supabase (Postgres) | Free 500MB             | Same relational mismatch. Would add Supabase dependency across the stack.                                    |
| PlanetScale (MySQL) | Free tier discontinued | Pricing concerns. MySQL less suitable for document-heavy workloads.                                          |
| Self-hosted MongoDB | $0 + server cost       | Operational burden. No automated backups. Not worth it at this stage.                                        |

## Free Tier Limits

- 512MB storage
- 100 max connections
- Shared vCPU (no dedicated)
- No VPC peering, no sharding

## Upgrade Trigger

Upgrade to M10 ($57/mo) when: storage exceeds 400MB, connection count consistently > 80, or need dedicated CPU for consistent query performance. At ~45KB per report, 512MB holds ~10,000 reports before upgrade needed.

## Consequences

- 512MB limit means we need data retention policies (Free: 30 days, Pro: 1 year)
- TTL indexes on reports and audit logs for automatic cleanup
- No transactions on M0 (replica set transactions require M10+) — use ordered operations with error handling instead
- Must monitor storage usage from day one
