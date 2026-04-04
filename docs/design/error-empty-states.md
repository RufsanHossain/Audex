# Audex — Error & Empty State Design

**Step 4 [P2][T1] | Version 1.0 | April 4, 2026**

---

## Design Rule

Every error tells the user **what happened** AND **what to do next**. Never show generic "Something went wrong." Every empty state shows a **CTA that moves the user forward**. Never show a blank page.

---

## Empty States

### Dashboard (First Visit — No Audits)

```
┌───────────────────────────────────────────────┐
│                                               │
│         ┌─────────────────────┐               │
│         │   📊               │               │
│         │  (illustration)     │               │
│         └─────────────────────┘               │
│                                               │
│         No audits yet                         │
│                                               │
│   Paste a URL above to run your first         │
│   quality analysis. It takes about            │
│   60 seconds.                                 │
│                                               │
│         [ Run Your First Audit ]              │
│                                               │
└───────────────────────────────────────────────┘
```

- **Tone:** Encouraging, action-oriented
- **CTA:** Scrolls to / focuses the quick audit bar
- **When:** `user.auditCount === 0`

### Dashboard (Has Audits, None Recent)

```
│   No recent activity                          │
│   Your last audit was 30 days ago.            │
│   [ Run a New Audit ]                         │
```

### Projects List (No Projects)

```
┌───────────────────────────────────────────────┐
│                                               │
│         ┌─────────────────────┐               │
│         │   📁               │               │
│         │  (illustration)     │               │
│         └─────────────────────┘               │
│                                               │
│         Organize your audits                  │
│                                               │
│   Projects group audits for the same site     │
│   so you can track quality over time.         │
│                                               │
│         [ Create Your First Project ]         │
│                                               │
└───────────────────────────────────────────────┘
```

- **Tone:** Explains the value of projects
- **CTA:** Opens create project dialog

### Audits List (No Audits)

```
│         No audits yet                         │
│   Run an audit to analyze any website         │
│   across 11 quality dimensions.               │
│         [ Analyze a URL ]                     │
```

### Audits List (Filter Returns Nothing)

```
│         No matching audits                    │
│   Try adjusting your filters or search.       │
│         [ Clear Filters ]                     │
```

### Project Detail (No Audits for Project)

```
│         No audits for this project            │
│   Run an audit to start tracking quality.     │
│         [ Run Audit for project-name ]        │
```

### Notifications (All Read / None)

```
│         All caught up                         │
│   We'll notify you when audits complete       │
│   or when something needs attention.          │
```

- **No CTA needed** — informational only

### API Keys (None Created)

```
│         No API keys                           │
│   Generate a key to access the Audex API      │
│   programmatically.                           │
│         [ Generate Your First Key ]           │
```

### Webhooks (None Configured)

```
│         No webhooks configured                │
│   Receive real-time notifications when        │
│   audits complete or scores change.           │
│         [ Add a Webhook ]                     │
```

### Team Members (Solo — Team Plan)

```
│         Just you for now                      │
│   Invite team members to share projects       │
│   and collaborate on quality improvements.    │
│         [ Invite a Team Member ]              │
```

### Report: No Findings for a Dimension

```
│         No issues found                       │
│   This dimension passed all checks.           │
│   ✅ 12 of 12 rules passed                   │
```

- **Tone:** Celebratory (green check, positive framing)

### Search Results (No Matches)

```
│         No results for "xyz"                  │
│   Try a different search term.                │
```

---

## Error States

### HTTP Errors

#### 404 — Page Not Found

```
┌───────────────────────────────────────────────┐
│                                               │
│              404                              │
│                                               │
│         Page not found                        │
│                                               │
│   The page you're looking for doesn't exist   │
│   or has been moved.                          │
│                                               │
│   [ Go to Dashboard ]   [ Go Back ]          │
│                                               │
└───────────────────────────────────────────────┘
```

- **Route:** `apps/web/src/app/not-found.tsx`
- **Design:** Branded, minimal, two navigation options

#### 403 — Forbidden

```
┌───────────────────────────────────────────────┐
│                                               │
│              403                              │
│                                               │
│         Access denied                         │
│                                               │
│   You don't have permission to view this      │
│   page. This might be an admin-only area      │
│   or someone else's resource.                 │
│                                               │
│   [ Go to Dashboard ]                         │
│                                               │
└───────────────────────────────────────────────┘
```

- **When:** Non-admin accessing `/admin/*`, viewing another user's audit

#### 500 — Server Error

```
┌───────────────────────────────────────────────┐
│                                               │
│              Something went wrong             │
│                                               │
│   We encountered an unexpected error.         │
│   Our team has been notified.                 │
│                                               │
│   Error ID: abc-123-def                       │
│                                               │
│   [ Try Again ]   [ Go to Dashboard ]         │
│                                               │
└───────────────────────────────────────────────┘
```

- **Route:** `apps/web/src/app/error.tsx` (Error Boundary)
- **Error ID:** Sentry event ID for support reference
- **"Try Again":** Calls `reset()` on the error boundary

### Auth Errors

#### Session Expired

```
Toast: "Your session has expired. Please sign in again."
→ Redirect to /auth/signin?callbackUrl=/previous-page
```

- **Behavior:** Automatic redirect, preserve intended destination
- **Never lose work:** If user was mid-form, warn before redirect

#### Wrong Credentials

```
┌──────────────────────────────────────┐
│  ⚠ Invalid email or password.       │
│  Forgot your password?               │
└──────────────────────────────────────┘
```

- **Never reveal** whether email exists (security)
- **After 5 failures:** Show CAPTCHA or rate limit message

#### Account Locked

```
┌──────────────────────────────────────┐
│  ⚠ Account temporarily locked.      │
│  Too many failed attempts.           │
│  Try again in 15 minutes or          │
│  reset your password.                │
└──────────────────────────────────────┘
```

#### OAuth Error

```
┌──────────────────────────────────────┐
│  ⚠ Could not sign in with Google.   │
│  The request was denied or timed     │
│  out. Try again or use email.        │
│                                      │
│  [ Try Google Again ]  [ Use Email ] │
└──────────────────────────────────────┘
```

### Audit Errors

#### Audit Failed — URL Unreachable

```
┌───────────────────────────────────────────────┐
│  ❌ Audit Failed                              │
│                                               │
│  We couldn't reach https://example.com        │
│                                               │
│  Error: DNS_FAILURE                           │
│  The domain could not be resolved.            │
│                                               │
│  Things to check:                             │
│  • Is the URL spelled correctly?              │
│  • Is the site currently online?              │
│  • Does the site block automated access?      │
│                                               │
│  [ Edit URL and Retry ]   [ Back to Audits ]  │
│                                               │
└───────────────────────────────────────────────┘
```

#### Audit Failed — Timeout

```
│  Error: URL_TIMEOUT                           │
│  The page took too long to load (> 30s).      │
│                                               │
│  This often happens with very heavy pages     │
│  or sites behind strict firewalls.            │
│                                               │
│  [ Retry with Extended Timeout ]              │
```

#### Audit Failed — SSL Error

```
│  Error: SSL_ERROR                             │
│  We couldn't establish a secure connection.   │
│                                               │
│  The site's SSL certificate may be expired,   │
│  self-signed, or misconfigured.               │
│                                               │
│  [ Retry Anyway ]   [ Back to Audits ]        │
```

#### Audit Partial Failure

```
┌───────────────────────────────────────────────┐
│  ⚠ Partial Report Available                  │
│                                               │
│  8 of 11 engines completed successfully.      │
│  3 engines timed out: Performance, Speed,     │
│  Memory.                                      │
│                                               │
│  You can still view the partial report.       │
│                                               │
│  [ View Partial Report ]  [ Retry All ]       │
│                                               │
└───────────────────────────────────────────────┘
```

- **Show which engines failed** (transparency)
- **Partial report is still valuable** — encourage viewing

### Rate Limit & Plan Limit Errors

#### API Rate Limited (429)

```
Toast: "Slow down. Try again in 45 seconds."
  [progress bar counting down to retry]
```

- **Show countdown** to next allowed request
- **Auto-retry** when timer expires (for audit creation)

#### Monthly Audit Limit Reached

```
┌───────────────────────────────────────────────┐
│  You've used all 3 monthly audits             │
│                                               │
│  ████████████████████ 3/3                     │
│  Resets on May 1, 2026                        │
│                                               │
│  Upgrade to Pro for unlimited audits,         │
│  PDF exports, and AI summaries.               │
│                                               │
│  [ Upgrade to Pro — $29/mo ]                  │
│  [ Remind me when it resets ]                 │
│                                               │
└───────────────────────────────────────────────┘
```

- **Show usage bar** (visual feedback)
- **Show reset date** (sets expectation)
- **Upgrade CTA** is primary but not aggressive
- **"Remind me"** option respects users who won't upgrade

#### Concurrent Audit Limit

```
Toast: "You already have an audit running.
       Wait for it to complete or cancel it."
       [ View Running Audit ]
```

#### Feature Gated (Plan Required)

```
┌───────────────────────────────────────────────┐
│  🔒 PDF Export requires Pro                   │
│                                               │
│  Download detailed PDF reports with your      │
│  branding and full finding details.           │
│                                               │
│  [ Upgrade to Pro ]   [ Export as JSON Free ] │
│                                               │
└───────────────────────────────────────────────┘
```

- **Always offer an alternative** if one exists (JSON instead of PDF)
- **Explain the value** of the gated feature, don't just block

### Network & Connection Errors

#### SSE Connection Lost

```
┌─────────────────────────────────────┐
│  ⚠ Connection lost                 │
│  Reconnecting... (attempt 2 of 3)  │
│  [ Reconnect Now ]                 │
└─────────────────────────────────────┘
```

- **Banner at top** of progress page (not modal — don't block view)
- **Auto-reconnect** with 3 attempts (1s, 3s, 10s backoff)
- **After 3 failures:** show manual "Reconnect Now" button
- **Progress persists:** reloading page replays state from server

#### Offline

```
┌─────────────────────────────────────┐
│  📡 You're offline                  │
│  Check your internet connection.    │
│  We'll reconnect automatically.     │
└─────────────────────────────────────┘
```

- **Banner, not modal** — user can still read cached content
- **Auto-reconnect** when `navigator.onLine` fires

#### API Request Failed (Generic)

```
Toast (error): "Request failed. Please try again."
  [ Retry ]
```

- **Used for:** unexpected 500s on non-critical actions
- **Retry button** in toast for immediate retry
- **Log to Sentry** with context

### Form Validation Errors

#### Inline Field Errors

```
  Email
  ┌──────────────────────────────────┐
  │ not-an-email                     │
  └──────────────────────────────────┘
  ⚠ Please enter a valid email address

  Password
  ┌──────────────────────────────────┐
  │ ••••                             │
  └──────────────────────────────────┘
  ⚠ Password must be at least 8 characters
```

- **Show on blur** (not keystroke — too aggressive)
- **Red border** on invalid field
- **`aria-describedby`** linking error to field (a11y)
- **Clear error** when user starts fixing

#### Form Submission Error

```
┌────────────────────────────────────────────────┐
│  ⚠ Please fix the errors below                │
│  2 fields need attention                       │
└────────────────────────────────────────────────┘
```

- **Summary at top** of form on submit
- **Scroll to first error** automatically
- **Focus first error field** (a11y)

### Payment Errors

#### Payment Failed

```
Banner (persistent):
┌───────────────────────────────────────────────┐
│  ⚠ Your last payment failed.                 │
│  Update your payment method to keep your      │
│  Pro features active.                         │
│  [ Update Payment Method ]                    │
└───────────────────────────────────────────────┘
```

- **Persistent banner** on dashboard (not dismissible until resolved)
- **Also sent via email** with Stripe portal link
- **Grace period:** features remain active for 7 days

---

## Implementation Checklist

### Components to Build

| Component          | Props                                             | Notes                            |
| ------------------ | ------------------------------------------------- | -------------------------------- |
| `EmptyState`       | icon, title, description, ctaLabel, ctaAction     | Reusable across all pages        |
| `ErrorPage`        | code (404/403/500), title, description, actions[] | Full-page error                  |
| `ErrorBoundary`    | fallback, onReset                                 | React error boundary with Sentry |
| `InlineError`      | message, fieldId                                  | Form field error with aria       |
| `FormErrorSummary` | errors[]                                          | Top-of-form error list           |
| `ConnectionBanner` | status (reconnecting/offline/failed)              | SSE/network status               |
| `PlanLimitModal`   | usage, limit, resetDate, planName                 | Upgrade prompt                   |
| `FeatureGate`      | requiredPlan, currentPlan, featureName, children  | Wraps gated features             |
| `RateLimitToast`   | retryAfterSeconds                                 | Countdown timer                  |

### Error Response Contract (API)

All API errors follow `ApiError` format from `@audex/validators`:

```typescript
{
  success: false,
  error: {
    code: "AUDIT_LIMIT_EXCEEDED",  // machine-readable
    message: "Monthly audit limit reached",  // human-readable
    status: 429,
    details: {  // optional context
      used: 3,
      limit: 3,
      resetDate: "2026-05-01T00:00:00Z"
    }
  }
}
```

Frontend maps `error.code` to the appropriate UI pattern above.
