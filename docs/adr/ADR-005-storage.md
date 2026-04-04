# ADR-005: Object Storage — Cloudflare R2 (Free Tier)

**Status:** Accepted
**Date:** 2026-04-04
**Category:** Build vs Buy

## Context

Audex stores screenshots (full page, above-fold, thumbnails, element crops) and generated PDF exports. Need object storage with CDN delivery and reasonable free tier.

## Decision

Use **Cloudflare R2** (10GB free storage, zero egress fees).

## Rationale

- 10GB free storage — holds thousands of screenshots
- $0 egress — unlike S3 which charges per GB downloaded
- S3-compatible API — easy migration path if needed
- Cloudflare CDN integration for fast delivery
- Lifecycle rules for automatic cleanup of old objects

## Alternatives Considered

| Option           | Cost                                        | Why Not                                                       |
| ---------------- | ------------------------------------------- | ------------------------------------------------------------- |
| AWS S3           | Free tier 5GB/12mo, then $0.023/GB + egress | Egress fees unpredictable. Free tier expires after 12 months. |
| Supabase Storage | Free 1GB                                    | Limited storage. Ties us to Supabase ecosystem.               |
| Vercel Blob      | Free 256MB                                  | Too small. Per-read pricing at scale.                         |
| Local filesystem | $0                                          | Not scalable. Lost on container restart. No CDN.              |

## Free Tier Limits

- 10GB storage
- 10 million Class A operations/month (PUT, POST)
- 1 million Class B operations/month (GET)
- Zero egress bandwidth cost

## Upgrade Trigger

Upgrade to paid ($0.015/GB/mo) when storage exceeds 8GB. At ~500KB per audit (3 screenshots + thumbnail), 10GB holds ~20,000 audits.

## Consequences

- Must implement presigned URLs for upload from workers
- Cleanup cron job needed for orphaned objects (audit deleted but screenshots remain)
- PDF exports stored temporarily (24h expiry via lifecycle rule, re-generate on demand)
- Images served via R2 public bucket or Cloudflare CDN custom domain
