# ADR-009: Browser Automation — Playwright

**Status:** Accepted
**Date:** 2026-04-04
**Category:** Build vs Buy

## Context

Audex needs to load web pages in a real browser for analysis: capture screenshots, run Lighthouse, execute axe-core, measure performance timings, inspect DOM, capture network traffic (HAR), and profile memory via CDP. Must run headless in Docker on Railway workers.

## Decision

Use **Playwright** (open source, Microsoft-maintained) with Chromium.

## Rationale

- $0 — fully open source
- First-class Chromium support (Chrome DevTools Protocol access)
- Headless mode with full page rendering
- Built-in: network interception (SSRF guard), cookie capture, console capture
- Device emulation (viewport, user agent, touch)
- `page.pdf()` for PDF export generation
- Stable API, active development, excellent TypeScript types
- Docker images available (`mcr.microsoft.com/playwright`)

## Alternatives Considered

| Option         | Why Not                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------- |
| Puppeteer      | Playwright is the spiritual successor with better API. Same team originally built both.   |
| Selenium       | Slower, heavier, more complex. Designed for testing, not automation.                      |
| CDP direct     | Too low-level. Playwright abstracts CDP complexity while still exposing it when needed.   |
| Browserless.io | Managed browser service. $0 for 6h/mo — not enough. $50+/mo for production. Adds latency. |

## Consequences

- Workers need Chromium installed (large Docker images, ~1.5GB)
- Memory-intensive: each browser instance uses 200-400MB RAM
- Browser pool management needed (acquire/release, crash recovery, recycling)
- SSRF protection must be implemented at Playwright request interception level
- Lighthouse runs inside the same Chromium instance (shared process)
