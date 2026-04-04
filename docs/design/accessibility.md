# Audex — Accessibility Plan

**Step 5 [P2][T1] | Version 1.1 | April 4, 2026**
**Target:** WCAG 2.2 Level AAA compliance

---

## Compliance Standard

WCAG 2.2 AAA across all pages. AAA is the highest level of conformance, exceeding the industry-standard AA. This covers 4 principles:

1. **Perceivable** — content available to all senses
2. **Operable** — all functionality via keyboard + assistive tech
3. **Understandable** — content and UI are predictable
4. **Robust** — works across browsers and assistive technologies

### Why AAA?

Audex is a code quality platform that literally scores websites on accessibility. We should lead by example. AAA conformance also:

- Opens the product to government and education customers (strict procurement requirements)
- Differentiates from competitors (most stop at AA)
- Forces better design decisions that benefit all users

### AAA vs AA — Key Differences

| Criterion                 | AA Requirement              | AAA Requirement (what we do)                                        |
| ------------------------- | --------------------------- | ------------------------------------------------------------------- |
| Text contrast             | 4.5:1 normal, 3:1 large     | **7:1 normal, 4.5:1 large**                                         |
| Non-text contrast         | 3:1                         | 3:1 (same)                                                          |
| Timing                    | Can extend time limits      | **No time limits** (or user controls all timing)                    |
| Audio/visual distractions | Can pause/stop              | **No auto-playing content** of any kind                             |
| Navigation                | Multiple ways to find pages | **Multiple ways + location indicator** (breadcrumbs required)       |
| Reading level             | No requirement              | **Lower secondary education level** (grade 7-9 reading level)       |
| Unusual words             | No requirement              | **Glossary or definitions** for technical terms                     |
| Error prevention          | For legal/financial         | **For all user input** (confirm, undo, or review all submissions)   |
| Context changes           | On request only             | **No context changes** unless user-initiated or warned              |
| Keyboard                  | All functionality           | **No keyboard shortcuts conflict** with browser/AT shortcuts        |
| Target size               | 24x24px minimum             | **44x44px minimum** for all interactive targets                     |
| Focus appearance          | Visible focus               | **Enhanced focus** (min 2px outline, 3:1 contrast against adjacent) |

---

## Semantic HTML Requirements

Use the correct element for every purpose. Never use `<div>` or `<span>` when a semantic element exists.

| Purpose           | Use                                                            | Never                                |
| ----------------- | -------------------------------------------------------------- | ------------------------------------ |
| Clickable action  | `<button>`                                                     | `<div onClick>`                      |
| Navigation link   | `<a href>`                                                     | `<span onClick>`                     |
| Page region       | `<main>`, `<nav>`, `<aside>`, `<footer>`, `<header>`           | `<div class="nav">`                  |
| Article/section   | `<article>`, `<section>` with heading                          | `<div class="card">` without heading |
| List of items     | `<ul>`, `<ol>`, `<li>`                                         | `<div>` for each item                |
| Form group        | `<fieldset>` + `<legend>`                                      | Ungrouped checkboxes                 |
| Table data        | `<table>`, `<thead>`, `<th scope>`, `<tbody>`                  | `<div>` grid for tabular data        |
| Heading hierarchy | `<h1>` through `<h6>` (one `<h1>` per page, no skipped levels) | `<div class="heading">`              |

### Page Landmarks

Every page must have:

```html
<header>
  <!-- top bar with user menu -->
  <nav>
    <!-- sidebar or bottom tabs -->
    <main>
      <!-- primary content area -->
      <footer><!-- optional, for marketing pages --></footer>
    </main>
  </nav>
</header>
```

Screen readers use landmarks to navigate quickly. Missing landmarks = lost users.

---

## Keyboard Navigation

### Requirements

- Every interactive element reachable via `Tab` key
- Logical tab order matching visual layout (no tabindex > 0)
- `Enter` or `Space` activates buttons
- `Enter` activates links
- `Escape` closes modals, dropdowns, popovers
- Arrow keys navigate within composite widgets (tabs, menus, radio groups)
- No keyboard traps (user can always Tab out)

### Skip Navigation

First focusable element on every page:

```html
<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute ...">
  Skip to main content
</a>
```

Visible only on focus. Lets keyboard users bypass sidebar/header.

### Focus Management

| Scenario                    | Focus Behavior                                      |
| --------------------------- | --------------------------------------------------- |
| Modal opens                 | Focus moves to first focusable element inside modal |
| Modal closes                | Focus returns to element that triggered the modal   |
| Dropdown opens              | Focus moves to first item                           |
| Dropdown closes             | Focus returns to trigger button                     |
| Page navigation             | Focus moves to `<h1>` or `<main>`                   |
| Toast appears               | Announced via `aria-live`, focus stays              |
| Inline error on form submit | Focus moves to first error field                    |
| Audit progress → complete   | Focus moves to "View Report" button                 |
| Tab panel switch            | Focus moves to tab panel content                    |

### Focus Indicators

Never remove outlines without a visible replacement:

```css
/* Tailwind approach */
.focus-visible:ring-2
.focus-visible:ring-primary
.focus-visible:ring-offset-2
```

All interactive elements must show a visible focus ring on keyboard focus. Use `:focus-visible` (not `:focus`) to avoid showing rings on mouse click.

---

## ARIA Patterns

### Labels

| Element            | ARIA Pattern                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| Icon-only buttons  | `aria-label="Close dialog"`                                                                               |
| Search input       | `aria-label="Search audits"`                                                                              |
| Score circle       | `aria-label="Score: 87 out of 100, grade B plus"`                                                         |
| Progress bar       | `role="progressbar" aria-valuenow="64" aria-valuemin="0" aria-valuemax="100" aria-label="Audit progress"` |
| Badge (severity)   | `aria-label="Critical severity"` (not just color)                                                         |
| Trend arrow        | `aria-label="Score increased by 5 points"` (not just ▲)                                                   |
| Toggle (dark mode) | `aria-label="Switch to light mode"` / `aria-label="Switch to dark mode"`                                  |
| Notification bell  | `aria-label="Notifications, 2 unread"`                                                                    |

### Dynamic Content

| Scenario                | ARIA Pattern                                                                |
| ----------------------- | --------------------------------------------------------------------------- |
| Toast notification      | Container: `aria-live="polite" role="status"`                               |
| Error message on form   | `aria-live="assertive" role="alert"`                                        |
| SSE progress updates    | `aria-live="polite"` on progress percentage (throttle updates to every 10%) |
| Loading state           | `aria-busy="true"` on container, `aria-label="Loading audits"`              |
| Skeleton loading        | `aria-hidden="true"` on skeleton, screen reader gets `aria-busy` on parent  |
| Score counter animation | `aria-hidden="true"` on animated counter, final value in `aria-label`       |

### Form Errors

```html
<label for="email">Email</label>
<input id="email" aria-invalid="true" aria-describedby="email-error" />
<p id="email-error" role="alert">Please enter a valid email address</p>
```

- `aria-invalid="true"` on the field when invalid
- `aria-describedby` links field to error message
- `role="alert"` announces error immediately on appearance

### Composite Widgets

| Widget            | Pattern                                                                   | Keyboard                                          |
| ----------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Dimension tabs    | `role="tablist"`, `role="tab"`, `role="tabpanel"`                         | Arrow keys switch tabs, `Tab` exits tablist       |
| Sidebar nav       | `<nav aria-label="Main navigation">`                                      | `Tab` through links                               |
| Dropdown menu     | `role="menu"`, `role="menuitem"`                                          | Arrow keys, `Enter` selects, `Escape` closes      |
| Dialog/modal      | `role="dialog"`, `aria-modal="true"`, `aria-labelledby`                   | Focus trap inside, `Escape` closes                |
| Score radar chart | `role="img"`, `aria-label="Score breakdown by dimension: Security 92..."` | Not interactive — static image with text alt      |
| Data table        | `<table>` with `<th scope="col">`                                         | Standard table nav                                |
| Combobox (search) | `role="combobox"`, `aria-expanded`, `aria-controls`                       | Type to filter, Arrow to select, `Enter` confirms |

---

## Color & Contrast

### Minimum Contrast Ratios (WCAG AAA — Enhanced)

| Content                              | AA Ratio | AAA Ratio (our target) | Test                                     |
| ------------------------------------ | -------- | ---------------------- | ---------------------------------------- |
| Normal text (< 18px)                 | 4.5:1    | **7:1**                | All body text, labels, descriptions      |
| Large text (>= 18px bold or >= 24px) | 3:1      | **4.5:1**              | Headings, large buttons                  |
| UI components (borders, icons)       | 3:1      | 3:1 (same)             | Input borders, icon buttons, focus rings |
| Non-text contrast                    | 3:1      | 3:1 (same)             | Charts, graphs, data visualization       |
| Placeholder text                     | —        | **4.5:1**              | Input placeholders (often too faint)     |
| Disabled state text                  | —        | **3:1**                | Disabled buttons/inputs still readable   |

**Color palette implications:**

- Body text on white: minimum `#595959` (was `#737373` at AA)
- Body text on dark bg: minimum `#a3a3a3` (verify against theme)
- All shadcn/ui muted colors must be audited against both themes
- Use WebAIM Contrast Checker or Stark plugin to verify every text/bg combo

### Color Independence

Never convey information by color alone. Always pair with:

| Color Signal                     | Paired With                                    |
| -------------------------------- | ---------------------------------------------- |
| Red error field                  | Error icon + text message                      |
| Green passed check               | ✅ checkmark icon                              |
| Grade colors (A=green, F=red)    | Letter grade text (A, B, C, D, F)              |
| Severity colors                  | Text label (Critical, High, Medium, Low, Info) |
| Score trend (green up, red down) | Arrow icon ▲/▼ + numeric value (+5, -3)        |
| Chart segments                   | Pattern fills or labels, not just color        |

### Dark Mode Considerations

- Verify contrast in both light and dark themes
- Test with shadcn/ui theme tokens (not hardcoded colors)
- Ensure focus rings visible on both dark and light backgrounds
- Chart colors must work on both backgrounds

---

## AAA-Specific Requirements

### 1. Reading Level (WCAG 3.1.5 — AAA)

All user-facing text must be understandable at a **lower secondary education reading level** (grade 7-9). This means:

- Short sentences (< 25 words)
- Common words over jargon
- Active voice over passive
- One idea per paragraph

| Instead of                                                | Write                                                           |
| --------------------------------------------------------- | --------------------------------------------------------------- |
| "The audit has been enqueued for asynchronous processing" | "Your audit is in the queue. We'll start it shortly."           |
| "Insufficient permissions to access this resource"        | "You don't have access to this page."                           |
| "Rate limit threshold exceeded for current billing tier"  | "You've hit your plan's limit. Upgrade for more."               |
| "Dimension score derived via severity-weighted deduction" | "Score starts at 100. We subtract points for each issue found." |

**Exception:** Technical terms in the report findings (CSP, HSTS, LCP) are acceptable because the target audience is developers. Provide a glossary link for non-developer users.

### 2. Technical Glossary (WCAG 3.1.3, 3.1.4 — AAA)

Provide definitions for unusual words and abbreviations:

- Glossary page at `/docs/glossary` defining all dimension-specific terms
- Abbreviation `<abbr>` tags on first use: `<abbr title="Content Security Policy">CSP</abbr>`
- Tooltip on technical terms in report findings (hover/focus reveals definition)
- Finding descriptions always explain the "why" in plain language before the technical detail

### 3. No Timing Constraints (WCAG 2.2.3, 2.2.6 — AAA)

- No session timeout while user is active (Auth.js 30-day sessions handle this)
- SSE connections have no client-side timeout (server heartbeat keeps alive)
- No auto-advancing content (carousels, slideshows, auto-playing anything)
- No timed quizzes, countdowns, or expiring UI elements
- Rate limit "retry after" shows remaining time but never auto-dismisses the form
- The only countdown allowed: Stripe checkout session (Stripe-controlled, not ours)

### 4. Error Prevention for All Input (WCAG 3.3.6 — AAA)

At AA, error prevention is only required for legal/financial actions. At AAA, **all user submissions** must be confirmable, reversible, or reviewable:

| Action              | Error Prevention                                                             |
| ------------------- | ---------------------------------------------------------------------------- |
| Create audit        | Review URL + settings before submitting (form has "Analyze" not auto-submit) |
| Cancel audit        | Confirmation dialog: "Cancel this audit? Partial results will be lost."      |
| Delete project      | Confirmation: type project name to confirm                                   |
| Delete account      | Confirmation: type email + "delete my account"                               |
| Revoke API key      | Confirmation dialog with key name                                            |
| Change password     | Current password required + confirmation field                               |
| Change email        | Re-verification email sent, old email notified                               |
| Change role (admin) | Confirmation dialog with role name                                           |
| Export report       | Preview format before generating                                             |
| Share report        | Review access level before sharing                                           |

### 5. Enhanced Target Size (WCAG 2.5.5 — AAA)

All interactive targets must be **at least 44x44 CSS pixels** (AA only requires 24x24):

```css
/* Enforce minimum target size */
button,
a,
input[type="checkbox"],
input[type="radio"],
select,
[role="tab"],
[role="menuitem"] {
  min-height: 44px;
  min-width: 44px;
}
```

- Inline text links are exempt (surrounded by text)
- Apply to: buttons, links, checkboxes, radio buttons, select dropdowns, tab triggers, menu items, icon buttons
- Mobile: already targeting 44px (Step 2 wireframes), this makes it universal
- Spacing between targets: minimum 8px gap to prevent mis-taps

### 6. Enhanced Focus Appearance (WCAG 2.4.13 — AAA)

Focus indicators must be **highly visible**, not just present:

```css
/* AAA-compliant focus ring */
:focus-visible {
  outline: 3px solid var(--ring); /* min 2px, we use 3px */
  outline-offset: 2px;
  /* ring color must have 3:1 contrast against adjacent colors */
}
```

Requirements:

- Outline at least 2px thick (we use 3px)
- Outline color has 3:1 contrast against both the component and adjacent background
- Focus indicator encloses the entire component (not partial)
- Change of contrast area is at least as large as a 2px perimeter of the component

### 7. No Interruptions (WCAG 2.2.4 — AAA)

Interruptions (non-user-initiated alerts, updates) can be postponed or suppressed:

- Toast notifications: never steal focus, dismissible, configurable in settings
- SSE progress updates: `aria-live="polite"` (never `assertive` except errors)
- Notification bell: shows count badge but never interrupts
- Email notifications: all opt-in, granular controls in settings
- No auto-playing audio or video anywhere
- No pop-ups or modals that appear without user action

### 8. Multiple Navigation Mechanisms (WCAG 2.4.5 — AAA)

Users must have **more than one way** to find any page:

| Mechanism          | Implementation                                                 |
| ------------------ | -------------------------------------------------------------- |
| Primary navigation | Sidebar links (Dashboard, Projects, Audits, Settings)          |
| Search             | Command palette (Cmd+K) — searches audits, projects, pages     |
| Breadcrumbs        | Shown on all pages: Dashboard > Projects > project-name        |
| Direct URL         | Clean, bookmarkable URLs for all pages                         |
| Sitemap            | HTML sitemap at `/sitemap` (for humans, not just XML for bots) |
| Keyboard shortcuts | G+D (Dashboard), G+P (Projects), G+A (Audits)                  |

### 9. Section Headings (WCAG 2.4.10 — AAA)

All content must be organized with descriptive section headings:

- Every page section gets a heading (even if visually de-emphasized)
- Headings describe the content that follows
- Use headings to break up long report pages (one per dimension, one per finding group)
- Settings tabs each start with an `<h2>` for their section

### 10. Context Changes (WCAG 3.2.5 — AAA)

No context changes (page navigation, focus shift, form submission) without user initiation or explicit warning:

- Form submission only on explicit button click (never on input change)
- Dropdowns/selects: changing value doesn't navigate (use "Apply" button)
- Links open in same tab by default (external links get `aria-label` noting new tab)
- No auto-redirect after form submission — show success state, let user navigate

---

## Media & Content

### Images

- All `<img>` elements must have `alt` attribute
- Decorative images: `alt=""` + `aria-hidden="true"`
- Informational images: descriptive alt text
- Screenshots in reports: `alt="Screenshot of example.com above the fold"`
- Dimension icons: `alt=""` if paired with text label, otherwise `alt="Security"`

### Charts & Data Visualization

Charts are visual-only by default. Make accessible via:

1. Radar chart: `role="img"` + `aria-label` with all dimension scores as text
2. Score trend chart: accompanying data table (visually hidden, screen reader accessible)
3. Severity bar: text summary "3 critical, 8 high, 15 medium, 4 low, 2 info findings"

### Motion & Animation

- Respect `prefers-reduced-motion`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
    }
  }
  ```
- Score counter animation: skip to final value if reduced motion
- Engine tile transitions: instant state change if reduced motion
- Page transitions: instant navigation if reduced motion

---

## Testing Plan

### Automated (CI — Every PR)

- **axe-core** via `@axe-core/playwright` in E2E tests
- Catches: missing labels, contrast issues, invalid ARIA, missing landmarks
- Coverage: ~30-40% of a11y issues
- Fail PR on any critical/serious violation

### Manual (Per Stage Gate)

| Test                     | Tool                        | Frequency              | AAA-Specific                     |
| ------------------------ | --------------------------- | ---------------------- | -------------------------------- |
| Keyboard-only navigation | Browser (no mouse)          | Every stage gate       | Verify no shortcut conflicts     |
| Screen reader            | VoiceOver (macOS)           | Every stage gate       | Verify glossary terms read       |
| Color contrast           | WebAIM Contrast Checker     | When adding new colors | **7:1 for body text**            |
| Zoom (400%)              | Browser zoom                | Every stage gate       | **400% zoom (AAA), not 200%**    |
| Reduced motion           | System preference toggle    | When adding animations | Verify zero animation            |
| High contrast mode       | OS setting                  | Once before launch     |                                  |
| Reading level            | Hemingway App / readability | When writing copy      | **Grade 7-9 reading level**      |
| Target size              | DevTools element inspector  | Every stage gate       | **All targets >= 44x44px**       |
| Focus appearance         | Manual inspection           | Every stage gate       | **3px ring, 3:1 contrast**       |
| No timing                | Manual walkthrough          | Every stage gate       | **No time-limited interactions** |

### Screen Reader Testing Checklist

Walk through with VoiceOver (macOS):

- [ ] Landing page: hero, CTA, pricing read correctly
- [ ] Sign in form: labels, errors announced
- [ ] Dashboard: stats read with context ("Total audits: 47")
- [ ] Audit creation: form fields labeled, dimensions checkboxes grouped
- [ ] Progress page: updates announced (throttled to every 10%)
- [ ] Report: score read ("Score 87 out of 100, grade B plus"), dimension tabs navigable, findings read with severity
- [ ] Settings: form sections labeled, tab navigation works
- [ ] Modals: focus trapped, escape closes, focus returns
- [ ] Toasts: announced without stealing focus
- [ ] Data tables: headers and rows read correctly
- [ ] Empty states: CTA announced

---

## Implementation Rules for Developers

### Core Rules (AA baseline)

1. **Use shadcn/ui components** — built on Radix which handles ARIA correctly
2. **Never suppress focus outlines** — use `focus-visible:ring` with 3px width
3. **Every `<img>` gets `alt`** — no exceptions, even decorative (`alt=""`)
4. **Every icon button gets `aria-label`** — icons are invisible to screen readers
5. **Every form field gets `<label>`** — linked by `htmlFor`/`id`, not visual proximity
6. **Use `aria-live="polite"`** — never `assertive` except for errors
7. **Test with keyboard** before submitting PR — Tab through your new component
8. **One `<h1>` per page** — heading levels never skip (h1 → h2 → h3)
9. **Color is never the only signal** — always pair with text, icon, or pattern
10. **Respect `prefers-reduced-motion`** — wrap all animations

### AAA-Specific Rules (additional)

11. **7:1 contrast for body text** — verify every text/background combo, both themes
12. **44x44px minimum touch targets** — all buttons, links, checkboxes, tabs, menu items
13. **Confirm before destructive actions** — delete, revoke, cancel all need confirmation dialogs
14. **No auto-triggered context changes** — form submissions only on explicit button click
15. **Plain language** — grade 7-9 reading level for all UI copy, error messages, descriptions
16. **Use `<abbr>` for technical terms** — first occurrence gets `title` attribute with definition
17. **Breadcrumbs on every page** — shows user location in site hierarchy
18. **No timing-dependent UI** — no auto-dismiss, no countdown-required actions
19. **400% zoom support** — test all layouts at 400% browser zoom, no content loss
20. **8px minimum gap** between interactive targets — prevent mis-clicks
