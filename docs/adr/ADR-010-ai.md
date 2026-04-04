# ADR-010: AI/LLM — Anthropic Claude API

**Status:** Accepted
**Date:** 2026-04-04
**Category:** Build vs Buy

## Context

Audex generates AI-powered report summaries: executive overview, top 3 priority issues, recommended action items, and positive observations. Needs structured output from audit data (scores, findings, metadata). Must be reliable, fast, and cost-predictable.

## Decision

Use **Anthropic Claude API** (Claude Sonnet) for report summarization.

## Rationale

- Structured output via tool use pattern (forced function calling) — reliable JSON
- Claude Sonnet balances quality and cost ($3/1M input, $15/1M output tokens)
- Excellent at technical writing — security, performance, accessibility domain knowledge
- Fast response times (< 5s for summary generation)
- No fine-tuning needed — prompt engineering sufficient for our use case
- Token usage trackable per report for cost monitoring

## Alternatives Considered

| Option                | Why Not                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| OpenAI GPT-4o         | Comparable quality. Claude chosen for structured output reliability and cost. Either would work.                 |
| Local LLM (Ollama)    | Would run on workers — adds memory/CPU cost. Quality not comparable for technical summaries.                     |
| No AI summary         | Removes a key differentiator. AI summary is what makes Audex reports more actionable than raw Lighthouse output. |
| Pre-written templates | Too generic. Personalized summaries based on actual findings are significantly more valuable.                    |

## Cost Estimate

Per report summary:

- Input: ~2K tokens (report digest: scores, top findings, metadata)
- Output: ~500 tokens (summary, issues, action items)
- Cost: ~$0.01 per report
- At 1,000 reports/month: ~$10/month

## Consequences

- API key required (`ANTHROPIC_API_KEY` env var, optional — AI summary skipped if not set)
- Must handle API failures gracefully (report still valuable without AI summary)
- Token usage tracked per report for cost monitoring and billing alerts
- Prompt must be tuned during calibration passes (Steps 157-159)
- Summary generation is async (part of audit pipeline, not blocking)
- Free tier users may not get AI summaries (cost control decision, TBD)
