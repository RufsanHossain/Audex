# ADR-003: Hosting — Vercel (Free) + Railway (Workers)

**Status:** Accepted
**Date:** 2026-04-04
**Category:** Build vs Buy

## Context

Audex has two deployment targets: (1) Next.js web app (serverless), (2) long-running workers (BullMQ + Playwright browsers). These have fundamentally different runtime requirements — serverless for the web, persistent for workers.

## Decision

- **Web app:** Vercel free tier (hobby plan)
- **Workers:** Railway (usage-based pricing, ~$5-15/mo for staging)

## Rationale

### Vercel (Web)

- $0/month on hobby plan
- Native Next.js deployment (zero config)
- Edge middleware, ISR, streaming SSR built in
- Automatic preview deployments on PRs
- Built-in analytics (free)
- Global CDN for static assets
- SSL auto-provisioned

### Railway (Workers)

- Usage-based: pay only for compute consumed
- Supports Docker containers (needed for Playwright + Chromium)
- Health check endpoints, auto-restart
- Per-service memory limits (URL worker: 2GB, Code worker: 1GB, Scheduler: 512MB)
- Scaling: 1-4 instances based on queue depth

## Alternatives Considered

| Option             | Why Not                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Vercel for workers | Serverless functions have 10s/60s timeout limits — audits take 60-90s. No persistent process for BullMQ workers. |
| Fly.io for workers | Good alternative. Railway chosen for simpler Docker deploy UX. Could switch later.                               |
| AWS ECS/Fargate    | Over-engineered for a bootstrapped solo project. High operational complexity.                                    |
| Render             | Good alternative. Railway has better DX for our Docker workflow.                                                 |
| Self-hosted (VPS)  | Operational burden. No auto-scaling. Not worth it at this scale.                                                 |

## Upgrade Triggers

- **Vercel:** Free → Pro ($20/mo) when: need team features, commercial use at scale, or bandwidth exceeds 100GB/mo
- **Railway:** Costs scale with usage. Monitor monthly spend. If > $50/mo consistently, evaluate Fly.io or dedicated VPS

## Consequences

- Two deployment targets means two CI/CD pipelines
- Workers need Docker images maintained (Playwright + Chromium updates)
- SSE streaming works on Vercel but has nuances (edge runtime vs Node runtime)
- Environment variables managed in two places (Vercel dashboard + Railway dashboard)
