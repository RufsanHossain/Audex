# AUDEX — 250-Step Development Plan v3.1

## AI-Powered Code Quality & Web Analysis Platform

**Version:** 3.1 (Aligned with Project Lifecycle Methodology v2.0)
**Created:** April 4, 2026
**Author:** Rufsan x Claude
**Tier:** Tier 2 (First paying customers — Tier 1 + Tier 2 steps)
**Starting Point:** P0 + P1 complete. Monorepo, types, env, validators, db, auth, ui, web scaffold all built.
**Budget target at launch:** $0-15/month (domain only). Free tiers for everything until usage forces upgrade.

---

## Methodology Alignment

This plan follows the Project Lifecycle Methodology v2.0 (10-phase framework). Every step is tagged with:

- **[P#]** — Which methodology phase it belongs to (P0-P9)
- **[T1]** or **[T2]** — Which tier the step belongs to

### Phase Completion Status (from Methodology)

| Phase | Name                                         | Status                                                   |
| ----- | -------------------------------------------- | -------------------------------------------------------- |
| P0    | Idea Validation & Market Research            | COMPLETE (original plan steps 1-20)                      |
| P1    | System Architecture & Engineering Foundation | COMPLETE (monorepo, domain models, tech stack, auth, db) |
| P2    | UX/UI Design & Information Architecture      | **Steps 1-8 below**                                      |
| P3    | Backend Architecture & Data Layer            | **Steps 9-165 below** (largest phase)                    |
| P4    | Frontend Development                         | **Steps 52-63, 166-210 below**                           |
| P5    | Testing & Quality Assurance                  | **Interleaved + Steps 241-245**                          |
| P6    | Data Privacy & Legal Compliance              | **Steps 230-234 below**                                  |
| P7    | DevOps, Deployment & Infrastructure          | **Steps 21-28, 246-248 below**                           |
| P8    | Documentation System                         | **Steps 235-240 below**                                  |
| P9    | Launch, Growth & Iteration                   | **Steps 247-250 below**                                  |

### Phase Dependency Map (Execution Order)

```
P0 ✅ → P1 ✅ → P3 (backend) → P5 (testing, continuous) → P7 (deploy) → P9 (launch)
              ↘ P2 (design, parallel with P3 start)
              ↘ P4 (frontend, starts after API contracts defined)
              ↘ P6 (privacy, before launch)
              ↘ P8 (docs, continuous)
```

### Bootstrapped-First Tool Decisions [P1 Step 1.6]

| System     | Choice (Free)                                      | Upgrade When                                |
| ---------- | -------------------------------------------------- | ------------------------------------------- |
| Auth       | NextAuth (self-hosted, $0)                         | Need SSO/org management → Clerk             |
| Database   | MongoDB Atlas (free 512MB)                         | Over 512MB → paid tier                      |
| Cache      | Upstash Redis (free 10K cmds/day)                  | Over free tier → paid                       |
| Hosting    | Vercel free tier                                   | Need team/commercial scale → Pro            |
| Payments   | Stripe (pay only on transactions)                  | Already aligned                             |
| Email      | Resend free (100/day)                              | Over 100/day → paid                         |
| Storage    | Cloudflare R2 (10GB free, $0 egress)               | Over 10GB → paid                            |
| Monitoring | Sentry free (5K errors/mo)                         | Over 5K → paid                              |
| Analytics  | Vercel Analytics (free) + PostHog free (1M events) | Over limits → paid                          |
| Uptime     | Better Stack free (5 monitors)                     | Need 60s intervals → paid                   |
| CI/CD      | GitHub Actions (2K min/mo free)                    | Private repo minutes out → paid             |
| Search     | MongoDB $text (free)                               | Over 10K records + need fuzzy → Meilisearch |

### Critical Mindset Rules

1. **Ship Tier 1 across all phases first, then iterate to Tier 2.** A live product with 100 users teaches more than 6 months of planning.
2. **Build vs Buy:** If it's not your core product (the 11-dimension analysis engine), don't build it. Buy the boring stuff.
3. **20% of each sprint → tech debt repayment.** Non-negotiable. Tracked in tech debt register.
4. **Feedback loops:** User feedback → Design + Backend. Testing → Development. Monitoring → Architecture.

---

## Phase Index

| Stage     | Steps   | Description                              | Methodology Phases | Est. Hours | Weeks           |
| --------- | ------- | ---------------------------------------- | ------------------ | ---------- | --------------- |
| 1         | 1-35    | Design, Infrastructure & CI/CD           | P2 + P3 + P7       | ~80h       | 2.5             |
| 2         | 36-75   | API Layer & Frontend Auth                | P3 + P4            | ~90h       | 3               |
| 3         | 76-110  | Worker Foundation & Browser Pipeline     | P3                 | ~95h       | 3               |
| 4         | 111-165 | Analysis Engines & Scoring               | P3 + P5            | ~140h      | 5               |
| 5         | 166-210 | Frontend Features & Report UI            | P4 + P2            | ~110h      | 4               |
| 6         | 211-240 | Billing, Email, Privacy, Docs & Security | P3 + P6 + P8       | ~75h       | 2.5             |
| 7         | 241-250 | QA, Deploy & Launch                      | P5 + P7 + P9       | ~50h       | 1.5             |
| **Total** | **250** |                                          | **P0-P9**          | **~640h**  | **~21.5 weeks** |

---

## Critical Path

```
1→9→10→12→13→29→30→78→84→88→111→112→143→145→165→167→210→250
```

---

## Stage 1: Design, Infrastructure & CI/CD (Steps 1-35)

### Steps 1-8: UX/UI Design & Information Architecture [P2]

**Step 1 — User flow mapping [P2][T1]**
Map the primary user journey: Land on marketing page → Sign up → Onboarding (first audit) → View report → Share/export → Return for second audit. Map edge cases: empty states, error recovery, lost connection. Define entry points (Google search, Product Hunt, direct URL, API docs).
Est: 2h | Deps: none | Risk: Low

**Step 2 — Wireframe: core screens (top 10) [P2][T1]**
Wireframe in Figma or Excalidraw (mobile-first 375px, then 1440px): Landing page, Sign in/up, Dashboard, New Audit form, Audit progress, Report overview, Report dimension detail, Projects list, Settings, Pricing page. Low-fidelity, focus on layout and hierarchy.
Est: 3h | Deps: 1 | Risk: Low

**Step 3 — Onboarding & activation UX design [P2][T1]**
Design time-to-value flow: sign up → first audit in < 2 minutes. Progressive disclosure (don't overwhelm). Empty states as onboarding CTAs ("Run your first audit"). Activation metric: user completes first audit and views report. Defer non-essential setup (no company info, no project setup required for first audit).
Est: 2h | Deps: 1 | Risk: Low

**Step 4 — Error & empty state design [P2][T1]**
Design patterns for: empty dashboard (first visit), empty project list, audit failed, network error, rate limited, plan limit reached, 404, 403. Every error tells user what happened AND what to do next. Never show generic "Something went wrong."
Est: 2h | Deps: 2 | Risk: Low

**Step 5 — Accessibility planning [P2][T1]**
Document a11y requirements: semantic HTML throughout, keyboard navigation for all interactive elements, color contrast 4.5:1 (AA), ARIA labels on icons, aria-describedby for form errors, aria-live for dynamic content (SSE updates, toast notifications), focus-visible:ring on all focusable elements. Skip navigation link. Screen reader testing plan (VoiceOver).
Est: 1h | Deps: none | Risk: Low

**Step 6 — SEO foundation planning [P2][T1]**
Plan URL structure: clean, readable (/pricing, /audits/[id]/report, /projects/[slug]). Meta strategy: title tags, meta descriptions, OG images for every public page. One h1 per page. Sitemap.xml, robots.txt, JSON-LD structured data (SoftwareApplication). Performance targets: LCP < 2.5s, INP < 200ms, CLS < 0.1.
Est: 1h | Deps: none | Risk: Low

**Step 7 — Design system verification [P2][T1]**
Verify existing @audex/ui covers all wireframe needs. Identify gaps: any missing components (charts, score circles, progress indicators)? Verify dark mode works for all 21 components. Verify spacing system (4px grid). Document component usage guidelines.
Est: 2h | Deps: 2 | Risk: Low

**Step 8 — ADR: Build vs Buy decisions [P1][T1]**
Create `docs/adr/` directory. Write ADR-001 through ADR-005: auth (NextAuth — free, self-hosted), database (MongoDB Atlas free), hosting (Vercel free), email (Resend free), storage (R2 free). Each ADR: context, decision, free tier limits, upgrade trigger, consequences. This documents WHY for future reference.
Est: 2h | Deps: none | Risk: Low

### Steps 9-18: Shared Infrastructure Package [P3]

**Step 9 — Create @audex/infra package skeleton [P3][T1]**
Create `packages/infra/` with package.json, tsconfig, src/index.ts. Configure exports. Add to pnpm workspace and Turbo pipeline.
Est: 1h | Deps: none | Risk: Low

**Step 10 — Extract Redis client into @audex/infra [P3][T1]**
Move Redis singleton from `packages/auth/src/redis.ts` into `packages/infra/src/redis.ts`. Create connection factory with TLS, retry (exponential backoff, max 10), reconnect. Health check (`redis.ping()`). Export shared instance. Update `@audex/auth` imports.
Est: 3h | Deps: 9 | Risk: Low

**Step 11 — Redis Pub/Sub module [P3][T2]**
Create Pub/Sub wrapper: dedicated subscriber connection (separate from main), typed publish/subscribe helpers, channel naming (`audex:{entity}:{id}`), JSON serialization. Pattern subscriptions. Graceful cleanup.
Est: 3h | Deps: 10 | Risk: Low

**Step 12 — BullMQ setup and queue factory [P3][T2]**
Install BullMQ. Create queue factory: shared Redis config (`maxRetriesPerRequest: null`), queue creation helper with defaults. Export `createQueue()` and `createWorker()`.
Est: 3h | Deps: 10 | Risk: Low

**Step 13 — BullMQ queue definitions (5 queues) [P3][T2]**
Define 5 typed queues: `audit:url`, `audit:code`, `notifications`, `exports`, `scheduled`. Per-queue: retry count, exponential backoff, stalled interval, cleanup thresholds (completed: 1000, failed: 5000). Priority calculator (enterprise=1, team=2, pro=3, free=4). Typed `addJob()` per queue.
Est: 3h | Deps: 12 | Risk: Low

**Step 14 — Rate limiting module (Redis sorted sets + Lua) [P3][T2]**
Sliding window rate limiter using Redis sorted sets + Lua for atomicity. `RateLimiter` class with `check()` / `consume()`. Tier-based limits from `@audex/types/constants`: Free (10/min), Pro (60/min), Team (120/min), Enterprise (300/min). Return remaining + reset time. `Retry-After` header on 429.
Est: 4h | Deps: 10 | Risk: Medium (Lua scripts)

**Step 15 — Concurrent audit limiter [P3][T2]**
Concurrent operation limiter using Redis SET + TTL. Per-user limits: Free (1), Pro (3), Team (5), Enterprise (10). Acquire/release with TTL safety net.
Est: 2h | Deps: 14 | Risk: Low

**Step 16 — Audit usage tracking module [P3][T2]**
Monthly audit usage tracker: increment on audit creation, check against plan limit, reset on billing period boundary. Redis INCR + TTL for speed, MongoDB Subscription as source of truth. Return `{ used, limit, remaining, resetDate }`.
Est: 3h | Deps: 10 | Risk: Low

**Step 17 — Structured logging (Pino) [P3][T1]**
Install Pino. Logger factory: JSON in production, pretty in dev. Child loggers with context (requestId, userId, auditId). Request logger middleware. Levels from `env.LOG_LEVEL`.
Est: 3h | Deps: 9 | Risk: Low

**Step 18 — Audit log service [P3][T2]**
Create `AuditLogService`: writes to MongoDB `auditLogs` collection. Fire-and-forget. Track: userId, action, ipAddress, userAgent, metadata, timestamp. Helpers: `logAuth()`, `logAuditAction()`, `logSettingsChange()`, `logAdminAction()`.
Est: 3h | Deps: 17 | Risk: Low

### Steps 19-20: Real-time System [P3]

**Step 19 — Implement @audex/realtime (SSE + Pub/Sub) [P3][T2]**
Populate existing empty `packages/realtime/`. Create `EventPublisher` (worker-side, publishes to Redis Pub/Sub). Create `SSEManager` (API-side, manages SSE connections). Heartbeat 30s. Per-user connection limits (Free: 1, Pro: 3, Team: 5). Late-join progress replay from audit document state.
Est: 6h | Deps: 11 | Risk: Medium (streaming on Vercel)

**Step 20 — Unit tests: infra + realtime packages [P5][T1]**
Test rate limiter, concurrent limiter, usage tracker, Pub/Sub, SSE manager, queue factory. Redis mock or testcontainers. Target: 80% coverage on business logic.
Est: 4h | Deps: 9-19 | Risk: Low

### Steps 21-28: CI/CD & DevOps [P7]

**Step 21 — CI: PR pipeline [P7][T1]**
Create `.github/workflows/pr.yml`: checkout → pnpm install (cached) → lint → typecheck → build → unit tests. Turbo remote cache. Run on `pull_request` to `main`/`master`.
Est: 3h | Deps: none | Risk: Low

**Step 22 — CI: Commitlint + branch protection [P7][T1]**
Add commitlint check to PR pipeline. Configure branch protection rules (require CI pass, require 1 approval for solo — self-merge ok).
Est: 1h | Deps: 21 | Risk: Low

**Step 23 — CI: Main pipeline + staging deploy [P7][T2]**
Create `.github/workflows/main.yml`: full test suite with MongoDB + Redis service containers. Run migrations. Deploy web to Vercel staging. Smoke test skeleton. On push to `main`.
Est: 4h | Deps: 21 | Risk: Medium

**Step 24 — CI: Release pipeline [P7][T2]**
Create `.github/workflows/release.yml`: on tag push (`v*`). Full tests → build → deploy production → migrations → GitHub Release with changelog.
Est: 3h | Deps: 23 | Risk: Low

**Step 25 — CI: Security pipeline (weekly) [P7][T1]**
Create `.github/workflows/security.yml`: `pnpm audit`, CodeQL, TruffleHog secret scanning, license check. Weekly schedule. Alert on critical findings.
Est: 2h | Deps: 21 | Risk: Low

**Step 26 — Renovate dependency management [P7][T2]**
Create `renovate.json`: auto-merge patch devDeps, PRs for minor/major, group React/Next.js/Tailwind/Radix. Pin GitHub Actions.
Est: 1h | Deps: 21 | Risk: Low

**Step 27 — Docker Compose polish + dev scripts [P7][T1]**
Polish docker-compose: health checks for MongoDB/Redis. Create `pnpm dev:services`. Mongo Express basic auth. Document in README.
Est: 2h | Deps: none | Risk: Low

**Step 28 — Environment variable audit + .env.example [P7][T1]**
Create `.env.example` for all apps. Document all vars. Verify no secrets in code. Create setup script for new developers.
Est: 2h | Deps: none | Risk: Low

### Steps 29-35: First API Routes & Checkpoint [P3]

**Step 29 — Global API handler pattern (withHandler HOF) [P3][T1]**
Create `withHandler()` in `apps/web/src/lib/api/`: request ID → auth context → rate limit → Zod validation → handler → error boundary → Sentry report → standardized ApiError response. Composable middleware chain.
Est: 4h | Deps: 14, 17, 18 | Risk: Low

**Step 30 — API: POST /api/v1/audits (create audit) [P3][T1]**
First real endpoint using `withHandler`. Auth guard → RBAC → rate limit → Zod → usage limit → concurrent limit → create Report (status: queued) → enqueue BullMQ job → return 202. Audit log.
Est: 5h | Deps: 13, 14, 15, 16, 29 | Risk: Medium

**Step 31 — API: GET /api/v1/audits/:id/progress (SSE) [P3][T2]**
SSE endpoint for real-time audit progress. Auth → ownership → SSE response → Redis Pub/Sub → stream events → cleanup. Uses `SSEManager`.
Est: 4h | Deps: 19, 29 | Risk: Medium

**Step 32 — API: GET /api/v1/audits + GET /:id + POST /:id/cancel [P3][T1]**
List (cursor pagination, filters, sort), get single (ownership check), cancel (status transition, queue removal, SSE event).
Est: 5h | Deps: 29 | Risk: Low

**Step 33 — Integration tests: audit API routes [P5][T1]**
Test all 5 audit endpoints: create (auth, validation, rate limit), list (pagination), get (ownership), cancel (status), SSE (events). Test MongoDB + Redis.
Est: 4h | Deps: 30-32 | Risk: Medium

**Step 34 — Health check aggregator [P7][T1]**
Extend `/api/health`: check MongoDB (ping), Redis (ping), BullMQ status. Return degraded if dependency down. `/api/health/deep` for admin diagnostics.
Est: 2h | Deps: 10, 12 | Risk: Low

**Step 35 — Stage 1 checkpoint: M1 GATE [P5][T1]**
Verify: `pnpm dev` starts all services. `POST /api/v1/audits` returns 202. SSE streams heartbeat. Rate limiting works. CI green. All tests pass.
**Tech debt review:** 20% of next sprint allocated to any shortcuts taken. Update tech debt register.
**Feedback loop:** Review wireframes (Step 2) against implemented API — do they still align?
Est: 3h | Deps: all 1-34 | Risk: Medium

---

## Stage 2: API Layer & Frontend Auth (Steps 36-75)

### Steps 36-51: Remaining API Routes [P3]

**Step 36 — API: Project CRUD (POST + GET + PATCH + DELETE) [P3][T1]**
Create: auth → Zod → slug gen → uniqueness check → create. List: pagination, search, sort. Get: with last audit. Patch: update fields. Delete: cascade check.
Est: 5h | Deps: 29 | Risk: Low

**Step 37 — API: User profile (GET/PATCH /users/me) [P3][T1]**
GET: return profile (exclude passwordHash). PATCH: update name, image, settings. Audit log.
Est: 2h | Deps: 29 | Risk: Low

**Step 38 — API: Change password [P3][T1]**
Verify current → validate new (strength rules) → hash → update → revoke all sessions (epoch) → audit log.
Est: 3h | Deps: 37 | Risk: Low

**Step 39 — API: API key CRUD [P3][T1]**
Create (generate → hash → store → return raw once), list (masked), revoke (clear cache + audit log). Uses existing `@audex/auth` functions.
Est: 3h | Deps: 29 | Risk: Low

**Step 40 — API: Webhook CRUD (Team+ only) [P3][T2]**
Create (generate secret), list, update (url/events/active), delete, test (send test payload). Guarded by `requirePlan('team')`.
Est: 4h | Deps: 29 | Risk: Low

**Step 41 — API: Notification endpoints [P3][T1]**
List (paginated, unread filter), mark read, mark all read, unread count.
Est: 3h | Deps: 29 | Risk: Low

**Step 42 — API: Report endpoints [P3][T1]**
GET full report, POST export trigger (PDF/JSON/CSV → 202), GET public shared report (no auth).
Est: 4h | Deps: 13, 29 | Risk: Low

**Step 43 — API: Report sharing + comparison [P3][T2]**
Share: generate slug, set access, return URL. Unshare. Compare: two audits → score deltas, finding classification. Pro+ only.
Est: 4h | Deps: 42 | Risk: Low

**Step 44 — API: Billing stubs [P3][T2]**
GET subscription, POST checkout (mock URL), POST portal (mock URL). Wired to real Stripe in Stage 6.
Est: 2h | Deps: 29 | Risk: Low

**Step 45 — API: Admin endpoints (users + system + DLQ) [P3][T2]**
Users: list, detail, change role, disable. System: stats, health, queue metrics. DLQ: list, requeue, discard. All `requireRole('admin')`.
Est: 6h | Deps: 13, 29 | Risk: Low

**Step 46 — OpenAPI spec generation [P8][T2]**
Create OpenAPI 3.1 spec from Zod schemas. Swagger UI at `/api/docs` (dev only). Auth schemes, rate limit headers.
Est: 3h | Deps: 30-45 | Risk: Low

**Step 47 — Integration tests: all remaining API routes [P5][T1]**
Test project CRUD, user endpoints, API keys, webhooks, notifications, reports, admin. Verify auth, validation, ownership.
Est: 5h | Deps: 36-45 | Risk: Medium

**Step 48 — API contract validation [P5][T2]**
Validate all endpoints match OpenAPI spec: request validation (missing fields rejected), response shape matches, auth enforcement, rate limit headers present. Automated.
Est: 3h | Deps: 46 | Risk: Low

### Steps 49-51: Placeholder for parallel work

**Step 49 — Sentry integration (web) [P7][T1]**
`@sentry/nextjs`: source maps, env tags, performance monitoring (10% sample), session replay (1% in prod). Error boundary component.
Est: 3h | Deps: none | Risk: Low

**Step 50 — Sentry integration (workers) [P7][T1]**
`@sentry/node`: source maps, env tags, performance monitoring. Error capture wrapper for BullMQ processors.
Est: 2h | Deps: 12 | Risk: Low

**Step 51 — PostHog analytics setup [P9][T2]**
Install PostHog (free tier, 1M events/mo). Configure: key events (signup, audit_created, report_viewed, export_triggered, plan_upgraded). Funnels: visitor → signup → first audit → report view → return visit. Session recording (5K sessions/mo free). Do NOT track before cookie consent.
Est: 3h | Deps: none | Risk: Low

### Steps 52-63: Frontend Auth & Layout [P4]

**Step 52 — Auth page layout [P4][T1]**
Create `(auth)/layout.tsx`: centered card, Audex branding, dark background. Redirect authenticated → /dashboard.
Est: 2h | Deps: none | Risk: Low

**Step 53 — Sign in page [P4][T1]**
Email/password form, Google OAuth button, GitHub OAuth button. Zod validation. Error display. "Forgot password?" link. Redirect to dashboard.
Est: 3h | Deps: 52 | Risk: Low

**Step 54 — Sign up page [P4][T1]**
Name, email, password (strength meter), confirm. Zod validation. Terms checkbox. Auto-sign-in → redirect to onboarding/dashboard.
Est: 3h | Deps: 52 | Risk: Low

**Step 55 — Email verification + forgot password pages [P4][T1]**
Verify: status display, resend (rate limited). Forgot: email input → send link. Reset: new password + confirm. Tokens: 24h/1h expiry, single use.
Est: 4h | Deps: 52 | Risk: Low

**Step 56 — Auth middleware (route protection) [P4][T1]**
Update middleware: unauthenticated → redirect `/auth/signin` for dashboard routes. Authenticated → redirect away from `/auth/*`. Protect `/api/v1/*`. RBAC for `/admin/*`.
Est: 3h | Deps: none | Risk: Low

**Step 57 — Auth hooks + AuthGuard component [P4][T1]**
`useSession()`, `useUser()` (typed with role + plan), `usePermission()`, `<AuthGuard>` wrapper. Client-side permission checks.
Est: 3h | Deps: 56 | Risk: Low

**Step 58 — App layout shell (sidebar + header) [P4][T1]**
`(dashboard)/layout.tsx`: collapsible sidebar (240px), top header (user menu, notifications bell, dark/light toggle), breadcrumbs, main content area. Mobile: hamburger + bottom tab bar. Use shadcn Sidebar pattern.
Est: 5h | Deps: none | Risk: Low

**Step 59 — Loading, error, empty state components [P4][T1]**
`PageSkeleton`, `CardSkeleton`, `TableSkeleton`, `ErrorBoundary` (retry + Sentry), `EmptyState` (CTA-driven per Step 4 designs), `NotFound`, `Forbidden`. All responsive, accessible.
Est: 3h | Deps: none | Risk: Low

**Step 60 — Toast + confirmation dialog systems [P4][T1]**
Sonner toaster: success/error/warning/info. Auto-dismiss. `ConfirmDialog`: cancel/confirm, destructive variant. Keyboard accessible.
Est: 3h | Deps: none | Risk: Low

**Step 61 — Data table + score components [P4][T1]**
`DataTable` (@tanstack/react-table): columns, sorting, pagination, row actions, mobile card view. `ScoreBadge`, `GradeBadge`, `SeverityBadge`, `ScoreDelta`, `DimensionIcon`.
Est: 5h | Deps: none | Risk: Low

**Step 62 — Form components (URL input, device toggle, etc.) [P4][T1]**
`URLInput` (validation + favicon), `DeviceToggle`, `DimensionSelector`, `PasswordInput` (show/hide + strength). All Zod-integrated.
Est: 3h | Deps: none | Risk: Low

**Step 63 — Integration tests: auth flow E2E [P5][T1]**
Sign up → verify → sign in → session valid → sign out → redirect. OAuth mock. Password reset. Route protection. RBAC enforcement.
Est: 4h | Deps: 53-57 | Risk: Medium

### Steps 64-75: Dashboard & Stage 2 Gate [P4]

**Step 64 — Dashboard: stats cards + recent audits [P4][T1]**
`/dashboard`: stats cards (total audits, avg score, trend arrow, projects count). Recent 5 audits (URL, score, grade, status, date). Empty state → "Run your first audit" CTA (per onboarding design Step 3).
Est: 4h | Deps: 58, 59 | Risk: Low

**Step 65 — Dashboard: quick audit bar [P4][T1]**
Inline URL input at top. Submit → redirect to progress page. Uses `URLInput`. Fast path to core value (< 2 min activation per Step 3).
Est: 2h | Deps: 64, 62 | Risk: Low

**Step 66 — Dashboard: score trend chart [P4][T2]**
`ScoreTrendChart` (Recharts): line chart, last 20 audits. 7d/30d/90d range. Server-fetched, client-rendered. Responsive.
Est: 3h | Deps: 64 | Risk: Low

**Step 67 — Onboarding: first-visit experience [P2][T1]**
Detect first visit (no audits). Show welcome card with 3-step guide: (1) Enter a URL, (2) Watch the analysis, (3) View your report. Dismissible. Progress indicator. Drives activation metric.
Est: 3h | Deps: 64, 3 | Risk: Low

**Step 68 — Projects list page [P4][T1]**
`/projects`: grid cards (name, URL, last score + trend, last audit date, count). "New Project" button. Search, sort. Empty state.
Est: 3h | Deps: 61 | Risk: Low

**Step 69 — Project detail + create/edit dialog [P4][T1]**
`/projects/[id]`: header, score history chart, audit history table, "Run Audit" button, edit dialog. Create dialog: name, URL, description, device, dimensions.
Est: 5h | Deps: 68 | Risk: Low

**Step 70 — Audits list page [P4][T1]**
`/audits`: DataTable with columns (URL, score, grade, status, device, date, project). Filters: status, date range. Sort: date/score. Search.
Est: 3h | Deps: 61 | Risk: Low

**Step 71 — Responsive audit: all pages at 3 breakpoints [P4][T1]**
Test 375px, 768px, 1440px. Fix overflow, stacking, fonts. Touch targets >= 44px. Sidebar collapses. Bottom tabs on mobile.
Est: 3h | Deps: 52-70 | Risk: Low

**Step 72 — Accessibility pass: auth + layout + dashboard [P5][T1]**
axe-core audit on all pages built so far. Fix: missing labels, focus management, keyboard nav, contrast, screen reader announcements.
Est: 3h | Deps: 52-70 | Risk: Low

**Step 73 — Performance baseline: frontend [P5][T1]**
Lighthouse CI on key pages. Bundle analysis (@next/bundle-analyzer). Budgets: < 200KB JS per page, TTI < 3s, LCP < 2.5s. Fix regressions.
Est: 2h | Deps: 52-70 | Risk: Low

**Step 74 — Cookie consent banner [P6][T1]**
Implement cookie consent: banner on first visit, accept/reject, store preference. Block PostHog/analytics until consent. GDPR compliant. Minimal, non-intrusive.
Est: 2h | Deps: 51 | Risk: Low

**Step 75 — Stage 2 checkpoint: M2 GATE [P5][T1]**
Verify: all API routes respond with auth. Sign up → sign in → dashboard. OAuth works. Rate limiting. Projects + audits pages. Onboarding flow. CI green.
**Tech debt review:** Update register. Allocate 20% of next sprint.
**Feedback loop:** Does the UX match wireframes? Any API changes needed based on frontend?
Est: 3h | Deps: all 36-74 | Risk: Medium

---

## Stage 3: Worker Foundation & Browser Pipeline (Steps 76-110)

### Steps 76-85: Worker Skeleton & Browser Pool [P3]

**Step 76 — URL worker entry point [P3][T1]**
Standalone app in `packages/workers/src/url-worker/`. Health server (`/health`, `/ready`). Graceful shutdown (SIGTERM/SIGINT — drain, close browsers). Memory watchdog (alert 80%, kill 90%). Stub processor. Wire to `audit:url` queue.
Est: 5h | Deps: 13, 17, 50 | Risk: Medium

**Step 77 — Code worker + scheduler entry points [P3][T2]**
Code worker: stub processor. Scheduler: cron stubs (usage reset, cleanup, analytics rollup). Add to Turbo pipeline.
Est: 3h | Deps: 76 | Risk: Low

**Step 78 — Browser pool manager [P3][T1]**
`BrowserPool`: launch N Chromium (Playwright). `acquire()` / `release()` with FIFO wait queue. State machine: IDLE → BUSY → RECYCLING → DEAD. Crash recovery. Pool size from env.
Est: 6h | Deps: none | Risk: HIGH

**Step 79 — Browser context factory [P3][T1]**
Device presets: desktop (1440x900), mobile (375x812), tablet (768x1024). UA strings. Timezone, locale, viewport per audit. Fresh context per audit (isolation).
Est: 3h | Deps: 78 | Risk: Low

**Step 80 — Page interceptors + HAR capture [P3][T1]**
SSRF guard in Playwright request interception. Network log (URLs, sizes, timings, status). Console capture. Cookie capture. HAR-like structure.
Est: 4h | Deps: 79 | Risk: Medium

**Step 81 — Navigation pipeline [P3][T1]**
`page.goto()` with configurable timeout. Redirect chain tracking. Network idle / DOM stability wait. Error classification: TIMEOUT, UNREACHABLE, DNS_FAILURE, SSL_ERROR, HTTP_ERROR.
Est: 4h | Deps: 80 | Risk: Medium

**Step 82 — Baseline data extraction [P3][T1]**
Title, description, canonical, og:image, favicon. Tech detection (React, Vue, Angular, WordPress, Shopify, GA). DOM stats. Response headers.
Est: 3h | Deps: 81 | Risk: Low

**Step 83 — Screenshot capture pipeline [P3][T1]**
Full page, above-fold, thumbnail. Element cropping. Sharp: resize, compress (WebP). Upload to R2 (free 10GB). Return CDN URLs.
Est: 4h | Deps: 81 | Risk: Medium

**Step 84 — Browser pool recycling + memory management [P3][T2]**
Recycle after N jobs. Memory watchdog integration. Pool health reporting to `/ready`.
Est: 3h | Deps: 78 | Risk: Medium

**Step 85 — Unit tests: browser infrastructure [P5][T1]**
Pool lifecycle, navigation pipeline, baseline extraction, HAR capture. Mock Playwright.
Est: 4h | Deps: 78-84 | Risk: Medium

### Steps 86-95: Job Processing Pipeline [P3]

**Step 86 — URL audit processor (main orchestrator) [P3][T1]**
Pick up job → status `processing` → acquire browser → navigate → baseline → fan-out engines → collect → score → assemble report → persist → SSE `complete`. Progress events throughout.
Est: 6h | Deps: 76, 78-82, 19 | Risk: HIGH

**Step 87 — Engine executor (parallel runner) [P3][T1]**
Run engines in 3 groups: static (security, SEO, best-practices), browser (UI, UX, a11y, privacy), external (performance, speed, network, memory). Per-engine `AbortController` timeout. Partial results on failure.
Est: 5h | Deps: 86 | Risk: HIGH

**Step 88 — Engine interface contract [P3][T1]**
Base engine class: `analyze(context) → Promise<EngineResult>`. `EngineContext` (page, har, cookies, headers, baseline, config, abortSignal). `EngineResult` (findings[], passedChecks[], metrics, duration). Engine registry.
Est: 3h | Deps: none | Risk: Low

**Step 89 — Retry logic (error-aware backoff) [P3][T2]**
Custom BullMQ backoff: BROWSER_CRASH (retry now), TIMEOUT (retry +timeout), RATE_LIMITED (delay), DNS_FAILURE (no retry), SSRF_BLOCKED (no retry). Max 3-5 retries. Dead letter on exhaust.
Est: 4h | Deps: 86 | Risk: Medium

**Step 90 — Dead letter queue + notification dispatch [P3][T2]**
DLQ: store job data, error, retry history. Wire to admin API. Notification on audit complete: in-app (MongoDB), email stub, webhook stub, SSE user event.
Est: 4h | Deps: 13, 19 | Risk: Low

**Step 91 — Progress event publishing [P3][T2]**
Typed events: queued (position), started, navigation, baseline, engine:started, engine:progress, engine:complete (score), scoring, report, complete. Aggregate 0-100%.
Est: 3h | Deps: 19, 86 | Risk: Low

**Step 92 — Worker metrics (Prometheus format) [P7][T2]**
Job counters, duration histograms, pool gauges, memory RSS. `GET /metrics`.
Est: 2h | Deps: 76 | Risk: Low

**Step 93 — Export processor (JSON + stubs) [P3][T2]**
JSON export (serialize report). PDF stub. CSV stub. Upload to R2. Return download URL.
Est: 3h | Deps: 13, 83 | Risk: Low

**Step 94 — Scheduled job processor [P3][T2]**
Monthly usage reset. Report cleanup (TTL: Free 30d, Pro 1yr). Screenshot cleanup. Analytics rollup. Team+ scheduled audits.
Est: 3h | Deps: 77 | Risk: Low

**Step 95 — Code audit processor [P3][T2]**
File upload → extract → validate → AST build (JS/TS) → subset engines (security static, best practices, a11y JSX) → generate report.
Est: 6h | Deps: 86, 88 | Risk: Medium

### Steps 96-110: Docker, Deploy & Stage 3 Gate [P7 + P5]

**Step 96 — Dockerfile: URL worker [P7][T2]**
Node 24 + Playwright + Chromium. Multi-stage. Health check. Memory limit. Non-root.
Est: 3h | Deps: 76 | Risk: Medium

**Step 97 — Dockerfile: Code worker + Scheduler [P7][T2]**
Code worker (no Playwright). Scheduler (lightest). Multi-stage, health checks, non-root.
Est: 2h | Deps: 77 | Risk: Low

**Step 98 — docker-compose.dev.yml for workers [P7][T1]**
Extend compose: url-worker, code-worker, scheduler. Source volumes. Hot reload (`tsx --watch`). Connect to MongoDB + Redis.
Est: 2h | Deps: 96, 97 | Risk: Low

**Step 99 — Railway deployment config [P7][T2]**
`railway.toml` per service. Health checks, memory limits (URL: 2GB, Code: 1GB, Scheduler: 512MB), auto-restart, env vars. Staging deploy.
Est: 3h | Deps: 96, 97 | Risk: Medium

**Step 100 — Integration test: job lifecycle [P5][T1]**
Create audit → job queued → worker picks up → processes (stub) → complete → SSE events. Test retry. Test DLQ. Test cancel.
Est: 4h | Deps: 86-95 | Risk: Medium

**Step 101 — Integration test: browser pipeline [P5][T1]**
Acquire browser → navigate test URL → baseline → HAR → screenshots → release. Pool recycling. Crash recovery. SSRF blocking.
Est: 4h | Deps: 78-84 | Risk: Medium

**Step 102 — Integration test: SSE end-to-end [P5][T1]**
Create audit → SSE connect → queued → started → progress → complete. Reconnection. Late-join replay. Connection limit.
Est: 3h | Deps: 31, 91 | Risk: Medium

**Step 103 — Webhook delivery system [P3][T2]**
HMAC-SHA256 signature. Deliver via notifications queue. 3 retries, exponential backoff. Log deliveries. Update failure count.
Est: 3h | Deps: 90 | Risk: Low

**Step 104 — Worker health dashboard API [P3][T2]**
Internal API: worker fleet status (Redis heartbeat), queue depths, processing rates, error rates. Powers admin page.
Est: 2h | Deps: 92 | Risk: Low

**Step 105 — Performance baseline: worker pipeline [P5][T2]**
Benchmark: enqueue → browser → navigate → baseline → screenshot. Memory per audit. Budgets set.
Est: 2h | Deps: 86 | Risk: Low

**Step 106 — Worker error handling QA [P5][T1]**
Browser crash → recovery. OOM → restart. Redis disconnect → reconnect. Invalid URL → error. SSRF → blocked.
Est: 3h | Deps: 86-95 | Risk: Low

**Step 107 — ADR: Worker architecture decisions [P8][T2]**
ADR-006: Browser pool strategy. ADR-007: Queue topology. ADR-008: Engine parallel execution model. Document constraints and tradeoffs.
Est: 1h | Deps: 86 | Risk: Low

**Step 108 — Tech debt register: Stage 3 review [P8][T2]**
Catalog all TODOs, shortcuts, stubs from Stage 3. Risk classify. Plan 20% of Stage 4 for repayment.
Est: 1h | Deps: all 76-107 | Risk: Low

**Step 109 — Developer documentation: worker setup [P8][T2]**
README for workers: local setup, Docker, env vars, troubleshooting, architecture overview. `git clone` to running in < 30 min.
Est: 2h | Deps: all 76-107 | Risk: Low

**Step 110 — Stage 3 checkpoint: M3 GATE [P5][T1]**
Verify: URL audit → worker navigates real page → baseline → HAR → screenshots in R2 → SSE events → stub report. Code audit processes files. Webhooks deliver. Workers on Railway staging.
**Tech debt:** Pay down highest-risk items from register. Allocate 20% of Stage 4.
**Feedback loop:** Are engine interfaces right? Any browser pipeline issues on real URLs?
Est: 3h | Deps: all 76-109 | Risk: Medium

---

## Stage 4: Analysis Engines & Scoring (Steps 111-165)

### Steps 111-112: Engine Framework [P3]

**Step 111 — Engine base class + registry [P3][T1]**
Abstract `BaseEngine`: constructor with dimensionId, abstract `analyze()`, `createFinding()` helper, timing wrapper. Registry with `register()` / `getEngine()`.
Est: 3h | Deps: 88 | Risk: Low

**Step 112 — Finding builder + rule catalog [P3][T1]**
Fluent API: ruleId, severity, title, description, recommendation, element, code snippet, help URL. Rule catalog constants (SEC-01, SEO-01, etc.) with metadata.
Est: 3h | Deps: 111 | Risk: Low

### Steps 113-142: The 11 Analysis Engines [P3]

**Step 113 — Security engine: headers (SEC-01–07) [P3][T1]**
CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CORS.
Est: 4h | Deps: 111 | Risk: Medium

**Step 114 — Security engine: HTTPS + forms (SEC-08–12) [P3][T1]**
HTTPS enforcement, mixed content, form actions, password autocomplete, info leakage headers.
Est: 3h | Deps: 113 | Risk: Low

**Step 115 — Security engine: deps + cookies + scoring [P3][T1]**
Vulnerable library detection, SRI, cookie audit (HttpOnly/Secure/SameSite). Dimension score.
Est: 3h | Deps: 114 | Risk: Medium

**Step 116 — SEO engine: meta + headings (SEO-01–08) [P3][T1]**
Title, description, heading hierarchy, canonical, OG tags, Twitter cards.
Est: 3h | Deps: 111 | Risk: Low

**Step 117 — SEO engine: images + structured data (SEO-09–15) [P3][T1]**
Alt text, optimization, JSON-LD, robots.txt, sitemap.xml, noindex/nofollow.
Est: 3h | Deps: 116 | Risk: Low

**Step 118 — SEO engine: mobile + scoring [P3][T1]**
Viewport, font sizes, tap targets, horizontal scroll. SEO dimension score.
Est: 3h | Deps: 117 | Risk: Low

**Step 119 — Accessibility engine: axe-core (A11Y-01–10) [P3][T1]**
`@axe-core/playwright`. Full scan. Map violations. Parse details. Handle timeouts.
Est: 4h | Deps: 111 | Risk: Medium

**Step 120 — Accessibility engine: keyboard + ARIA (A11Y-11–15) [P3][T1]**
Tab traversal, focus visible, no traps, ARIA validation, skip nav.
Est: 3h | Deps: 119 | Risk: Medium

**Step 121 — Accessibility engine: contrast + scoring [P3][T1]**
WCAG AA contrast, text alternatives, form labels. A11y dimension score.
Est: 3h | Deps: 120 | Risk: Low

**Step 122 — Performance engine: Lighthouse (PERF-01–06) [P3][T1]**
Run Lighthouse programmatically. Extract scores + metrics. Circuit breaker. Map to rules.
Est: 5h | Deps: 111 | Risk: HIGH

**Step 123 — Performance engine: Core Web Vitals (PERF-07–10) [P3][T1]**
LCP, INP, CLS. Google thresholds. Per-metric recommendations.
Est: 4h | Deps: 122 | Risk: Medium

**Step 124 — Performance engine: resources + scoring [P3][T1]**
Render-blocking, bundle sizes, unused CSS/JS, resource hints. Performance score.
Est: 3h | Deps: 123 | Risk: Low

**Step 125 — Speed engine: timings (SPD-01–06) [P3][T1]**
TTFB, FCP, TTI, DNS, TLS, server response. Benchmarks.
Est: 3h | Deps: 111 | Risk: Medium

**Step 126 — Speed engine: waterfall + scoring [P3][T1]**
Network waterfall, bottlenecks, sequential load detection. Speed score.
Est: 3h | Deps: 125 | Risk: Low

**Step 127 — Privacy engine: cookies (PRV-01–05) [P3][T1]**
1st/3rd party, session/persistent, tracking cookies, consent, expiration, pre-consent.
Est: 3h | Deps: 111 | Risk: Low

**Step 128 — Privacy engine: trackers (PRV-06–10) [P3][T1]**
GA, Facebook Pixel, fingerprinting, beacons, privacy policy.
Est: 3h | Deps: 127 | Risk: Low

**Step 129 — Privacy engine: data exposure + scoring [P3][T1]**
PII in URLs, autocomplete, exposed emails, 3rd party sharing. Privacy score.
Est: 2h | Deps: 128 | Risk: Low

**Step 130 — Network engine: requests (NET-01–05) [P3][T1]**
Request count, transfer size, domains, protocols, connection reuse.
Est: 3h | Deps: 111 | Risk: Low

**Step 131 — Network engine: caching + scoring [P3][T1]**
Cache headers, compression, CDN, resource sizes. Network score.
Est: 3h | Deps: 130 | Risk: Low

**Step 132 — Best Practices engine: console + APIs (BP-01–06) [P3][T1]**
Console errors, deprecated APIs, doctype, charset, document.write, sync XHR.
Est: 3h | Deps: 111 | Risk: Low

**Step 133 — Best Practices engine: images + scoring [P3][T1]**
Format (WebP/AVIF), responsive, lazy loading, oversized, missing dimensions. BP score.
Est: 3h | Deps: 132 | Risk: Low

**Step 134 — UI engine: viewport + responsiveness (UI-01–04) [P3][T1]**
Viewport meta, overflow detection, breakpoints, fixed-width elements.
Est: 3h | Deps: 111 | Risk: Medium

**Step 135 — UI engine: typography + spacing (UI-05–09) [P3][T1]**
Font size, line height, contrast, spacing, tap targets.
Est: 3h | Deps: 134 | Risk: Low

**Step 136 — UI engine: hierarchy + scoring [P3][T1]**
z-index, heading hierarchy, overlapping, visual rhythm. UI score.
Est: 3h | Deps: 135 | Risk: Medium

**Step 137 — UX engine: navigation (UX-01–05) [P3][T1]**
Nav structure, broken links, dead-ends, breadcrumbs, logo → home.
Est: 3h | Deps: 111 | Risk: Medium

**Step 138 — UX engine: forms (UX-06–10) [P3][T1]**
Labels, placeholder vs label, error handling, validation, form length, submit button.
Est: 3h | Deps: 137 | Risk: Low

**Step 139 — UX engine: interactive + scoring [P3][T1]**
Loading states, hover/active, scroll hijacking, CTAs. UX score.
Est: 3h | Deps: 138 | Risk: Medium

**Step 140 — Memory engine: CDP heap (MEM-01–03) [P3][T2]**
HeapProfiler snapshot. Total/used heap. Pre/post comparison. Handle CDP instability.
Est: 4h | Deps: 111 | Risk: HIGH

**Step 141 — Memory engine: DOM leaks (MEM-04–06) [P3][T2]**
Detached DOM, node count, event listeners, iframes, memory growth.
Est: 3h | Deps: 140 | Risk: HIGH

**Step 142 — Memory engine: timeline + scoring [P3][T2]**
Growth rate, GC patterns, classification. Memory score. Optional (Enterprise, resource-intensive).
Est: 3h | Deps: 141 | Risk: Medium

### Steps 143-150: Scoring & Report Assembly [P3]

**Step 143 — Per-dimension scoring engine [P3][T1]**
Severity deductions with diminishing returns: base 100, CRITICAL -10, HIGH -5, MEDIUM -2.5, LOW -1, INFO 0. Pass bonus +0.5 (max +5). Score breakdown.
Est: 4h | Deps: 111 | Risk: Low

**Step 144 — Composite score aggregator [P3][T1]**
Weighted average (from constants). Weight redistribution on engine failure. Grade derivation (A-F). Color mapping.
Est: 3h | Deps: 143 | Risk: Low

**Step 145 — Report document assembly [P3][T1]**
Collect engine results → sort findings (severity → impact) → top 5 overview → severity distribution → cap 50/dimension (overflow) → build Report.
Est: 4h | Deps: 143, 144 | Risk: Low

**Step 146 — Report persistence (MongoDB transaction) [P3][T1]**
Insert report, update audit → `completed`, update project scoreHistory, update user auditCount. All in transaction. Retry on failure.
Est: 4h | Deps: 145 | Risk: Medium

**Step 147 — Finding comparison engine [P3][T2]**
Compare vs previous report (same project + URL): new, recurring, fixed, regressed. ScoreDelta, DimensionDelta.
Est: 4h | Deps: 145 | Risk: Low

**Step 148 — AI summary generation (Claude API) [P3][T2]**
Build digest → Claude Sonnet → executive summary, top 3 issues, action items, positives. Store in report. Track tokens for cost.
Est: 4h | Deps: 145 | Risk: Medium

### Steps 149-165: Engine Testing & Calibration [P5]

**Step 149 — Unit tests: Security engine [P5][T1]**
HTML fixtures with/without CSP, HSTS, mixed content, vuln libs. Verify rules + severity.
Est: 3h | Deps: 113-115 | Risk: Low

**Step 150 — Unit tests: SEO engine [P5][T1]**
Test meta tags, headings, structured data, robots.txt. Verify rules + scores.
Est: 3h | Deps: 116-118 | Risk: Low

**Step 151 — Unit tests: Accessibility engine [P5][T1]**
Known violations, missing labels, poor contrast, keyboard traps.
Est: 3h | Deps: 119-121 | Risk: Low

**Step 152 — Unit tests: Performance + Speed [P5][T1]**
Lighthouse mocks, timing measurements, waterfall.
Est: 3h | Deps: 122-126 | Risk: Medium

**Step 153 — Unit tests: Privacy + Network + Best Practices [P5][T1]**
Cookie classification, trackers, request analysis, caching, console errors, images.
Est: 3h | Deps: 127-133 | Risk: Low

**Step 154 — Unit tests: UI + UX + Memory [P5][T1]**
Viewport, typography, navigation, forms, CDP mocks, DOM leaks.
Est: 3h | Deps: 134-142 | Risk: Medium

**Step 155 — Unit tests: Scoring + Report assembly [P5][T1]**
Diminishing returns, pass bonus, composite aggregation, weight redistribution, grade, comparison.
Est: 3h | Deps: 143-147 | Risk: Low

**Step 156 — Integration test: full audit pipeline [P5][T1]**
URL → worker → 11 engines → scoring → report → SSE complete. 3 diverse sites. Scores reasonable.
Est: 5h | Deps: all 111-148 | Risk: HIGH

**Step 157 — Calibration pass 1: 10 diverse sites [P5][T2]**
E-commerce, blog, SaaS, government, news, portfolio, docs, forum, landing, web app. Fix false positives. Tune severity.
Est: 4h | Deps: 156 | Risk: Medium

**Step 158 — Calibration pass 2: edge cases [P5][T2]**
SPA, SSR, WordPress, Shopify, plain HTML, Cloudflare-protected, heavy JS, PWA. Adjust timeouts.
Est: 4h | Deps: 157 | Risk: Medium

**Step 159 — Calibration pass 3: scoring balance [P5][T2]**
Scores across 20 sites: good 80+, mediocre 50-70, bad < 40. Adjust weights. Verify diminishing returns.
Est: 3h | Deps: 158 | Risk: Low

**Step 160 — Export: PDF generation [P3][T2]**
HTML template → Playwright `page.pdf()` → R2 → signed URL. Cover page, executive summary, per-dimension, appendix.
Est: 5h | Deps: 145, 78 | Risk: Medium

**Step 161 — Export: JSON + CSV [P3][T2]**
JSON: full report. CSV: one row per finding. Via exports queue.
Est: 3h | Deps: 145 | Risk: Low

**Step 162 — Performance baseline: full audit [P5][T2]**
Enqueue → report complete. Per-engine times. Budget: < 90s URL audit. Memory peak.
Est: 3h | Deps: 156 | Risk: Low

**Step 163 — Tech debt register: Stage 4 review [P8][T2]**
Catalog TODOs/shortcuts from engines. Risk classify. Plan 20% of Stage 5 for repayment.
Est: 1h | Deps: all 111-162 | Risk: Low

**Step 164 — ADR: Scoring methodology [P8][T2]**
ADR-009: Scoring formula rationale. ADR-010: Dimension weight choices. ADR-011: Engine failure handling.
Est: 1h | Deps: 143-144 | Risk: Low

**Step 165 — Stage 4 checkpoint: M4 GATE [P5][T1]**
Verify: 11 engines score → composite + grade → report → AI summary → comparison → PDF/JSON/CSV export → SSE full lifecycle. Scores reasonable across 20 sites. All engine tests pass.
**Tech debt:** Pay down from register.
**Feedback loop:** Do scores feel fair? Any engine producing too many false positives?
Est: 4h | Deps: all 111-164 | Risk: Medium

---

## Stage 5: Frontend Features & Report UI (Steps 166-210)

### Steps 166-175: Audit Flow UI [P4]

**Step 166 — Audit creation form + submit [P4][T1]**
URL input (validation + favicon), device toggle, project dropdown, dimension checkboxes. Wire to API. Handle errors. Redirect to progress page. Toast.
Est: 4h | Deps: 62 | Risk: Low

**Step 167 — Audit progress page: SSE hook [P4][T1]**
`useAuditProgress(auditId)`: SSE connect, parse events, expose progress/phase/engines/isComplete/error. Auto-reconnect.
Est: 4h | Deps: 31 | Risk: Medium

**Step 168 — Progress UI: queue + navigation + engine grid [P4][T1]**
Queue position, estimated wait. Animate queued → started → navigating → analyzing. 11-tile engine grid (icon, status, progress bar, score on complete). Color-coded.
Est: 5h | Deps: 167 | Risk: Low

**Step 169 — Progress UI: completion + failure states [P4][T1]**
Complete: animate score reveal, grade badge, "View Report" CTA. Failure: error, retry, partial report link.
Est: 3h | Deps: 168 | Risk: Low

**Step 170 — Audit detail page (conditional routing) [P4][T1]**
`/audits/[id]`: queued/processing → progress page, completed → redirect to report, failed → error with retry.
Est: 2h | Deps: 167 | Risk: Low

### Steps 171-191: Report UI [P4]

**Step 171 — Report layout + hero section [P4][T1]**
Score circle (animated), grade badge, URL, timestamp, device. Metadata (duration, findings, engines). Export + share buttons.
Est: 3h | Deps: 61 | Risk: Low

**Step 172 — Report: screenshot + page metadata [P4][T1]**
Above-fold screenshot. Title, description, tech badges. Redirect chain. Page stats.
Est: 3h | Deps: 171 | Risk: Low

**Step 173 — Report: radar chart + severity distribution [P4][T2]**
11-dimension Recharts radar. Severity stacked bar. Click to filter.
Est: 4h | Deps: 171 | Risk: Low

**Step 174 — Report: top findings + AI summary [P4][T1]**
Top 5 findings cards. AI summary: overview, top 3 issues, action items, positives.
Est: 3h | Deps: 171 | Risk: Low

**Step 175 — Report: dimension tab bar [P4][T1]**
Scrollable tabs for 11 dimensions. Icon + name + score badge. Lazy load content.
Est: 3h | Deps: 171 | Risk: Low

**Step 176 — Report: dimension panel (header + breakdown) [P4][T1]**
Score circle, grade, finding count. Score breakdown (deductions + bonuses). Collapsible.
Est: 3h | Deps: 175 | Risk: Low

**Step 177 — Report: finding card component [P4][T1]**
Severity badge, title, description (markdown), recommendation (collapsible), instance count, comparison badge.
Est: 3h | Deps: 176 | Risk: Low

**Step 178 — Report: code snippet + element screenshot [P4][T2]**
Syntax-highlighted code (Shiki). Line highlighting. Copy button. Element screenshot with expand.
Est: 4h | Deps: 177 | Risk: Low

**Step 179 — Report: passed checks + overflow pagination [P4][T1]**
Passed checks: collapsible, green checkmarks. Overflow: "Load more" → API fetch, 20 per page.
Est: 3h | Deps: 176 | Risk: Low

**Step 180 — Report: comparison view [P4][T2]**
Score trend (current highlighted). Dimension deltas. New/fixed counts. Previous audit link.
Est: 3h | Deps: 171 | Risk: Low

**Step 181 — Report: export buttons [P4][T2]**
PDF (trigger + download), JSON (download), CSV (download). Loading states. Error handling.
Est: 2h | Deps: 171 | Risk: Low

**Step 182 — Report: sharing [P4][T2]**
Generate slug, toggle access, copy link. OG meta for social. Public page `/reports/[slug]`.
Est: 3h | Deps: 43 | Risk: Low

### Steps 183-195: Settings & Admin [P4]

**Step 183 — Notification center [P4][T1]**
Header dropdown: unread count, notification list, mark read, mark all read, link to audit/report.
Est: 3h | Deps: 41 | Risk: Low

**Step 184 — API key management page [P4][T1]**
`/settings/api-keys`: list (masked), generate (dialog, raw key once, copy), revoke (confirm).
Est: 3h | Deps: 39 | Risk: Low

**Step 185 — Profile settings page [P4][T1]**
Edit name, email (re-verify), avatar (R2). Change password. Delete account (confirmation).
Est: 3h | Deps: 37, 38 | Risk: Low

**Step 186 — Notification + billing settings [P4][T2]**
Notification: email toggles, Slack webhook (Team+), frequency. Billing: current plan, plan comparison, upgrade/downgrade → Stripe (wired in Stage 6), usage meter.
Est: 3h | Deps: 44 | Risk: Low

**Step 187 — Active sessions page [P4][T1]**
`/settings/security`: sessions list (device, IP, last active), revoke individual, revoke all others.
Est: 3h | Deps: 57 | Risk: Low

**Step 188 — Team management page (Team+) [P4][T2]**
`/settings/team`: member list, invite form, role assignment, remove, pending invitations.
Est: 3h | Deps: 57 | Risk: Low

**Step 189 — Admin dashboard [P4][T2]**
`/admin`: stats (users, audits, MRR), workers, queue health, error rate, recent signups.
Est: 4h | Deps: 45 | Risk: Low

**Step 190 — Admin: user management + DLQ [P4][T2]**
Users: list, detail, change role, disable, impersonate (logged). DLQ: list, requeue, discard.
Est: 5h | Deps: 45 | Risk: Medium

**Step 191 — Command palette (cmdk) [P4][T2]**
Cmd+K: search audits, projects, navigate, quick actions. shadcn Dialog. Recent searches.
Est: 3h | Deps: none | Risk: Low

### Steps 192-210: Polish & Stage 5 Gate [P4 + P2 + P5]

**Step 192 — Landing page [P4][T1]**
`/` (public): hero, feature highlights (11 dimensions), how it works, pricing preview, CTA. ISR. Follow SEO plan from Step 6.
Est: 4h | Deps: 6 | Risk: Low

**Step 193 — Pricing page [P4][T1]**
Plan comparison table. Feature matrix. Annual/monthly toggle. FAQ. CTAs per tier.
Est: 3h | Deps: none | Risk: Low

**Step 194 — Dashboard live updates (SSE) [P4][T2]**
User events SSE: auto-update recent audits on completion. Toast. Real-time usage counter.
Est: 2h | Deps: 64, 19 | Risk: Low

**Step 195 — Accessibility pass: all pages [P5][T1]**
axe-core audit. Fix: labels, focus, keyboard nav, contrast, screen reader. Target WCAG 2.2 AA.
Est: 4h | Deps: all 166-194 | Risk: Low

**Step 196 — Responsive pass: all pages [P5][T1]**
Test 375px, 768px, 1440px. Fix overflow, stacking, touch targets. Sidebar, bottom tabs, data tables.
Est: 3h | Deps: all 166-194 | Risk: Low

**Step 197 — Cross-browser testing [P5][T1]**
Chrome, Firefox, Safari, Edge (latest). Mobile: iOS Safari, Chrome Android. Fix browser-specific issues.
Est: 4h | Deps: all 166-194 | Risk: Medium

**Step 198 — Error handling: all frontend flows [P4][T1]**
Verify: network errors, 401 redirect, 403 forbidden, 404 not found, 500 error boundary, loading, empty states. Per error design (Step 4).
Est: 3h | Deps: 59 | Risk: Low

**Step 199 — Performance: frontend [P5][T1]**
Lighthouse CI on key pages. Bundle size check. Budgets: < 200KB JS, TTI < 3s, LCP < 2.5s.
Est: 2h | Deps: all 166-198 | Risk: Low

**Step 200 — Keyboard shortcut guide [P4][T2]**
`?` key: show shortcuts overlay. Cmd+K search, N new audit, G+D go dashboard, G+P go projects.
Est: 2h | Deps: 191 | Risk: Low

**Step 201 — SEO implementation [P2][T1]**
Implement plan from Step 6: meta tags on all public pages, OG images, JSON-LD, sitemap.xml, robots.txt. Verify with Google Search Console.
Est: 3h | Deps: 192, 193 | Risk: Low

**Step 202 — Analytics event instrumentation [P9][T2]**
Wire PostHog events: signup, audit_created, report_viewed, export_triggered, plan_upgraded, dimension_tab_clicked. Funnels configured.
Est: 2h | Deps: 51 | Risk: Low

**Step 203 — Create/edit project dialog [P4][T1]**
Name, URL, description, device, dimensions. Zod validation. Optimistic UI.
Est: 2h | Deps: 68 | Risk: Low

**Step 204 — Tech debt register: Stage 5 review [P8][T2]**
Catalog frontend shortcuts. Risk classify. Plan repayment.
Est: 1h | Deps: all 166-203 | Risk: Low

**Step 205 — ADR: Frontend architecture [P8][T2]**
ADR-012: Server vs client component strategy. ADR-013: Chart library choice. ADR-014: SSE connection management.
Est: 1h | Deps: all 166-203 | Risk: Low

**Step 206-210 — RESERVED: Tech debt repayment sprint [P3/P4][T1]**
5 steps allocated for paying down accumulated tech debt from Stages 1-5. Prioritize by risk from register. Fix highest-risk items. Refactor any code that's blocking further development.
Est: 15h | Deps: varies | Risk: Low

**Step 210 — Stage 5 checkpoint: M5 GATE [P5][T1]**
Verify: full audit flow in UI (create → progress → report). All dimension tabs. Findings with code + screenshots. AI summary. Exports. Sharing. Dashboard + charts + live updates. Settings. Admin. Landing + pricing. Responsive. Accessible. Cross-browser.
**Tech debt:** Register reviewed. Critical/high items resolved.
**Feedback loop:** Get 3-5 people to test the full flow. Capture friction points for pre-launch fixes.
Est: 4h | Deps: all 166-209 | Risk: Medium

---

## Stage 6: Billing, Email, Privacy, Docs & Security (Steps 211-240)

### Steps 211-220: Stripe Billing [P3]

**Step 211 — Stripe product + price setup [P3][T2]**
Products: Free ($0), Pro ($29/mo, $290/yr), Team ($79/mo, $790/yr), Enterprise (custom). Test mode. No monthly cost — pay only on transactions.
Est: 2h | Deps: none | Risk: Low

**Step 212 — Stripe checkout integration [P3][T2]**
POST checkout: create Session, price ID, customer email, success/cancel URLs, 14-day trial. Redirect.
Est: 4h | Deps: 211 | Risk: Medium

**Step 213 — Stripe webhook handler [P3][T2]**
POST /api/webhooks/stripe: verify signature. Handle: checkout.session.completed, subscription.updated/deleted, payment_failed. Idempotent dedup. Process via queue.
Est: 4h | Deps: 212 | Risk: Medium

**Step 214 — Stripe portal + billing page wiring [P3][T2]**
Portal session. Wire billing settings page (Step 186) to real Stripe: upgrade, downgrade, usage, invoices.
Est: 3h | Deps: 213 | Risk: Low

**Step 215 — Usage tracking + plan gating (wire to Stripe) [P3][T2]**
Real subscription data. `requirePlan()` middleware. Gate: exports (Pro+), API (Team+), webhooks (Team+), team (Team+), scheduled (Team+). UI upgrade prompts.
Est: 4h | Deps: 213, 16 | Risk: Low

**Step 216 — Trial management [P3][T2]**
14-day trial. Days remaining in UI. Email at 3 days. Email at end. Downgrade on expiry. Preserve data.
Est: 3h | Deps: 213 | Risk: Low

**Step 217 — Billing webhook resilience + reconciliation [P3][T2]**
Retry handling, idempotency, daily reconciliation job (Stripe ↔ DB), mismatch alerts.
Est: 2h | Deps: 213 | Risk: Low

**Step 218 — Integration test: billing flow [P5][T2]**
Signup → trial → checkout (test card) → upgrade → usage → portal → cancel → downgrade. All webhooks.
Est: 4h | Deps: 211-217 | Risk: Medium

### Steps 219-226: Email System [P3]

**Step 219 — React Email templates (6 templates) [P3][T2]**
Welcome, verification, reset, audit complete, billing (trial/payment/upgrade/downgrade), weekly digest. All branded, responsive, plain text fallback. Using Resend free tier (100/day).
Est: 6h | Deps: none | Risk: Low

**Step 220 — Email sending service (Resend) [P3][T2]**
`EmailService`: Resend integration, template rendering, retry (3 via queue), logging, unsubscribe handling. Dev preview endpoint.
Est: 3h | Deps: 219 | Risk: Low

**Step 221 — Wire emails to flows [P3][T2]**
Welcome on signup, verification, reset, audit complete, billing events, weekly digest cron. Respect preferences.
Est: 3h | Deps: 220, 90 | Risk: Low

**Step 222 — Slack integration (Team+) [P3][T2]**
Formatted Slack message on audit completion. Channel config per project. Test message button.
Est: 2h | Deps: 90 | Risk: Low

### Steps 223-229: Security Hardening [P3]

**Step 223 — CSRF verification [P3][T1]**
Verify SameSite cookies, CSRF tokens on forms, reject without valid origin.
Est: 2h | Deps: none | Risk: Low

**Step 224 — XSS protection [P3][T1]**
DOMPurify on user content. CSP blocks inline. Sanitize engine output. Test with payloads.
Est: 3h | Deps: none | Risk: Medium

**Step 225 — SSRF hardening (production) [P3][T1]**
DNS resolution check (block private IP resolution). Runtime Playwright interceptor. Log blocked attempts.
Est: 3h | Deps: none | Risk: Medium

**Step 226 — Account security [P3][T2]**
10 failed logins → 15-min lockout. Login rate limit (5/min per IP). Session limit (5 per user). Force logout on password change.
Est: 4h | Deps: 14 | Risk: Medium

**Step 227 — Security headers review [P3][T1]**
Tighten CSP, verify CORS, test with securityheaders.com. Target A+.
Est: 2h | Deps: none | Risk: Low

**Step 228 — Security penetration test [P5][T1]**
XSS, NoSQL injection, SSRF, CSRF, auth bypass, API key timing, rate limit bypass. Document and fix.
Est: 4h | Deps: 223-227 | Risk: Medium

**Step 229 — Audit logging verification [P3][T2]**
Verify all sensitive actions logged: login, password, API keys, plan changes, settings, admin actions. 90-day retention.
Est: 2h | Deps: 18 | Risk: Low

### Steps 230-234: Data Privacy & Legal [P6]

**Step 230 — Data inventory + flow mapping [P6][T2]**
Map all personal data: what collected, where stored, who accesses, retention. Data flow diagram: user → API → DB → analytics → 3rd parties.
Est: 2h | Deps: none | Risk: Low

**Step 231 — Consent + data subject rights [P6][T2]**
Cookie consent (Step 74 already done). Right to access: GET /me/data (portable format). Right to erasure: DELETE /me/account (cascade through DB, R2, Stripe, analytics). Right to portability: export in 30 days.
Est: 4h | Deps: 230 | Risk: Medium

**Step 232 — Retention policies + privacy engineering [P6][T2]**
Automate: logs 90 days, deleted accounts 30-day soft delete then purge, payment 7 years. Minimum data collection. Anonymized analytics.
Est: 3h | Deps: 230 | Risk: Low

**Step 233 — Legal documents [P6][T2]**
Privacy Policy, Terms of Service, Cookie Policy. Cover: data handling, 3rd party services, retention, GDPR/CCPA compliance. Lawyer-reviewed recommended. Link from footer.
Est: 3h | Deps: 230 | Risk: Low

**Step 234 — Third-party DPAs [P6][T2]**
Execute Data Processing Agreements with: MongoDB Atlas, Stripe, Resend, Cloudflare, Sentry, PostHog. Verify all have GDPR-compliant DPAs.
Est: 2h | Deps: 230 | Risk: Low

### Steps 235-240: Documentation & Stage 6 Gate [P8]

**Step 235 — Architecture Decision Records (complete) [P8][T2]**
Finalize all ADRs (ADR-001 through ADR-014+). System architecture diagram. Store in `docs/adr/`.
Est: 2h | Deps: 8, 107, 164, 205 | Risk: Low

**Step 236 — Developer onboarding README [P8][T2]**
`git clone` to running in < 30 min. Prerequisites, setup, seed data, troubleshooting, architecture overview.
Est: 2h | Deps: none | Risk: Low

**Step 237 — Runbook + incident response [P8][T2]**
Operational: migration, rollback, scaling, alert response, secret rotation. Incident: service down, DB overloaded, security breach, dependency compromised.
Est: 2h | Deps: none | Risk: Low

**Step 238 — User-facing docs + changelog [P8][T2]**
Knowledge base (markdown in repo, rendered via Next.js — $0). Public /changelog page. Getting started guide. API docs link.
Est: 3h | Deps: 46 | Risk: Low

**Step 239 — Tech debt register: final review [P8][T2]**
Consolidate all stages. Classify remaining items. Document known limitations for launch.
Est: 1h | Deps: all prior | Risk: Low

**Step 240 — Stage 6 checkpoint: M6 GATE [P5][T2]**
Verify: Stripe → payment → plan activation. Emails sending. Security A+. Account lockout. SSRF hardened. Audit logging. Privacy compliance. Legal pages. Docs complete.
**Tech debt:** Final repayment sprint on critical items.
**Feedback loop:** Security review with fresh eyes. Any compliance gaps?
Est: 3h | Deps: all 211-239 | Risk: Medium

---

## Stage 7: QA, Deploy & Launch (Steps 241-250)

**Step 241 — E2E: auth + audit flow (Playwright) [P5][T1]**
Sign up → verify → sign in → create audit → progress → report → all tabs → export. Stable test URL.
Est: 4h | Deps: all prior | Risk: Medium

**Step 242 — E2E: billing + settings (Playwright) [P5][T2]**
Upgrade (Stripe test) → features unlocked → API key → settings → team → admin.
Est: 3h | Deps: all prior | Risk: Medium

**Step 243 — Bug bash: full regression [P5][T1]**
Every flow, every page, every edge case. P0/P1/P2 classification. Fix all P0 immediately, P1 before launch.
Est: 8h | Deps: 241-242 | Risk: Medium

**Step 244 — Fix P0 + P1 bugs [P5][T1]**
Fix all launch-blocking bugs. Re-test. No regressions. Update tests.
Est: 8h | Deps: 243 | Risk: Medium

**Step 245 — Performance regression test [P5][T2]**
Re-run all benchmarks. No regressions. Page loads, API, build times, bundles within budget.
Est: 3h | Deps: 244 | Risk: Low

**Step 246 — Production infrastructure setup [P7][T2]**
MongoDB Atlas M10 + backups. Upstash Redis (TLS). Vercel production (env, analytics, domain). Railway (workers, health, memory, scaling). Sentry (alerts → Slack). R2 (lifecycle). Domain + SSL + email (SPF/DKIM/DMARC). Better Stack uptime (free).
Est: 6h | Deps: none | Risk: Medium

**Step 247 — Production smoke test [P7][T2]**
Deploy. Full smoke: sign up → audit → progress → report → export → billing. Monitoring captures events. Fix production issues.
Est: 4h | Deps: 246 | Risk: Medium

**Step 248 — Pre-launch checklist [P9][T1]**
Security audit clean. Performance 90+ Lighthouse. Legal pages live. Analytics instrumented. Monitoring active. Backup tested. Cookie consent working.
Est: 2h | Deps: all prior | Risk: Low

**Step 249 — Soft launch (beta, 10-50 users) [P9][T1]**
Invite 10-50 beta users. Direct feedback channel (Discord server or Google Form — free). Session recordings (PostHog, with consent). Track activation: % completing first audit. Critical fixes only. Measure: signup → first audit → report view funnel.
Est: 4h | Deps: 248 | Risk: Medium

**Step 250 — Public launch + Week 1 stabilization [P9][T1]**
Product Hunt, Hacker News, X/Twitter, relevant subreddits. Monitor: error rates, response times, worker health, signups, first-audit success rate. Hot-fix production issues. Capture NPS at 7 days. Personal follow-ups with early users. Fix P2 bugs. Write retrospective. Plan v1.1.
**Post-launch feedback loop:** User data → update Phase 2 (UX), Phase 3 (API), Phase 8 (docs). Re-read threat model. Update tech debt register weekly.
Est: 8h | Deps: 249 | Risk: Medium

---

## Summary

| Metric                     | Value                                                                                                    |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| Total steps                | 250                                                                                                      |
| Estimated hours            | ~640h                                                                                                    |
| Estimated weeks            | ~21.5 (solo + AI)                                                                                        |
| Milestone gates            | 7 (M1-M7 at steps 35, 75, 110, 165, 210, 240, 250)                                                       |
| Methodology phases covered | P0-P9 (all 10)                                                                                           |
| Tier                       | T2 (T1 + T2 steps included)                                                                              |
| HIGH risk steps            | 7 (browser pool, audit processor, engine executor, Lighthouse, Memory CDP, full integration, production) |
| Testing steps              | ~50 (interleaved, not piled at end)                                                                      |
| Documentation steps        | ~12 (ADRs, README, runbook, user docs, changelog)                                                        |
| Privacy/Legal steps        | 5 (data inventory, consent, retention, legal docs, DPAs)                                                 |
| Tech debt reviews          | 6 (one per stage gate)                                                                                   |
| Budget at launch           | $0-15/month (domain only)                                                                                |

## Key Changes from v3.0

1. **+8 UX/UI Design steps (P2)** — User flows, wireframes, onboarding UX, accessibility planning, SEO foundation
2. **+5 Privacy/Legal steps (P6)** — Data inventory, GDPR consent/erasure/portability, retention, legal docs, DPAs
3. **+12 Documentation steps (P8)** — ADRs throughout, developer README, runbook, user docs, changelog, tech debt register
4. **+4 Launch steps (P9)** — Analytics, pre-launch checklist, soft launch (beta), public launch strategy
5. **Tier markers [T1][T2]** on every step — know what's MVP vs paying customers
6. **Phase tags [P#]** on every step — maps to methodology phases P0-P9
7. **Bootstrapped-first tool table** — free tiers for everything, documented upgrade triggers
8. **20% tech debt allocation** enforced at every milestone gate
9. **Feedback loops** at every checkpoint — design ↔ backend ↔ testing
10. **5 reserved tech debt repayment steps** (206-210) — dedicated sprint for cleanup
11. **Cookie consent + PostHog analytics** added — privacy-first from day one
12. **Soft launch (beta)** before public launch — 10-50 users, measure activation
