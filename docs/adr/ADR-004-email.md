# ADR-004: Email — Resend (Free Tier) + React Email

**Status:** Accepted
**Date:** 2026-04-04
**Category:** Build vs Buy

## Context

Audex needs transactional emails: verification, password reset, welcome, audit complete, billing alerts, weekly digest. Need reliable delivery, branded templates, and unsubscribe handling.

## Decision

Use **Resend free tier** (100 emails/day) with **React Email** for templates.

## Rationale

- $0/month — 100 emails/day covers early users easily
- React Email: build templates with React components + TypeScript — same tooling as the rest of the stack
- Resend has excellent deliverability (built by ex-SendGrid team)
- Simple API — single `resend.emails.send()` call
- Supports custom domains (SPF/DKIM/DMARC)
- Webhook for delivery status tracking

## Alternatives Considered

| Option                  | Cost                | Why Not                                                                                 |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| Nodemailer + Gmail SMTP | $0 (500/day)        | No delivery tracking. Gmail may flag as spam. Unprofessional from-address.              |
| Postmark                | $15/mo (10K emails) | Overkill at our scale. Better deliverability but costs money before we need it.         |
| SendGrid                | Free 100/day        | Complex setup. Acquired by Twilio — product direction uncertain.                        |
| AWS SES                 | ~$0.10/1K emails    | Requires AWS account setup. More complex. Cheaper at scale but over-engineered for now. |

## Free Tier Limits

- 100 emails/day
- 1 custom domain
- 7-day log retention
- No dedicated IP

## Upgrade Trigger

Upgrade to Resend paid ($20/mo for 50K emails) when daily volume consistently exceeds 80 emails. At 100 users sending ~1 email/day average, free tier covers us until ~80 DAU.

## Consequences

- 100/day limit means batch emails (weekly digest) must be staggered or deferred
- Queue-based sending via BullMQ (never synchronous in request handlers)
- Must implement unsubscribe handling ourselves (Resend doesn't manage preferences)
- React Email templates are code — versioned in git, no external CMS needed
