# Audex — User Flow Map

**Step 1 [P2][T1] | Version 1.0 | April 4, 2026**

---

## Entry Points

| Source        | Landing Page                | Context                                                     |
| ------------- | --------------------------- | ----------------------------------------------------------- |
| Google Search | `/` (landing) or `/pricing` | Searching for "website audit tool", "code quality analysis" |
| Product Hunt  | `/` (landing)               | Launch day traffic, high intent to try                      |
| Hacker News   | `/` (landing)               | Developer audience, skeptical, wants to try immediately     |
| Direct URL    | `/` (landing)               | Word of mouth, shared link                                  |
| Shared Report | `/reports/[slug]` (public)  | Received a shared audit report, sees value → signs up       |
| API Docs      | `/api/docs`                 | Developer looking to integrate, high-intent Team/Enterprise |
| GitHub/Blog   | `/` (landing)               | Content marketing, technical audience                       |

---

## Primary User Journey (Happy Path)

```
Landing Page (/)
  │
  ├─ "Try Free" CTA
  │
  ▼
Sign Up (/auth/signup)
  │  name, email, password
  │  OR Google/GitHub OAuth (1-click)
  │
  ▼
Email Verification (/auth/verify-email)
  │  check inbox → click link → verified
  │  (skip for OAuth — already verified)
  │
  ▼
Dashboard (/dashboard) — FIRST VISIT
  │  empty state → onboarding card:
  │  "Run your first audit in 30 seconds"
  │  quick audit bar prominent at top
  │
  ▼
Enter URL in Quick Audit Bar
  │  real-time URL validation
  │  auto-detect: desktop device, all dimensions
  │  click "Analyze"
  │
  ▼
Audit Progress (/audits/[id])
  │  queue position → navigation → engine grid
  │  11 tiles animate as engines complete
  │  ~60-90 seconds total
  │
  ▼
Report (/audits/[id]/report) ← ACTIVATION MOMENT
  │  composite score + grade reveal
  │  radar chart, AI summary, top findings
  │  dimension tabs with detailed findings
  │
  ▼
Export / Share (optional)
  │  "Export PDF" → download
  │  "Share" → copy public link
  │
  ▼
Return to Dashboard
  │  recent audit visible with score
  │  "Run another audit" or "Create project"
```

**Activation metric:** User completes first audit AND views the report page.
**Target:** < 2 minutes from signup to viewing first report.

---

## Secondary Flows

### Flow 2: Returning User (has audits)

```
Sign In (/auth/signin)
  │
  ▼
Dashboard (/dashboard)
  │  stats cards (total audits, avg score, trend)
  │  recent 5 audits with scores
  │  score trend chart
  │  quick audit bar
  │
  ├─ Quick audit bar → new audit → progress → report
  ├─ Click recent audit → report detail
  ├─ Projects → project detail → run audit for project
  └─ Settings → profile, API keys, billing, team
```

### Flow 3: Project-Based Workflow

```
Projects (/projects)
  │
  ├─ "New Project" → dialog (name, URL, settings)
  │
  ▼
Project Detail (/projects/[id])
  │  score history chart (trend over time)
  │  audit history table
  │  "Run Audit" (pre-fills URL + settings)
  │
  ▼
Audit runs within project context
  │  report shows comparison vs previous
  │  new/fixed/regressed findings highlighted
```

### Flow 4: API User (Team/Enterprise)

```
Settings → API Keys (/settings/api-keys)
  │  "Generate Key" → dialog → copy raw key (shown once)
  │
  ▼
Use API programmatically
  │  POST /api/v1/audits (Bearer token)
  │  GET /api/v1/audits/:id/progress (SSE)
  │  GET /api/v1/audits/:id/report
  │
  ▼
Configure webhooks (/settings → webhooks)
  │  receive audit.completed events
  │  integrate with CI/CD pipeline
```

### Flow 5: Upgrade Path

```
Free user hits limit
  │  "You've used 3 of 3 monthly audits"
  │  OR tries to export PDF → "Upgrade to Pro"
  │  OR tries API access → "Upgrade to Team"
  │
  ▼
Pricing Page (/pricing)
  │  plan comparison table
  │  annual/monthly toggle
  │
  ▼
Stripe Checkout (external)
  │  payment → redirect back
  │
  ▼
Dashboard — plan upgraded
  │  toast: "Welcome to Pro!"
  │  limits lifted, features unlocked
```

### Flow 6: Shared Report Viewer (No Account)

```
Receives shared link
  │
  ▼
Public Report (/reports/[slug])
  │  read-only report view
  │  no auth required
  │  CTA: "Want to audit your own site? Sign up free"
  │
  ▼
Sign Up (if interested) → normal flow
```

### Flow 7: Admin

```
Admin Dashboard (/admin)
  │  system stats, worker health, queue metrics
  │
  ├─ User Management (/admin/users) → list, detail, role change
  ├─ System Health (/admin/system) → Redis, MongoDB, workers
  └─ DLQ (/admin/dlq) → failed jobs, requeue/discard
```

---

## Edge Cases & Error Recovery

### Empty States

| Page                    | Empty State                         | CTA                         |
| ----------------------- | ----------------------------------- | --------------------------- |
| Dashboard (first visit) | Welcome card + onboarding steps     | "Run your first audit"      |
| Dashboard (no recent)   | "No audits yet" illustration        | "Analyze a URL"             |
| Projects list           | "Organize your audits" illustration | "Create your first project" |
| Audits list             | "Nothing here yet"                  | "Run an audit"              |
| Notifications           | "All caught up"                     | —                           |
| API keys                | "No API keys"                       | "Generate your first key"   |

### Error Recovery

| Scenario                  | User Sees                                                     | Recovery Action                             |
| ------------------------- | ------------------------------------------------------------- | ------------------------------------------- |
| Invalid URL submitted     | Inline error: "Enter a valid URL (e.g., https://example.com)" | Fix URL, resubmit                           |
| Audit fails (unreachable) | Error page: "We couldn't reach this URL" + error code         | "Try again" button, check URL               |
| Audit fails (timeout)     | Error page: "Analysis timed out"                              | "Retry" button (with extended timeout)      |
| Audit partial failure     | Report with warning: "3 of 11 engines completed"              | View partial report, "Retry failed engines" |
| Rate limited              | Toast: "Slow down! Try again in X seconds"                    | Wait, auto-retry timer shown                |
| Plan limit reached        | Modal: "You've used all 3 monthly audits"                     | "Upgrade to Pro" or wait for reset          |
| Network lost during SSE   | Auto-reconnect (3 attempts), then "Connection lost" banner    | "Reconnect" button, refresh page            |
| Session expired           | Redirect to /auth/signin with "Session expired" message       | Sign in again, return to previous page      |
| 404 (audit not found)     | Branded 404: "Audit not found"                                | "Go to Dashboard" link                      |
| 403 (not your audit)      | Branded 403: "You don't have access"                          | "Go to Dashboard" link                      |
| 500 (server error)        | Error boundary: "Something went wrong" + Sentry ID            | "Try again" button, contact support link    |
| Payment failed            | Email notification + banner in app                            | "Update payment method" → Stripe portal     |

### Concurrent / Race Conditions

| Scenario                                      | Handling                                                         |
| --------------------------------------------- | ---------------------------------------------------------------- |
| Submit audit while one is running (Free plan) | Block: "You have an audit in progress. Wait for it to complete." |
| Two tabs open on same audit progress          | Both receive SSE events independently, both stay in sync         |
| Cancel audit while engine is running          | Engine aborted, partial results preserved, status → cancelled    |
| Delete project with running audit             | Block: "Complete or cancel running audits first"                 |
| Revoke API key while request in-flight        | Request completes (key cached 5 min), subsequent requests fail   |

---

## Page Inventory (23 unique screens)

### Public (no auth)

1. `/` — Landing page
2. `/pricing` — Plan comparison
3. `/auth/signin` — Sign in
4. `/auth/signup` — Sign up
5. `/auth/verify-email` — Email verification
6. `/auth/forgot-password` — Forgot password
7. `/auth/reset-password` — Reset password
8. `/reports/[slug]` — Public shared report

### Authenticated (dashboard)

9. `/dashboard` — Overview + quick audit
10. `/audits` — Audit list
11. `/audits/[id]` — Audit detail (progress or redirect to report)
12. `/audits/[id]/report` — Full report
13. `/projects` — Project list
14. `/projects/[id]` — Project detail
15. `/settings/profile` — Profile settings
16. `/settings/security` — Active sessions
17. `/settings/api-keys` — API key management
18. `/settings/notifications` — Notification preferences
19. `/settings/billing` — Billing & plan
20. `/settings/team` — Team management (Team+)

### Admin

21. `/admin` — Admin dashboard
22. `/admin/users` — User management
23. `/admin/system` — System health + DLQ

---

## Navigation Structure

### Sidebar (Desktop)

```
┌─────────────────────┐
│  🔍 Audex           │  ← logo, link to dashboard
├─────────────────────┤
│  ▸ Dashboard        │
│  ▸ Projects         │
│  ▸ Audits           │
├─────────────────────┤
│  ▸ Settings         │  ← expandable: profile, security,
│                     │     API keys, notifications, billing, team
├─────────────────────┤
│  ▸ Admin            │  ← admin only, expandable
└─────────────────────┘
```

### Mobile (Bottom Tab Bar)

```
┌──────┬──────┬──────┬──────┐
│ Home │ Proj │Audit │ More │
└──────┴──────┴──────┴──────┘
```

### Header

```
┌────────────────────────────────────────────┐
│  Breadcrumbs          🔔  🌙/☀️  👤 Menu  │
└────────────────────────────────────────────┘
```

---

## Keyboard Shortcuts (Power Users)

| Shortcut   | Action                                              |
| ---------- | --------------------------------------------------- |
| `Cmd+K`    | Command palette (search audits, projects, navigate) |
| `N`        | New audit (when on dashboard/audits)                |
| `G then D` | Go to Dashboard                                     |
| `G then P` | Go to Projects                                      |
| `G then A` | Go to Audits                                        |
| `?`        | Show shortcuts overlay                              |
