# Audex — Wireframes (10 Core Screens)

**Step 2 [P2][T1] | Version 1.0 | April 4, 2026**
**Approach:** Low-fidelity text wireframes. Focus on layout hierarchy, content placement, and responsive behavior. Mobile-first (375px) then desktop (1440px).

---

## 1. Landing Page (`/`)

### Desktop (1440px)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Logo                          Features  Pricing  Docs   [Sign In]  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│              Know exactly how your website performs.                  │
│         AI-powered analysis across 11 quality dimensions.            │
│                                                                      │
│    ┌──────────────────────────────────────┐                          │
│    │  https://                        [Analyze Free]                 │
│    └──────────────────────────────────────┘                          │
│                  No signup required for first audit                   │
│                                                                      │
│    ┌─────────────── Score Preview ────────────────┐                  │
│    │  ┌──────┐                                    │                  │
│    │  │  87  │  Radar chart showing 11 dims       │                  │
│    │  │  B+  │  animated on scroll-in             │                  │
│    │  └──────┘                                    │                  │
│    └──────────────────────────────────────────────┘                  │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                       11 Dimensions                                  │
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ Security │ │  Perf    │ │  A11y    │ │   SEO    │               │
│  │  icon    │ │  icon    │ │  icon    │ │  icon    │               │
│  │ 2 lines  │ │ 2 lines  │ │ 2 lines  │ │ 2 lines  │               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │  Speed   │ │ Privacy  │ │ Network  │ │Best Prac │               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                            │
│  │   UI     │ │   UX     │ │ Memory   │                            │
│  └──────────┘ └──────────┘ └──────────┘                            │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                      How It Works                                    │
│                                                                      │
│    1. Enter URL          2. Watch Analysis       3. Get Report       │
│    [paste icon]          [progress icon]         [report icon]       │
│    Paste any URL         11 engines run          Detailed findings   │
│    and click go          in parallel             with AI summary     │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                       Pricing Preview                                │
│                                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │
│  │    Free    │  │    Pro     │  │    Team    │  │  Enterprise  │  │
│  │    $0/mo   │  │   $29/mo   │  │   $79/mo   │  │   Custom     │  │
│  │  3 audits  │  │  Unlimited │  │  + API     │  │  + SSO       │  │
│  │  [Start]   │  │  [Try 14d] │  │  [Try 14d] │  │  [Contact]   │  │
│  └────────────┘  └────────────┘  └────────────┘  └──────────────┘  │
│                     See full comparison →                             │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  Logo    Features  Pricing  Docs  |  Terms  Privacy  Cookie Policy  │
│          © 2026 Audex             |  GitHub  Twitter                 │
└──────────────────────────────────────────────────────────────────────┘
```

### Mobile (375px)

```
┌─────────────────────────┐
│  Logo         [Sign In] │
├─────────────────────────┤
│                         │
│  Know exactly how       │
│  your website performs.  │
│                         │
│  ┌───────────────────┐  │
│  │ https://          │  │
│  └───────────────────┘  │
│  [  Analyze Free  ]     │
│                         │
│  ┌── Score Preview ──┐  │
│  │   87 B+           │  │
│  │   radar chart     │  │
│  └───────────────────┘  │
│                         │
│  11 Dimensions          │
│  (2-col grid)           │
│  ┌────────┐ ┌────────┐ │
│  │Security│ │ Perf   │ │
│  └────────┘ └────────┘ │
│  ... (scrollable)       │
│                         │
│  How It Works           │
│  1 → 2 → 3 (vertical)  │
│                         │
│  Pricing (stacked)      │
│  [Free] [Pro] [Team]    │
│                         │
│  Footer (stacked)       │
└─────────────────────────┘
```

**Key decisions:**

- Hero has inline URL input for instant trial (no signup friction)
- "No signup required for first audit" — drives activation
- Pricing preview on landing, not just `/pricing`
- 11 dimensions shown as icon grid, not a wall of text

---

## 2. Sign In / Sign Up (`/auth/signin`, `/auth/signup`)

### Desktop (1440px)

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                            ┌──────────────────────┐                  │
│                            │       Logo            │                  │
│                            │                       │                  │
│                            │   Sign in to Audex    │                  │
│                            │                       │                  │
│                            │  ┌────────────────┐   │                  │
│                            │  │ Email          │   │                  │
│                            │  └────────────────┘   │                  │
│                            │  ┌────────────────┐   │                  │
│                            │  │ Password   👁   │   │                  │
│                            │  └────────────────┘   │                  │
│                            │  Forgot password?     │                  │
│                            │                       │                  │
│                            │  [ Sign In         ]  │                  │
│                            │                       │                  │
│                            │  ────── or ──────     │                  │
│                            │                       │                  │
│                            │  [ G  Google    ]     │                  │
│                            │  [    GitHub    ]     │                  │
│                            │                       │                  │
│                            │  No account? Sign up  │                  │
│                            └──────────────────────┘                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Sign Up variant (additional fields)

```
                            │   Create your account  │
                            │                        │
                            │  ┌──────────────────┐  │
                            │  │ Full name        │  │
                            │  └──────────────────┘  │
                            │  ┌──────────────────┐  │
                            │  │ Email            │  │
                            │  └──────────────────┘  │
                            │  ┌──────────────────┐  │
                            │  │ Password     👁   │  │
                            │  └──────────────────┘  │
                            │  ░░░░░░░░ strength bar │
                            │  ┌──────────────────┐  │
                            │  │ Confirm password │  │
                            │  └──────────────────┘  │
                            │  ☐ I agree to Terms    │
                            │                        │
                            │  [ Create Account   ]  │
                            │                        │
                            │  ────── or ──────      │
                            │  [ G  Google    ]      │
                            │  [    GitHub    ]      │
                            │                        │
                            │  Have an account?      │
                            │  Sign in               │
```

**Key decisions:**

- Centered card on dark background — no sidebar, no distractions
- OAuth buttons below form (credentials primary for control)
- Password strength meter on signup
- Terms checkbox required before submit
- Same layout on mobile, just narrower card

---

## 3. Dashboard (`/dashboard`)

### Desktop (1440px)

```
┌────────┬─────────────────────────────────────────────────────────────┐
│        │  Dashboard              🔔 2  🌙  👤 Rufsan ▾             │
│ AUDEX  ├─────────────────────────────────────────────────────────────┤
│        │                                                             │
│ ▸ Dash │  ┌─────────────────────────────────────────────────────┐   │
│ ▸ Proj │  │  🔍 https://                          [Analyze]    │   │
│ ▸ Audit│  └─────────────────────────────────────────────────────┘   │
│        │                                                             │
│ ────── │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ ▸ Sett │  │ Total    │ │ Avg      │ │ Trend    │ │ Projects │     │
│        │  │ Audits   │ │ Score    │ │  ▲ +5    │ │          │     │
│        │  │   47     │ │  78 (C+) │ │ (7 days) │ │    8     │     │
│        │  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│        │                                                             │
│        │  ┌───────────────────────────────────────────────────┐     │
│        │  │            Score Trend (30 days)                  │     │
│        │  │    90 ─  ╭───╮                                   │     │
│        │  │    80 ─ ╯    ╰──╮    ╭──                         │     │
│        │  │    70 ─         ╰────╯                           │     │
│        │  │    60 ─                                          │     │
│        │  │        Mar 5    Mar 12   Mar 19   Mar 26         │     │
│        │  │                               [7d] [30d] [90d]  │     │
│        │  └───────────────────────────────────────────────────┘     │
│        │                                                             │
│        │  Recent Audits                                              │
│        │  ┌────────────────────────────────────────────────────┐    │
│        │  │ URL                  Score  Grade  Status   Date  │    │
│        │  ├────────────────────────────────────────────────────┤    │
│        │  │ example.com           87     B+   ✅ Done  2h ago │    │
│        │  │ mysite.io             62     D    ✅ Done  1d ago │    │
│        │  │ shop.co               91     A    ✅ Done  3d ago │    │
│        │  │ blog.dev              74     C    ✅ Done  5d ago │    │
│        │  │ app.test              45     F    ❌ Fail  7d ago │    │
│        │  └────────────────────────────────────────────────────┘    │
│        │                                                             │
└────────┴─────────────────────────────────────────────────────────────┘
```

### First Visit (Empty State)

```
│        │                                                             │
│        │  ┌─────────────────────────────────────────────────────┐   │
│        │  │  🔍 https://                          [Analyze]    │   │
│        │  └─────────────────────────────────────────────────────┘   │
│        │                                                             │
│        │  ┌───────────────────────────────────────────────────┐     │
│        │  │  👋 Welcome to Audex!                             │     │
│        │  │                                                   │     │
│        │  │  Get started in 3 steps:                          │     │
│        │  │                                                   │     │
│        │  │  ① Paste a URL above                ✅ / ○        │     │
│        │  │  ② Watch the 11-dimension analysis  ○             │     │
│        │  │  ③ Review your detailed report      ○             │     │
│        │  │                                                   │     │
│        │  │  Your first audit takes about 60 seconds.         │     │
│        │  │                              [Dismiss]            │     │
│        │  └───────────────────────────────────────────────────┘     │
│        │                                                             │
│        │  ┌───────────────────────────────────────────────────┐     │
│        │  │              No audits yet                        │     │
│        │  │      Run your first audit to see results here     │     │
│        │  └───────────────────────────────────────────────────┘     │
```

### Mobile (375px)

```
┌─────────────────────────┐
│  ☰ Dashboard     🔔  👤│
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ https://    [Go]    │ │
│ └─────────────────────┘ │
│                         │
│ ┌──────────┐┌──────────┐│
│ │Audits: 47││Score: 78 ││
│ └──────────┘└──────────┘│
│ ┌──────────┐┌──────────┐│
│ │Trend: +5 ││Proj: 8   ││
│ └──────────┘└──────────┘│
│                         │
│ Score Trend (chart)     │
│ ┌─────────────────────┐ │
│ │  ~~chart~~          │ │
│ └─────────────────────┘ │
│                         │
│ Recent Audits (cards)   │
│ ┌─────────────────────┐ │
│ │ example.com     87  │ │
│ │ Done · 2h ago   B+  │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ mysite.io        62 │ │
│ │ Done · 1d ago    D  │ │
│ └─────────────────────┘ │
│                         │
├──────┬──────┬──────┬────┤
│ Home │ Proj │Audit │More│
└──────┴──────┴──────┴────┘
```

**Key decisions:**

- Quick audit bar is the FIRST element (drives activation)
- Stats cards in a 4-column row
- Score trend chart is prominent (shows value over time)
- Recent audits as table (desktop) / cards (mobile)
- First-visit onboarding card with 3-step checklist

---

## 4. New Audit Form (modal or page)

### Desktop (modal overlay)

```
┌──────────────────────────────────────────┐
│  New Audit                          ✕    │
├──────────────────────────────────────────┤
│                                          │
│  URL                                     │
│  ┌────────────────────────────────────┐  │
│  │ https://example.com            🌐  │  │
│  └────────────────────────────────────┘  │
│  ✅ Valid URL                            │
│                                          │
│  Device                                  │
│  ┌──────────┐ ┌──────────┐              │
│  │ 🖥 Desk  │ │ 📱 Mobi  │              │
│  │ (active) │ │          │              │
│  └──────────┘ └──────────┘              │
│                                          │
│  Project (optional)                      │
│  ┌────────────────────────────────────┐  │
│  │ Select project...              ▾  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Dimensions                              │
│  ☑ All (11)                              │
│  ┌──────────────────────────────────┐    │
│  │ ☑ Security    ☑ Performance     │    │
│  │ ☑ A11y        ☑ SEO            │    │
│  │ ☑ Speed       ☑ Privacy        │    │
│  │ ☑ Network     ☑ Best Practices │    │
│  │ ☑ UI          ☑ UX            │    │
│  │ ☑ Memory                       │    │
│  └──────────────────────────────────┘    │
│                                          │
│             [Cancel]  [Analyze]          │
└──────────────────────────────────────────┘
```

**Key decisions:**

- Modal over dashboard (keeps context, fast path)
- URL input with live validation + favicon preview
- Device toggle (desktop default)
- Project optional (don't force organization on first use)
- All dimensions selected by default
- "Analyze" is the primary CTA

---

## 5. Audit Progress (`/audits/[id]`)

### Desktop (1440px)

```
┌────────┬─────────────────────────────────────────────────────────────┐
│        │  Audit Progress                                             │
│ Sidebar├─────────────────────────────────────────────────────────────┤
│        │                                                             │
│        │  ┌───────────────────────────────────────────────────┐     │
│        │  │  🌐 example.com                    🖥 Desktop    │     │
│        │  │  Redirect: example.com → www.example.com (301)   │     │
│        │  └───────────────────────────────────────────────────┘     │
│        │                                                             │
│        │  Overall Progress                                           │
│        │  ████████████████████░░░░░░░░░░░░░░░  64%                  │
│        │                                                             │
│        │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│        │  │ Security │ │  Perf    │ │  A11y    │ │   SEO    │     │
│        │  │   ✅ 92  │ │  ⏳ 43% │ │   ✅ 87  │ │   ✅ 95  │     │
│        │  │  done    │ │ running  │ │  done    │ │  done    │     │
│        │  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│        │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│        │  │  Speed   │ │ Privacy  │ │ Network  │ │Best Prac │     │
│        │  │   ⏳ 12% │ │  ⏸ wait │ │   ✅ 88  │ │   ✅ 79  │     │
│        │  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│        │  ┌──────────┐ ┌──────────┐ ┌──────────┐                  │
│        │  │   UI     │ │   UX     │ │ Memory   │                  │
│        │  │  ⏸ wait  │ │  ⏸ wait  │ │  ⏸ wait  │                  │
│        │  └──────────┘ └──────────┘ └──────────┘                  │
│        │                                                             │
│        │  Estimated time remaining: ~25 seconds                      │
│        │                                                             │
└────────┴─────────────────────────────────────────────────────────────┘
```

### Completion State

```
│        │                                                             │
│        │           ┌──────────────┐                                  │
│        │           │              │                                  │
│        │           │     87       │   animated counter 0 → 87       │
│        │           │     B+       │   grade fades in                 │
│        │           │              │                                  │
│        │           └──────────────┘                                  │
│        │                                                             │
│        │     "Your site scores above average!"                       │
│        │     3 critical · 8 high · 15 medium findings               │
│        │                                                             │
│        │              [ View Full Report ]                           │
│        │                                                             │
```

**Key decisions:**

- 11-tile grid (4+4+3 layout) with live status per engine
- Color transition: gray (waiting) → blue (running) → green/red (done)
- Score appears in tile on completion
- Overall progress bar at top
- Completion: animated score reveal, grade, "View Report" CTA
- URL + redirect chain shown at top for context

---

## 6. Report Overview (`/audits/[id]/report`)

### Desktop (1440px)

```
┌────────┬─────────────────────────────────────────────────────────────┐
│        │  Report: example.com          [Export ▾] [Share]            │
│ Sidebar├─────────────────────────────────────────────────────────────┤
│        │                                                             │
│        │  ┌──────────────────────────────────────────────────┐      │
│        │  │                                                  │      │
│        │  │  ┌──────────┐   example.com                      │      │
│        │  │  │    87    │   Desktop · April 4, 2026          │      │
│        │  │  │    B+    │   Duration: 72s · 26 findings      │      │
│        │  │  │          │   React · Next.js · Vercel          │      │
│        │  │  └──────────┘                                    │      │
│        │  │                                                  │      │
│        │  └──────────────────────────────────────────────────┘      │
│        │                                                             │
│        │  ┌──────────────────┐ ┌──────────────────────────┐         │
│        │  │   Radar Chart    │ │   Severity Distribution  │         │
│        │  │                  │ │                          │         │
│        │  │    SEC:92        │ │  Critical ██ 3           │         │
│        │  │   /    \         │ │  High     ████ 8         │         │
│        │  │  UX    PERF:74   │ │  Medium   ███████ 15     │         │
│        │  │   \    /         │ │  Low      ██ 4           │         │
│        │  │    A11Y:87       │ │  Info     █ 2            │         │
│        │  │                  │ │                          │         │
│        │  └──────────────────┘ └──────────────────────────┘         │
│        │                                                             │
│        │  ┌───────────────── AI Summary ─────────────────┐          │
│        │  │  🤖 Powered by Claude                        │          │
│        │  │                                              │          │
│        │  │  Overall, example.com demonstrates strong     │          │
│        │  │  security practices but has significant       │          │
│        │  │  performance issues...                        │          │
│        │  │                                              │          │
│        │  │  Top 3 Issues:                               │          │
│        │  │  1. Render-blocking CSS (3 files, 240KB)     │          │
│        │  │  2. Missing alt text on 12 images            │          │
│        │  │  3. No cache headers on API responses        │          │
│        │  │                                              │          │
│        │  │  Action Items:                               │          │
│        │  │  ☐ Defer non-critical CSS                    │          │
│        │  │  ☐ Add descriptive alt text                  │          │
│        │  │  ☐ Configure Cache-Control headers           │          │
│        │  └──────────────────────────────────────────────┘          │
│        │                                                             │
│        │  Top Findings                                               │
│        │  ┌──────────────────────────────────────────────┐          │
│        │  │ 🔴 CRITICAL  Missing CSP header              │          │
│        │  │    Security · SEC-01 · View →                │          │
│        │  ├──────────────────────────────────────────────┤          │
│        │  │ 🔴 CRITICAL  Render-blocking resources (3)   │          │
│        │  │    Performance · PERF-03 · View →            │          │
│        │  ├──────────────────────────────────────────────┤          │
│        │  │ 🟠 HIGH  12 images missing alt text          │          │
│        │  │    Accessibility · A11Y-04 · View →          │          │
│        │  └──────────────────────────────────────────────┘          │
│        │                                                             │
```

**Key decisions:**

- Hero: score circle + grade + metadata (URL, date, duration, tech stack)
- Side-by-side: radar chart + severity distribution
- AI summary with actionable items (checklist format)
- Top 5 findings as preview cards with links to dimension detail
- Export dropdown (PDF, JSON, CSV) + Share button in header

---

## 7. Report Dimension Detail (tab panel within report)

### Desktop (1440px)

```
│        │                                                             │
│        │  ┌─────────────────────────────────────────────────┐       │
│        │  │ Security│ Perf │ A11y │ SEO │ Speed │ ...      │       │
│        │  │ 92  A   │74  C │87  B+│95  A│ 81  B │         │       │
│        │  └─────────────────────────────────────────────────┘       │
│        │                                                             │
│        │  ┌────── Security ───────────────────────────────┐         │
│        │  │                                               │         │
│        │  │  ┌────────┐  Score: 92 / 100  (A)             │         │
│        │  │  │   92   │  12 rules checked                 │         │
│        │  │  │    A   │  10 passed · 2 failed             │         │
│        │  │  └────────┘  3 findings                       │         │
│        │  │                                               │         │
│        │  │  ▸ Score Breakdown (collapsible)               │         │
│        │  │    Base: 100                                  │         │
│        │  │    SEC-01 CSP missing:        -10 (CRITICAL)  │         │
│        │  │    SEC-05 X-Powered-By:       -1  (LOW)       │         │
│        │  │    Pass bonus (10 checks):    +3              │         │
│        │  │    Final: 92                                  │         │
│        │  │                                               │         │
│        │  └───────────────────────────────────────────────┘         │
│        │                                                             │
│        │  Findings (3)                                               │
│        │                                                             │
│        │  ┌──────────────────────────────────────────────┐          │
│        │  │ 🔴 CRITICAL  SEC-01                  NEW     │          │
│        │  │                                              │          │
│        │  │ Missing Content-Security-Policy header        │          │
│        │  │                                              │          │
│        │  │ Your site does not set a CSP header, which   │          │
│        │  │ allows inline scripts and reduces XSS...     │          │
│        │  │                                              │          │
│        │  │ ▸ Recommendation                             │          │
│        │  │   Add Content-Security-Policy header with    │          │
│        │  │   default-src 'self'; script-src 'self'...   │          │
│        │  │                                              │          │
│        │  │ ▸ Code                                       │          │
│        │  │   ┌──────────────────────────────────────┐   │          │
│        │  │   │ // nginx.conf                        │   │          │
│        │  │   │ add_header Content-Security-Policy    │   │          │
│        │  │   │   "default-src 'self'";              │   │          │
│        │  │   └──────────────────────────────────────┘   │          │
│        │  │                                              │          │
│        │  │  📎 Learn more: MDN CSP Guide →              │          │
│        │  └──────────────────────────────────────────────┘          │
│        │                                                             │
│        │  ▸ Passed Checks (10)                                       │
│        │    ✅ HSTS header present (max-age=31536000)                │
│        │    ✅ X-Content-Type-Options: nosniff                       │
│        │    ✅ X-Frame-Options: SAMEORIGIN                           │
│        │    ...                                                      │
│        │                                                             │
```

**Key decisions:**

- Horizontal tab bar for 11 dimensions (scrollable on mobile)
- Each tab shows: score + grade + rule count + finding count
- Score breakdown is collapsible (transparency)
- Finding cards: severity, rule ID, comparison badge (NEW/FIXED/RECURRING)
- Recommendation + code snippet collapsible within finding
- Passed checks collapsed at bottom

---

## 8. Projects List (`/projects`)

### Desktop (1440px)

```
┌────────┬─────────────────────────────────────────────────────────────┐
│        │  Projects                         [+ New Project]           │
│ Sidebar├─────────────────────────────────────────────────────────────┤
│        │                                                             │
│        │  ┌──────────┐  Search projects...                           │
│        │  │ Sort: ▾  │  Name │ Score │ Date                         │
│        │  └──────────┘                                               │
│        │                                                             │
│        │  ┌──────────────────┐ ┌──────────────────┐                 │
│        │  │ My Portfolio     │ │ Client: ShopCo   │                 │
│        │  │ portfolio.dev    │ │ shop.co           │                 │
│        │  │                  │ │                   │                 │
│        │  │ Score: 87 B+     │ │ Score: 62 D       │                 │
│        │  │ Trend: ▲ +5     │ │ Trend: ▼ -3      │                 │
│        │  │                  │ │                   │                 │
│        │  │ 12 audits        │ │ 4 audits          │                 │
│        │  │ Last: 2h ago     │ │ Last: 3d ago      │                 │
│        │  └──────────────────┘ └──────────────────┘                 │
│        │  ┌──────────────────┐ ┌──────────────────┐                 │
│        │  │ Blog             │ │ API Docs          │                 │
│        │  │ blog.dev         │ │ docs.example.com  │                 │
│        │  │ Score: 91 A      │ │ Score: 74 C       │                 │
│        │  │ Trend: ── 0     │ │ Trend: ▲ +8      │                 │
│        │  │ 8 audits         │ │ 2 audits          │                 │
│        │  │ Last: 1w ago     │ │ Last: 5d ago      │                 │
│        │  └──────────────────┘ └──────────────────┘                 │
│        │                                                             │
└────────┴─────────────────────────────────────────────────────────────┘
```

**Key decisions:**

- Card grid (not table) — more visual, shows score prominence
- Each card: name, URL, score + grade, trend arrow, audit count, last audit
- Score color-coded by grade (green A, yellow C, red F)
- "+ New Project" button top right
- 2-column grid on desktop, single column on mobile

---

## 9. Settings (`/settings/profile`)

### Desktop (1440px)

```
┌────────┬─────────────────────────────────────────────────────────────┐
│        │  Settings                                                    │
│ Sidebar├─────────────────────────────────────────────────────────────┤
│        │                                                             │
│        │  ┌─────────┬──────────┬────────┬──────┬────────┬──────┐   │
│        │  │ Profile │ Security │API Keys│Notif │Billing │ Team │   │
│        │  └─────────┴──────────┴────────┴──────┴────────┴──────┘   │
│        │                                                             │
│        │  Profile                                                    │
│        │  ┌───────────────────────────────────────────────────┐     │
│        │  │  ┌─────┐                                         │     │
│        │  │  │ 👤  │  Change avatar                          │     │
│        │  │  └─────┘                                         │     │
│        │  │                                                  │     │
│        │  │  Full name                                       │     │
│        │  │  ┌──────────────────────────────────────────┐    │     │
│        │  │  │ Rufsan                                   │    │     │
│        │  │  └──────────────────────────────────────────┘    │     │
│        │  │                                                  │     │
│        │  │  Email                                           │     │
│        │  │  ┌──────────────────────────────────────────┐    │     │
│        │  │  │ rufsan@example.com                       │    │     │
│        │  │  └──────────────────────────────────────────┘    │     │
│        │  │  Changing email requires re-verification         │     │
│        │  │                                                  │     │
│        │  │                              [Save Changes]      │     │
│        │  └───────────────────────────────────────────────────┘     │
│        │                                                             │
│        │  Password                                                   │
│        │  ┌───────────────────────────────────────────────────┐     │
│        │  │  Current password  ┌─────────────────────────┐   │     │
│        │  │                    │                         │   │     │
│        │  │  New password      ┌─────────────────────────┐   │     │
│        │  │                    │                         │   │     │
│        │  │  Confirm           ┌─────────────────────────┐   │     │
│        │  │                    │                         │   │     │
│        │  │                            [Change Password] │   │     │
│        │  └───────────────────────────────────────────────────┘     │
│        │                                                             │
│        │  Danger Zone                                                │
│        │  ┌───────────────────────────────────────────────────┐     │
│        │  │  Delete Account                                  │     │
│        │  │  Permanently delete your account and all data.   │     │
│        │  │                              [Delete Account]    │     │
│        │  └───────────────────────────────────────────────────┘     │
│        │                                                             │
└────────┴─────────────────────────────────────────────────────────────┘
```

**Key decisions:**

- Horizontal tabs for settings sections (Profile, Security, API Keys, Notifications, Billing, Team)
- Grouped form sections with clear hierarchy
- Danger zone visually separated (red border/text)
- Password change as separate section (not inline with profile)
- Mobile: tabs become scrollable horizontal or a dropdown

---

## 10. Pricing Page (`/pricing`)

### Desktop (1440px)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Logo                          Features  Pricing  Docs   [Sign In]  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                  Simple, transparent pricing                         │
│            Start free. Upgrade when you need more.                   │
│                                                                      │
│                    [Monthly]  [Annual -17%]                          │
│                                                                      │
│  ┌──────────────┐ ┌───────────────┐ ┌──────────────┐ ┌───────────┐ │
│  │     Free     │ │     Pro       │ │    Team      │ │Enterprise │ │
│  │              │ │  RECOMMENDED  │ │              │ │           │ │
│  │    $0/mo     │ │   $29/mo      │ │   $79/mo     │ │  Custom   │ │
│  │              │ │  $290/yr      │ │  $790/yr     │ │           │ │
│  │              │ │               │ │              │ │           │ │
│  │ 3 audits/mo  │ │ Unlimited     │ │ Everything   │ │Everything │ │
│  │ 11 dimensions│ │ PDF export    │ │ in Pro, plus:│ │in Team +: │ │
│  │ Basic report │ │ JSON/CSV      │ │ API access   │ │ SSO       │ │
│  │ 30-day data  │ │ AI summary    │ │ Webhooks     │ │ SLA       │ │
│  │              │ │ Report share  │ │ Team mgmt    │ │ Dedicated │ │
│  │              │ │ 1-year data   │ │ Scheduled    │ │ support   │ │
│  │              │ │               │ │ Unlimited    │ │           │ │
│  │              │ │ 14-day trial  │ │ data         │ │           │ │
│  │              │ │               │ │              │ │           │ │
│  │ [Get Started]│ │[Start Trial] │ │[Start Trial]│ │[Contact] │ │
│  └──────────────┘ └───────────────┘ └──────────────┘ └───────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Feature Comparison                                          │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │  Feature            Free    Pro     Team    Enterprise      │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │  Monthly audits     3       ∞       ∞       ∞              │   │
│  │  Dimensions         11      11      11      11             │   │
│  │  PDF export         ✗       ✓       ✓       ✓              │   │
│  │  JSON/CSV export    ✗       ✓       ✓       ✓              │   │
│  │  AI summary         ✗       ✓       ✓       ✓              │   │
│  │  Report sharing     ✗       ✓       ✓       ✓              │   │
│  │  API access         ✗       ✗       ✓       ✓              │   │
│  │  Webhooks           ✗       ✗       ✓       ✓              │   │
│  │  Team management    ✗       ✗       ✓       ✓              │   │
│  │  Scheduled audits   ✗       ✗       ✓       ✓              │   │
│  │  SSO                ✗       ✗       ✗       ✓              │   │
│  │  Data retention     30d     1yr     ∞       ∞              │   │
│  │  Support            Community Email  Priority Dedicated     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  FAQ                                                                 │
│  ▸ Can I cancel anytime?                                            │
│  ▸ What happens when my trial ends?                                 │
│  ▸ Do you offer refunds?                                            │
│  ▸ What payment methods do you accept?                              │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  Footer                                                              │
└──────────────────────────────────────────────────────────────────────┘
```

**Key decisions:**

- Pro plan highlighted as "RECOMMENDED" (most common upgrade)
- Annual/monthly toggle with savings shown
- Feature comparison table below cards (scroll target)
- FAQ at bottom (addresses objections)
- "14-day trial" messaging prominent on Pro and Team
- Enterprise is "Contact" (no self-serve checkout)
- Mobile: cards stack vertically, comparison table scrolls horizontally

---

## Responsive Behavior Summary

| Component      | Desktop (1440px) | Tablet (768px)        | Mobile (375px)       |
| -------------- | ---------------- | --------------------- | -------------------- |
| Sidebar        | Fixed 240px      | Collapsed (hamburger) | Hidden (bottom tabs) |
| Stats cards    | 4-column row     | 2x2 grid              | 2x2 grid             |
| Data tables    | Full table       | Full table (scroll)   | Card stack           |
| Charts         | Inline           | Inline (smaller)      | Full width           |
| Modals         | Centered overlay | Centered overlay      | Full screen sheet    |
| Pricing cards  | 4-column row     | 2x2 grid              | Vertical stack       |
| Dimension grid | 4+4+3 layout     | 3+3+3+2               | 2+2+2+2+2+1          |
| Navigation     | Sidebar + header | Hamburger + header    | Bottom tabs + header |

---

## Component Inventory (from wireframes)

### New components needed (not in @audex/ui yet)

| Component         | Used In                     | Notes                           |
| ----------------- | --------------------------- | ------------------------------- |
| `ScoreCircle`     | Dashboard, Report, Progress | Animated circular score + grade |
| `RadarChart`      | Report overview             | 11-axis Recharts radar          |
| `SeverityBar`     | Report overview             | Stacked horizontal bar          |
| `ScoreTrendChart` | Dashboard, Project detail   | Recharts line chart             |
| `EngineGrid`      | Audit progress              | 11-tile grid with live status   |
| `FindingCard`     | Report dimension detail     | Expandable finding with code    |
| `DimensionTabs`   | Report                      | Scrollable tab bar with scores  |
| `StatsCard`       | Dashboard                   | Number + label + trend arrow    |
| `ProjectCard`     | Projects list               | Card with score + metadata      |
| `OnboardingCard`  | Dashboard (first visit)     | 3-step checklist                |
| `QuickAuditBar`   | Dashboard                   | URL input + analyze button      |
| `PricingCard`     | Pricing page                | Plan card with features         |
| `FeatureTable`    | Pricing page                | Comparison matrix               |
| `EmptyState`      | Multiple pages              | Illustration + CTA              |
| `CommandPalette`  | Global                      | Cmd+K search overlay            |
