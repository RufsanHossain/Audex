# Tech Debt Register

**Per Methodology:** 20% of every sprint allocated to debt repayment. Reviewed at every milestone gate.

**Risk classification:**

- 🔴 **Critical** — data loss, security breach, or production-blocking
- 🟠 **High** — bugs under specific conditions, scaling limits
- 🟡 **Medium** — slows development, awkward APIs
- ⚪ **Low** — cosmetic, minor inefficiency

---

## Open Items

### From Stage 1 (Steps 1-34)

| #      | Risk      | Item                                                                  | Location                                              | Estimated Cost   | Notes                                                                                                                                                                                                                  |
| ------ | --------- | --------------------------------------------------------------------- | ----------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TD-001 | 🟠 High   | Plan tier derived from role, not from `User.plan.tier`                | `apps/web/src/lib/api/plan.ts`                        | 4h               | Need to attach plan tier to JWT in auth callbacks. Until then, free users with admin role bypass plan limits. Tracked in `roleToPlanTier()` JSDoc.                                                                     |
| TD-002 | 🟡 Medium | Cancel endpoint scans BullMQ jobs by audit ID                         | `apps/web/src/app/api/v1/audits/[id]/cancel/route.ts` | 2h               | `getJobs(["waiting", "delayed", "active"], 0, 100)` — bounded scan. Should use a Redis index `audit:{id}:job` set by `enqueueUrlAudit`. Performance ok at < 100 active audits per worker.                              |
| TD-003 | 🟡 Medium | `audit-log.ts` requires runtime `registerAuditLogPersist()` injection | `packages/infra/src/audit-log.ts`                     | 1h               | Avoids circular dep between infra → db, but means audit log is silently disabled until app calls register at startup. Consumer must remember.                                                                          |
| TD-004 | 🟡 Medium | `Sentry integration` not yet wired (referenced in handler error path) | `apps/web/src/lib/api/handler.ts`                     | 3h               | Step 49 is the dedicated step. Until then, `// TODO: report to Sentry` placeholder exists. Errors only logged, not reported.                                                                                           |
| TD-005 | 🟡 Medium | Code audit endpoint returns 503                                       | `apps/web/src/app/api/v1/audits/route.ts:124`         | wired in Step 95 | Discriminated union accepts code input but throws `serviceUnavailable`. Frontend shouldn't expose code audit UI yet.                                                                                                   |
| TD-006 | ⚪ Low    | `withHandler` `body`/`query` are `unknown` to consumers               | `apps/web/src/lib/api/handler.ts`                     | 2h               | Generic inference works for the wrapper but consumers cast `body as InputType`. Could be improved with stricter overloads.                                                                                             |
| TD-007 | ⚪ Low    | `enqueueUrlAudit` `dimensions` typed as `never`                       | `apps/web/src/app/api/v1/audits/route.ts:114`         | 1h               | Cast required because `DimensionId` enum vs string-literal tuple from `as const`. Fix: pull constant from `@audex/types` enum values.                                                                                  |
| TD-008 | ⚪ Low    | `GET /audits` uses `skip()` pagination                                | `apps/web/src/app/api/v1/audits/route.ts:198`         | 3h               | Page-based, not cursor-based. Plan calls for cursor pagination (Step 31 description). Skip works fine to ~10K records, then degrades. Plan's actual API spec uses cursor pagination — current implementation diverges. |
| TD-009 | ⚪ Low    | Test coverage is shallow for new endpoints                            | `apps/web/src/app/api/v1/audits/audits.test.ts`       | 4h               | Covers POST + GET list. Missing: GET single, POST cancel, SSE endpoint, progress endpoint. Step 33 in plan called for "all 5 endpoints".                                                                               |
| TD-010 | ⚪ Low    | `audit-log` hardcodes ipAddress fallback to "unknown"                 | `apps/web/src/app/api/v1/audits/route.ts:138`         | 30min            | Should parse `x-forwarded-for` properly (split on comma, take first non-internal IP). Trust proxy chain config needed.                                                                                                 |

### Carried Over from Pre-Stage-1

None — Stage 1 was the first implementation phase.

---

## Resolved (Closed)

_None yet — first review at M1._

---

## Next Sprint Allocation (Stage 2: Steps 36-75)

20% of Stage 2 hours = ~18h budgeted for debt repayment. Priority order:

1. **TD-001** (4h) — Attach plan tier to JWT (blocks correct rate limiting in production)
2. **TD-004** (3h) — Sentry integration (blocks production observability)
3. **TD-009** (4h) — Test coverage for cancel + GET single (de-risk Step 32 endpoints)
4. **TD-008** (3h) — Cursor pagination (matches API spec)
5. **TD-002** (2h) — Redis index for job lookup (small perf win)
6. **TD-006** (2h) — Improved `withHandler` type inference

**Remaining 17h** of debt budget held for new items discovered during Stage 2.

---

## Methodology Notes

- All items must have an estimated cost (in hours)
- All items must have a location (file path or component)
- Critical items block the next milestone gate
- High items must be triaged within 1 sprint
- Items resolved get a "Resolved (Closed)" entry with PR link
- Review cadence: **every milestone gate**
