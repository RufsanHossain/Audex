# Audex — Accessibility Plan

**Step 5 [P2][T1] | Version 1.0 | April 4, 2026**
**Target:** WCAG 2.2 Level AA compliance

---

## Compliance Standard

WCAG 2.2 AA across all pages. This covers 4 principles:

1. **Perceivable** — content available to all senses
2. **Operable** — all functionality via keyboard + assistive tech
3. **Understandable** — content and UI are predictable
4. **Robust** — works across browsers and assistive technologies

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

### Minimum Contrast Ratios (WCAG AA)

| Content                              | Ratio | Test                                     |
| ------------------------------------ | ----- | ---------------------------------------- |
| Normal text (< 18px)                 | 4.5:1 | All body text, labels, descriptions      |
| Large text (>= 18px bold or >= 24px) | 3:1   | Headings, large buttons                  |
| UI components (borders, icons)       | 3:1   | Input borders, icon buttons, focus rings |
| Non-text contrast                    | 3:1   | Charts, graphs, data visualization       |

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

| Test                     | Tool                     | Frequency              |
| ------------------------ | ------------------------ | ---------------------- |
| Keyboard-only navigation | Browser (no mouse)       | Every stage gate       |
| Screen reader            | VoiceOver (macOS)        | Every stage gate       |
| Color contrast           | WebAIM Contrast Checker  | When adding new colors |
| Zoom (200%)              | Browser zoom             | Every stage gate       |
| Reduced motion           | System preference toggle | When adding animations |
| High contrast mode       | OS setting               | Once before launch     |

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

1. **Use shadcn/ui components** — they're built on Radix which handles ARIA patterns correctly
2. **Never suppress focus outlines** — use `focus-visible:ring` from Tailwind
3. **Every `<img>` gets `alt`** — no exceptions, even decorative (`alt=""`)
4. **Every icon button gets `aria-label`** — icons are invisible to screen readers
5. **Every form field gets `<label>`** — linked by `htmlFor`/`id`, not just visual proximity
6. **Use `aria-live` sparingly** — only for dynamic content users need to know about immediately
7. **Test with keyboard** before submitting PR — Tab through your new component
8. **One `<h1>` per page** — heading levels never skip (h1 → h2 → h3, never h1 → h3)
9. **Color is never the only signal** — always pair with text, icon, or pattern
10. **Respect `prefers-reduced-motion`** — wrap all animations
