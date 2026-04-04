# ADR-007: Monitoring — Sentry + PostHog + Better Stack (All Free Tier)

**Status:** Accepted
**Date:** 2026-04-04
**Category:** Build vs Buy

## Context

Audex needs error tracking, product analytics, session recording, and uptime monitoring. As a bootstrapped project, all tools must start at $0.

## Decision

Three free-tier tools covering different concerns:

| Tool             | Purpose                                 | Free Tier                    |
| ---------------- | --------------------------------------- | ---------------------------- |
| **Sentry**       | Error tracking + performance monitoring | 5K errors/mo, 1 user         |
| **PostHog**      | Product analytics + session recording   | 1M events/mo, 5K sessions/mo |
| **Better Stack** | Uptime monitoring                       | 5 monitors, 3-min intervals  |

## Rationale

- Combined cost: $0/month
- Each tool is best-in-class for its domain
- No overlap — clear separation of concerns
- All have generous free tiers that cover MVP and early growth
- All support data export (avoid lock-in)

## What We Skip at Tier 1-2

| Tool Category                  | Skip                    | Use Instead                                            |
| ------------------------------ | ----------------------- | ------------------------------------------------------ |
| APM (Datadog, New Relic)       | Too expensive ($50+/mo) | Sentry performance monitoring (included free)          |
| Log aggregation (Datadog Logs) | Too expensive           | Pino JSON logs → Vercel log viewer / `vercel logs` CLI |
| Custom dashboards (Grafana)    | Premature               | Sentry + PostHog dashboards sufficient                 |
| Feature flags (LaunchDarkly)   | Overkill                | Environment variables or DB-backed boolean flags       |

## Upgrade Triggers

- **Sentry:** Free → Team ($26/mo) when errors exceed 5K/mo or need team access
- **PostHog:** Free → paid when events exceed 1M/mo or need group analytics
- **Better Stack:** Free → paid when need 60-second intervals or more monitors

## Consequences

- Must instrument PostHog events deliberately (Step 51 in plan)
- Cookie consent required before PostHog tracking (GDPR, Step 74)
- Sentry source maps uploaded during build (CI/CD pipeline)
- Better Stack ping endpoints: `/api/health` for web, `/health` for workers
