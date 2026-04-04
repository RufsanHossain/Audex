# Audex — Onboarding & Activation UX

**Step 3 [P2][T1] | Version 1.0 | April 4, 2026**

---

## Activation Metric

**Definition:** A user is "activated" when they complete their first audit AND view the report page.

**Target:** < 2 minutes from signup to activation.

**Measurement:** Track `audit_first_completed` event in PostHog. Measure: % of signups reaching activation within 24 hours. Below 40% = onboarding problem.

---

## Design Principles

1. **Progressive disclosure** — guide one task at a time, reveal complexity as user is ready
2. **Fast path to value** — minimize steps between signup and seeing a real report
3. **Empty states are onboarding** — never show a blank page, always show a CTA
4. **Defer non-essential setup** — no project creation, no settings, no billing required for first audit
5. **Celebrate wins** — animated score reveal rewards completing the first audit

---

## The Activation Funnel

```
Visit landing page
  │  ↓  (CTA: "Analyze Free" or paste URL in hero)
  │
Sign up (or skip — first audit without account)
  │  ↓  (3 fields: name, email, password — OR 1-click OAuth)
  │
Dashboard (first visit)
  │  ↓  (onboarding card + prominent quick audit bar)
  │
Paste URL + click "Analyze"
  │  ↓  (redirect to progress page immediately)
  │
Watch progress (60-90 seconds)
  │  ↓  (11-tile grid animates, keeps user engaged)
  │
View report  ← ACTIVATION MOMENT
  │  ↓  (score reveal animation, AI summary, findings)
  │
Return (next session)
  │  ↓  (dashboard shows previous audit, encourages second)
```

**Drop-off risks and mitigations:**

| Stage                   | Risk                        | Mitigation                                                       |
| ----------------------- | --------------------------- | ---------------------------------------------------------------- |
| Landing → Signup        | Signup friction             | Hero URL input (try before signup). OAuth 1-click.               |
| Signup → Dashboard      | Email verification wall     | Allow dashboard access before verification. Verify later.        |
| Dashboard → First audit | Don't know what to do       | Onboarding card with 3-step checklist. URL bar is first element. |
| First audit → Wait      | Impatience during analysis  | Animated progress grid keeps attention. Show estimated time.     |
| Wait → Report           | Page reload / navigate away | SSE auto-reconnects. Progress persists. Email on completion.     |
| Report → Return         | No reason to come back      | Prompt: "Track this site over time? Create a project."           |

---

## Onboarding Components

### 1. Landing Page: Zero-Friction Trial

The hero URL input lets visitors try before signing up:

```
┌──────────────────────────────────────────┐
│  https://                   [Analyze Free]│
└──────────────────────────────────────────┘
  No account needed for your first audit
```

- First audit runs without authentication
- After report: "Sign up to save this report and track changes"
- Reduces landing-to-first-audit to ~90 seconds (no signup needed)

### 2. First-Visit Dashboard: Welcome Card

Shown when `user.auditCount === 0`. Dismissed on click or after first audit.

```
┌───────────────────────────────────────────────────┐
│  Welcome to Audex!                     [Dismiss ✕] │
│                                                    │
│  Get your first quality report in 3 steps:         │
│                                                    │
│  ① Paste a URL in the bar above          ○ / ✅    │
│  ② Watch the 11-dimension analysis       ○         │
│  ③ Review your detailed report           ○         │
│                                                    │
│  Takes about 60 seconds. Try it now.               │
└───────────────────────────────────────────────────┘
```

**Behavior:**

- Steps check off as user completes them (persisted in localStorage)
- Step 1 checks when user submits an audit
- Step 2 checks when progress page shows >= 50%
- Step 3 checks when report page is visited
- Card auto-hides after all 3 complete (with confetti or subtle animation)
- "Dismiss" removes card permanently (respect user choice)

### 3. Quick Audit Bar (Always Visible)

Top of dashboard, always accessible. The primary call-to-action.

```
┌─────────────────────────────────────────────────────┐
│  🔍 https://                            [Analyze]   │
└─────────────────────────────────────────────────────┘
```

- Auto-focus on first visit (user can start typing immediately)
- Real-time URL validation with visual feedback
- Favicon appears on valid URL
- Single click to start (desktop: default device, all dimensions)
- For power users: "Advanced options" link opens full audit form modal

### 4. Progress Page: Keep User Engaged

The 60-90 second wait is the biggest drop-off risk. Design to retain attention:

```
Phase 1 — Queued (0-5s)
  "Position 1 of 3 in queue"
  Show estimated wait time

Phase 2 — Navigation (5-10s)
  "Navigating to example.com..."
  Show redirect chain as it happens
  Display above-fold screenshot when captured

Phase 3 — Analysis (10-80s)
  11-tile grid with live updates:
  - Gray: waiting
  - Blue pulse: running (with % progress)
  - Green: complete (score fades in)
  - Red: failed

  Overall progress bar: ████████░░░░ 64%
  "Estimated: ~25 seconds remaining"

Phase 4 — Completion (final)
  Animated score counter: 0 → 87
  Grade badge fades in: B+
  Brief message: "Your site scores above average!"
  [View Full Report] button (primary, large)
```

**Engagement tricks:**

- Tiles complete out of order (feels dynamic, not linear)
- Each engine completion triggers a micro-animation
- Show the above-fold screenshot early (visual reward)
- "Fun fact" or tip while waiting (e.g., "Did you know? 53% of mobile users leave sites that take over 3 seconds to load.")

### 5. Report Page: Reward & Next Steps

The report IS the activation moment. Make it feel valuable:

```
Score Reveal:
  Animated counter from 0 → final score
  Grade badge with color pulse
  Confetti for A/B grades (subtle)

AI Summary (first thing visible after score):
  "Here's what we found..."
  Top 3 actionable items
  Feels like a personalized expert review

Bottom of Report — Next Steps:
  ┌────────────────────────────────────────────┐
  │  What's next?                              │
  │                                            │
  │  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
  │  │ Track    │  │ Export   │  │ Share    │ │
  │  │ Changes  │  │ PDF      │  │ Report   │ │
  │  │ Create a │  │ Download │  │ Send to  │ │
  │  │ project  │  │ report   │  │ team     │ │
  │  └──────────┘  └──────────┘  └──────────┘ │
  └────────────────────────────────────────────┘
```

### 6. Second Visit: Retention Hooks

When user returns (has >= 1 audit), dashboard shows:

- Previous audit with score prominently displayed
- "Run again to see what changed" CTA next to previous audit
- If score dropped since last audit: "Your score dropped 5 points. See what changed."
- Weekly digest email (opt-in) with score trends

---

## Onboarding State Machine

```
State: NEW_USER (auditCount === 0)
  → Show: welcome card + auto-focused URL bar
  → Track: signup_completed event

State: FIRST_AUDIT_STARTED (auditCount === 0, has queued/processing audit)
  → Show: progress page (redirect from dashboard)
  → Track: audit_first_started event

State: FIRST_AUDIT_COMPLETE (auditCount === 1)
  → Show: report with score animation + "What's next?" section
  → Track: audit_first_completed event (ACTIVATION)
  → Hide: welcome card permanently

State: ACTIVATED (auditCount >= 1, has viewed report)
  → Show: normal dashboard with stats + recent audits
  → Suggest: "Create a project to track changes over time"

State: ENGAGED (auditCount >= 3 OR has project)
  → Show: full dashboard experience
  → Suggest: upgrade prompts when hitting Free limits

State: CONVERTED (paid plan)
  → Show: full features unlocked
  → Suggest: API keys, webhooks, team features
```

---

## Upgrade Prompts (Natural Triggers)

Never interrupt the user's workflow. Show upgrade prompts at natural boundary moments:

| Trigger                     | Prompt                                                                | Location                       |
| --------------------------- | --------------------------------------------------------------------- | ------------------------------ |
| 3rd audit used (Free limit) | "You've used all 3 monthly audits. Upgrade to Pro for unlimited."     | Modal after 3rd report view    |
| Try to export PDF           | "PDF export is available on Pro. Upgrade to download."                | Inline on report page          |
| Try to share report         | "Report sharing is a Pro feature."                                    | Inline on report page          |
| Try to access API keys      | "API access requires Team plan."                                      | Settings page                  |
| After 5th audit (engaged)   | "Getting value from Audex? Pro gives you unlimited audits + exports." | Dashboard banner (dismissible) |
| Trial ending (3 days left)  | "Your Pro trial ends in 3 days."                                      | Dashboard banner + email       |

---

## Metrics to Track

| Metric                                | Target              | Event                       |
| ------------------------------------- | ------------------- | --------------------------- |
| Signup → first audit started          | > 60% within 10 min | `audit_first_started`       |
| First audit started → completed       | > 90%               | `audit_first_completed`     |
| First audit completed → report viewed | > 95%               | `report_first_viewed`       |
| Overall activation (signup → report)  | > 50% within 24h    | Composite funnel            |
| Day 7 retention                       | > 30%               | Return visit within 7 days  |
| Day 30 retention                      | > 15%               | Return visit within 30 days |
| Free → Pro conversion                 | > 5%                | `plan_upgraded`             |
| Second audit within 7 days            | > 40%               | `audit_second_started`      |
