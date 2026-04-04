# Audex — Design System Verification

**Step 7 [P2][T1] | Version 1.0 | April 4, 2026**

---

## Current @audex/ui Inventory

### Existing Components (19)

| Component          | Variants                                                  | Sub-Components                                                               | Status |
| ------------------ | --------------------------------------------------------- | ---------------------------------------------------------------------------- | ------ |
| `Alert`            | —                                                         | —                                                                            | Ready  |
| `Avatar`           | —                                                         | —                                                                            | Ready  |
| `Badge`            | 6 (default, secondary, destructive, outline, ghost, link) | —                                                                            | Ready  |
| `Button`           | 6 variants, 7 sizes (incl. icon sizes)                    | —                                                                            | Ready  |
| `Card`             | —                                                         | Header, Title, Description, Action, Content, Footer                          | Ready  |
| `Dialog`           | —                                                         | Trigger, Portal, Overlay, Content, Header, Footer, Title, Description, Close | Ready  |
| `DropdownMenu`     | —                                                         | —                                                                            | Ready  |
| `Input`            | —                                                         | —                                                                            | Ready  |
| `Label`            | —                                                         | —                                                                            | Ready  |
| `Progress`         | —                                                         | —                                                                            | Ready  |
| `ScrollArea`       | —                                                         | —                                                                            | Ready  |
| `Select`           | —                                                         | —                                                                            | Ready  |
| `Separator`        | —                                                         | —                                                                            | Ready  |
| `Sheet`            | 4 sides                                                   | Trigger, Content, Header, Footer, Title, Description, Close                  | Ready  |
| `Skeleton`         | —                                                         | —                                                                            | Ready  |
| `Sonner` (Toaster) | themed icons                                              | —                                                                            | Ready  |
| `Tabs`             | 2 (default, line)                                         | List, Trigger, Content                                                       | Ready  |
| `ThemeProvider`    | —                                                         | —                                                                            | Ready  |
| `Tooltip`          | —                                                         | —                                                                            | Ready  |

### Existing Utilities

| Utility | Location       | Purpose                                 |
| ------- | -------------- | --------------------------------------- |
| `cn()`  | `lib/utils.ts` | clsx + tailwind-merge class composition |

### Existing Theme

| Token Category | Coverage                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------- |
| Colors         | Full light/dark system (primary, secondary, accent, destructive, success, warning, info, sidebar) |
| Radius         | CSS variable `--radius`                                                                           |
| Spacing        | Tailwind v4 defaults (4px base grid)                                                              |
| Typography     | Tailwind v4 defaults                                                                              |

---

## Gap Analysis: What's Missing

Cross-referenced against wireframes (Step 2), error states (Step 4), and component inventory.

### Priority 1 — Needed for Core Audit Flow

| Component       | Purpose                                             | Used In                                     | Build Method                                       |
| --------------- | --------------------------------------------------- | ------------------------------------------- | -------------------------------------------------- |
| `ScoreCircle`   | Animated circular score display with grade letter   | Dashboard, Report hero, Progress completion | Custom (SVG circle + animated counter)             |
| `GradeBadge`    | Letter grade (A-F) with semantic color              | Report, Dashboard, Audits list              | Extend `Badge` with grade-to-color mapping         |
| `SeverityBadge` | Critical/High/Medium/Low/Info with color + icon     | Report findings, Top findings               | Extend `Badge` with severity-to-color mapping      |
| `DimensionIcon` | Icon per dimension (11 icons)                       | Progress grid, Report tabs, Audit form      | Wrapper around Lucide icons, mapped by DimensionId |
| `EngineGrid`    | 11-tile grid showing live engine status             | Audit progress page                         | Custom (grid of `EngineTile` components)           |
| `EngineTile`    | Single engine: icon, name, status, progress, score  | Inside EngineGrid                           | Custom (Card variant with status states)           |
| `QuickAuditBar` | URL input + Analyze button (inline)                 | Dashboard top                               | Custom (Input + Button composition)                |
| `FindingCard`   | Expandable finding with severity, description, code | Report dimension detail                     | Custom (Card + collapsible sections)               |

### Priority 2 — Needed for Dashboard & Lists

| Component        | Purpose                                         | Used In                      | Build Method                       |
| ---------------- | ----------------------------------------------- | ---------------------------- | ---------------------------------- |
| `StatsCard`      | Number + label + trend arrow + optional spark   | Dashboard stats row          | Custom (Card variant)              |
| `ScoreDelta`     | +5 (green) or -3 (red) trend indicator          | Dashboard, Report comparison | Custom (span with color logic)     |
| `ProjectCard`    | Project summary: name, URL, score, trend, count | Projects list                | Custom (Card variant)              |
| `EmptyState`     | Illustration + title + description + CTA        | All list pages               | Custom (centered layout component) |
| `DataTable`      | Sortable, paginated table with mobile card view | Audits list, Admin users     | @tanstack/react-table wrapper      |
| `OnboardingCard` | 3-step checklist with progress                  | Dashboard (first visit)      | Custom (Card with checkbox steps)  |

### Priority 3 — Needed for Report UI

| Component         | Purpose                                             | Used In                   | Build Method                    |
| ----------------- | --------------------------------------------------- | ------------------------- | ------------------------------- |
| `DimensionTabs`   | Horizontal scrollable tab bar with scores           | Report page               | Extend `Tabs` with score badges |
| `ScoreBreakdown`  | Collapsible deduction list (rule, severity, points) | Report dimension panel    | Custom (collapsible list)       |
| `CodeSnippet`     | Syntax-highlighted code block with copy             | Report findings           | Shiki/Prism wrapper             |
| `PassedChecks`    | Collapsible list of green checkmarks                | Report dimension panel    | Custom (collapsible list)       |
| `RadarChart`      | 11-axis radar chart                                 | Report overview           | Recharts wrapper                |
| `SeverityBar`     | Horizontal stacked bar by severity                  | Report overview           | Recharts/custom SVG             |
| `ScoreTrendChart` | Line chart with date range selector                 | Dashboard, Project detail | Recharts wrapper                |

### Priority 4 — Needed for Settings & Admin

| Component           | Purpose                                      | Used In                   | Build Method                    |
| ------------------- | -------------------------------------------- | ------------------------- | ------------------------------- |
| `FeatureGate`       | Wraps gated features with upgrade prompt     | Export, API, Webhooks     | Custom (render prop / HOC)      |
| `PlanLimitModal`    | Usage bar + upgrade CTA                      | Audit limit reached       | Custom (Dialog variant)         |
| `ConnectionBanner`  | SSE/network status banner                    | Progress page             | Custom (Alert variant)          |
| `RateLimitToast`    | Countdown timer in toast                     | Rate limited actions      | Custom (Sonner extension)       |
| `PasswordInput`     | Input with show/hide toggle + strength meter | Sign up, Settings         | Custom (Input + Button + meter) |
| `URLInput`          | URL input with validation + favicon preview  | Audit form, QuickAuditBar | Custom (Input + validation)     |
| `DeviceToggle`      | Desktop/Mobile toggle switch                 | Audit form                | Custom (toggle group)           |
| `DimensionSelector` | 11 checkboxes with icons, "Select all"       | Audit form                | Custom (checkbox group)         |

### Priority 5 — Needed for Marketing & Polish

| Component        | Purpose                         | Used In                 | Build Method                 |
| ---------------- | ------------------------------- | ----------------------- | ---------------------------- |
| `PricingCard`    | Plan card with features and CTA | Pricing page            | Custom (Card variant)        |
| `FeatureTable`   | Plan comparison matrix          | Pricing page            | Custom (table)               |
| `CommandPalette` | Cmd+K search overlay            | Global                  | cmdk library wrapper         |
| `Breadcrumb`     | Location indicator trail        | All authenticated pages | Custom (nav with separators) |
| `ErrorPage`      | Full-page error (404, 403, 500) | Error routes            | Custom (centered layout)     |

---

## Missing shadcn/ui Components to Install

These are standard shadcn/ui components not yet installed that we'll need:

| Component        | Why Needed                                                  |
| ---------------- | ----------------------------------------------------------- |
| `Checkbox`       | Dimension selector, terms acceptance, notification settings |
| `Switch`         | Settings toggles (notifications, dark mode, sharing)        |
| `RadioGroup`     | Device selector, plan selection                             |
| `Accordion`      | FAQ section (pricing), collapsible finding sections         |
| `Collapsible`    | Score breakdown, passed checks, recommendation panels       |
| `Toggle`         | Desktop/mobile device toggle                                |
| `ToggleGroup`    | Annual/monthly pricing toggle                               |
| `Command`        | Command palette (cmdk)                                      |
| `Popover`        | Notification dropdown, user menu extras                     |
| `NavigationMenu` | Landing page top nav                                        |
| `Breadcrumb`     | Authenticated page breadcrumbs (AAA requirement)            |
| `Sidebar`        | Dashboard sidebar navigation                                |
| `Chart`          | Recharts integration (shadcn chart wrapper)                 |

**Install command:**

```bash
pnpm dlx shadcn@latest add checkbox switch radio-group accordion collapsible toggle toggle-group command popover navigation-menu breadcrumb sidebar chart
```

---

## Theme Verification

### Colors — AAA Contrast Audit Needed

Current theme defines colors via CSS variables. Need to verify 7:1 contrast (AAA) for:

| Token                                         | Light Mode | Dark Mode | Check                                |
| --------------------------------------------- | ---------- | --------- | ------------------------------------ |
| `--foreground` on `--background`              | ?          | ?         | Body text — must be 7:1              |
| `--muted-foreground` on `--background`        | ?          | ?         | Secondary text — must be 7:1         |
| `--muted-foreground` on `--muted`             | ?          | ?         | Muted text on muted bg — must be 7:1 |
| `--primary-foreground` on `--primary`         | ?          | ?         | Button text — must be 4.5:1 (large)  |
| `--destructive-foreground` on `--destructive` | ?          | ?         | Error button — must be 4.5:1         |
| `--accent-foreground` on `--accent`           | ?          | ?         | Hover states — must be 7:1           |

**Action:** After installing components, run every combo through WebAIM Contrast Checker. Adjust muted colors if needed (common AAA failure point — muted grays often only pass AA).

### Spacing — Verify 4px Grid

- All margins, padding, gaps should be multiples of 4px
- Tailwind v4 defaults: 1=4px, 2=8px, 3=12px, 4=16px, 6=24px, 8=32px, 12=48px, 16=64px
- Verify no custom spacing breaks the grid

### Typography — Verify Scale

- Body text: 16px minimum (a11y requirement)
- Heading scale: verify h1-h6 sizes are distinct and follow modular scale
- Line height: 1.5 for body text minimum (WCAG AAA for readability)
- Font: verify `next/font` is configured with `display: swap`

### Target Sizes — Verify 44px Minimum

- Button default height: check >= 44px
- Button `xs` and `sm` sizes: may need adjustment for AAA (44px minimum)
- Input height: check >= 44px
- Tab trigger height: check >= 44px
- Checkbox/radio: check >= 44px (including hit area)

**Action:** Audit all interactive component heights. Adjust `xs`/`sm` button sizes if they fall below 44px — either increase minimum or restrict usage to non-standalone contexts (inside larger click targets).

---

## Dark Mode Verification

| Check                          | Status                             |
| ------------------------------ | ---------------------------------- |
| ThemeProvider configured       | ✅ (next-themes)                   |
| CSS variables for light/dark   | ✅ (globals.css :root + .dark)     |
| All 19 components theme-aware  | ✅ (use CSS variable tokens)       |
| Focus rings visible on dark bg | Needs verification                 |
| Chart colors work on dark bg   | Needs verification (no charts yet) |
| OG images work for dark users  | N/A (OG images have own bg)        |

---

## Implementation Plan

### When to Build Each Component

| Stage                   | Components to Build                                                                                                                                                                                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stage 2 (Steps 52-63)   | `EmptyState`, `ErrorPage`, `PasswordInput`, `URLInput`, `DeviceToggle`, `DimensionSelector`, `StatsCard`, `ScoreDelta`, `ScoreCircle`, `GradeBadge`, `SeverityBadge`, `DimensionIcon`, `QuickAuditBar`, `DataTable`, `OnboardingCard`, `ProjectCard`, `Breadcrumb`                  |
| Stage 2 (Steps 52-63)   | Install: Checkbox, Switch, RadioGroup, Accordion, Collapsible, Toggle, ToggleGroup, Command, Popover, NavigationMenu, Breadcrumb, Sidebar                                                                                                                                           |
| Stage 5 (Steps 166-191) | `EngineGrid`, `EngineTile`, `FindingCard`, `DimensionTabs`, `ScoreBreakdown`, `CodeSnippet`, `PassedChecks`, `RadarChart`, `SeverityBar`, `ScoreTrendChart`, `ConnectionBanner`, `FeatureGate`, `PlanLimitModal`, `RateLimitToast`, `PricingCard`, `FeatureTable`, `CommandPalette` |
| Stage 5 (Step 192-193)  | Install: Chart (Recharts shadcn wrapper)                                                                                                                                                                                                                                            |

### Component Naming Convention

- All custom components in `packages/ui/src/components/`
- Prefix Audex-specific components: no prefix needed, just descriptive names
- Chart wrappers in `packages/ui/src/components/charts/`
- Export all from `packages/ui/src/index.ts` (currently empty — needs barrel file)

### Barrel File Fix

`packages/ui/src/index.ts` currently exports nothing (`export {}`). Must be updated to re-export all components:

```typescript
// Components
export * from "./components/alert";
export * from "./components/avatar";
export * from "./components/badge";
// ... all components

// Utilities
export * from "./lib/utils";
```

**Action:** Fix barrel file when building Stage 2 frontend (Step 52).

---

## Summary

| Category                | Have    | Need            | Gap                       |
| ----------------------- | ------- | --------------- | ------------------------- |
| shadcn/ui primitives    | 19      | 32              | 13 to install             |
| Custom Audex components | 0       | 33              | 33 to build               |
| Theme tokens            | Full    | Full            | AAA contrast audit needed |
| Dark mode               | Working | Working         | Chart colors TBD          |
| Barrel file exports     | Empty   | All components  | Fix needed                |
| Target size (44px AAA)  | Unknown | All interactive | Audit needed              |
