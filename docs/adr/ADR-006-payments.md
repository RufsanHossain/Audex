# ADR-006: Payments — Stripe

**Status:** Accepted
**Date:** 2026-04-04
**Category:** Build vs Buy

## Context

Audex has 4 pricing tiers: Free ($0), Pro ($29/mo), Team ($79/mo), Enterprise (custom). Need subscription management, checkout, invoicing, customer portal, and trial support.

## Decision

Use **Stripe** — no monthly cost, pay only on transactions (2.9% + $0.30 per charge).

## Rationale

- $0 until first paying customer — perfectly bootstrapped-friendly
- Industry standard for SaaS billing
- Stripe Checkout (hosted payment page — PCI compliant, we never touch card data)
- Stripe Customer Portal (self-service plan management — we don't build this UI)
- Stripe Billing (subscription lifecycle, trials, dunning, proration)
- Stripe Tax (automatic sales tax — free until processing payments)
- Stripe Webhooks (reliable event delivery for subscription state changes)
- Excellent developer experience and documentation

## Alternatives Considered

| Option         | Why Not                                                                        |
| -------------- | ------------------------------------------------------------------------------ |
| Paddle         | Higher fees (5% + $0.50). Merchant of Record model is good but not needed yet. |
| Lemon Squeezy  | Simpler but less flexible. Higher fees. Newer, less battle-tested.             |
| Custom billing | Never build your own payment system. Compliance nightmare.                     |

## Pricing Structure

| Plan       | Monthly | Annual          | Trial   |
| ---------- | ------- | --------------- | ------- |
| Free       | $0      | $0              | —       |
| Pro        | $29     | $290 (2mo free) | 14 days |
| Team       | $79     | $790 (2mo free) | 14 days |
| Enterprise | Custom  | Custom          | —       |

## Consequences

- Stripe webhook handler must be idempotent (events may be delivered multiple times)
- Plan state lives in both Stripe and our DB — daily reconciliation job needed
- We never store card numbers — Stripe handles all PCI compliance
- Stripe Customer Portal handles plan changes — we link to it, not rebuild it
- Must handle Stripe's async nature: payment confirmation is webhook-based, not instant
