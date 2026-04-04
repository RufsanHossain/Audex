# ADR-008: Job Queue — BullMQ + Redis

**Status:** Accepted
**Date:** 2026-04-04
**Category:** Build vs Buy

## Context

Audex needs background job processing for: URL audits (60-90s), code audits, email delivery, PDF/CSV export generation, and scheduled maintenance jobs. Jobs need priority, retry with backoff, dead letter queues, and concurrency control.

## Decision

Use **BullMQ** (open source, Redis-backed) with **Upstash Redis** (free tier: 10K commands/day).

## Rationale

- BullMQ: $0, production-grade, battle-tested at scale
- 5 named queues: `audit:url`, `audit:code`, `notifications`, `exports`, `scheduled`
- Priority support (enterprise jobs process before free tier)
- Exponential backoff retry with error-aware strategy
- Dead letter queue for exhausted retries
- Rate limiting per queue
- Repeatable/cron jobs for scheduled maintenance
- Dashboard available (Bull Board) for monitoring

### Why Upstash Redis

- Free tier: 10K commands/day, 256MB storage
- Serverless-compatible (HTTP-based, no persistent connection needed)
- TLS by default
- Also used for: rate limiting, API key caching, SSE Pub/Sub, token revocation

## Alternatives Considered

| Option                 | Why Not                                                                           |
| ---------------------- | --------------------------------------------------------------------------------- |
| Inngest                | Good alternative for serverless. Paid at scale. Less control over retry logic.    |
| AWS SQS                | Requires AWS setup. Not Redis-backed — can't share with rate limiter and Pub/Sub. |
| Quirrel                | Smaller ecosystem. Less active development.                                       |
| pg-boss (Postgres)     | We use MongoDB, not Postgres. Would add another database.                         |
| No queue (async/await) | No retry, no priority, no dead letter. Process crashes lose jobs.                 |

## Free Tier Limits (Upstash Redis)

- 10K commands/day
- 256MB storage
- 100 concurrent connections
- Single region

## Upgrade Trigger

Upgrade Upstash to paid ($0.2/100K commands) when daily commands exceed 8K consistently. Each audit uses ~50-100 Redis commands (queue ops + Pub/Sub + rate limiting). Free tier supports ~100 audits/day.

## Consequences

- Redis is a single point of failure — if Redis goes down, no jobs process
- Upstash free tier may be too slow for high-throughput Pub/Sub (SSE events)
- BullMQ requires `maxRetriesPerRequest: null` on Redis connection (handled in infra package)
- Workers must handle graceful shutdown (drain queue on SIGTERM)
