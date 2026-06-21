# legal-ai-agent — Blueprint

**Version:** 0.5.0
**Date:** 2026-06-19
**Status:** v0 scaffold + auth + rate limit + citations + CORS + landing page + GTM

## Mission

Reduce hours-to-minutes for first-pass contract review: ingest a contract, return extracted clauses, risk flags, and a summary that a junior associate would otherwise produce.

## Scope (v0)

- POST `/review` — accept contract text, return structured review
- POST `/review-pdf` — accept base64 PDF, return structured review
- GET `/health` — liveness probe

Out of scope for v0: persistence, multi-document comparison, redlining, user accounts.

## Architecture

```
client → FastAPI (api/app.py)
       → LegalAgent.review() (src/agent.py)
       → Anthropic SDK (claude-opus-4-8, adaptive thinking, effort: high)
       → output_config.format = json_schema → typed response
```

## Roadmap

- [x] Scaffold project structure (R-squared compliant)
- [x] FastAPI app with `/health`, `/review`, `/review-pdf`
- [x] LegalAgent with structured outputs via `messages.parse()`
- [x] PDF ingestion via Claude native document block
- [x] Dockerfile (ARM64 multi-arch)
- [x] fly.toml (512mb shared-cpu machine)
- [x] GitHub Actions CI → GHCR
- [x] Smoke tests with mocked Anthropic client
- [ ] Streaming endpoint for long contracts (`/review-stream`)
- [x] Rate limiting (per-IP, in-memory token bucket) — env-tunable burst/refill, trusts `X-Forwarded-For` only when `TRUST_PROXY_HEADERS` is set
- [ ] Persistent review history (SQLite → Postgres)
- [ ] Multi-contract comparison endpoint
- [x] Citations/quote-anchoring to source text — server-filled `char_start`/`char_end` on each key clause via exact substring match (text path only; PDFs leave offsets null)
- [x] Auth (API key middleware) — `X-API-Key` header, env-configured allowlist, constant-time compare
- [x] CORS — env-controlled allowed-origin list (`CORS_ORIGINS`), `GET`/`POST`/`OPTIONS`, no credentials
- [x] Landing page (`site/`) — WCAG 2.2 AA, semantic HTML, prefers-color-scheme/reduced-motion/forced-colors, 3-tier pricing
- [x] GTM playbook ([GTM.md](./GTM.md)) — ICP, channels, T-30→T+30 launch calendar, ARM KPIs

## Distribution Channels

| Channel | Status | Surface |
|---------|--------|---------|
| Python source (clone + pip) | ✅ | `requirements.txt`, `uvicorn api.app:app` |
| Docker image (GHCR, ARM64) | ✅ | CI on push to `main` |
| Fly.io managed deploy | ✅ | `fly.toml`, `fly deploy` |
| Landing page | ✅ | `site/index.html` (deploy via any static host) |
| GitHub releases | 🔲 | tag-on-merge workflow planned |
| Python SDK (`pip install legal-ai-agent`) | 🔲 | thin client wrapper |
| Hosted managed tier (Pro €9.99/mo) | 🔲 | waitlist live, billing pending |

## API contract

### POST /review

Request:
```json
{
  "contract_text": "string",
  "jurisdiction": "string (optional, e.g. 'US-DE', 'EU')",
  "party_role": "string (optional, e.g. 'buyer', 'vendor')"
}
```

Response:
```json
{
  "summary": "string",
  "parties": ["string"],
  "effective_date": "string|null",
  "term": "string|null",
  "key_clauses": [
    {
      "type": "string",
      "summary": "string",
      "text_excerpt": "string",
      "char_start": "int|null (server-filled offset into contract_text; null on PDFs or non-verbatim quotes)",
      "char_end": "int|null"
    }
  ],
  "risks": [
    { "severity": "low|medium|high", "category": "string", "description": "string", "clause_ref": "string" }
  ],
  "recommendations": ["string"]
}
```

### POST /review-pdf

Same response shape; request body:
```json
{
  "pdf_base64": "string",
  "jurisdiction": "string (optional)",
  "party_role": "string (optional)"
}
```

## Quality (RRSS)

- **Robust:** Pydantic validation at FastAPI boundary; structured outputs prevent malformed JSON
- **Reliable:** `messages.parse()` retries on schema validation failures
- **Solid:** No half-features — every roadmap [x] is fully wired end-to-end
- **Stable:** No backwards-incompat changes within v0.x
- **Resistant:** Anthropic SDK auto-retries 429/5xx; HTTP errors mapped to FastAPI exceptions
- **Scalable:** Stateless; Fly.io can scale to N machines behind one IP
- **Secure:** API key from env only; no secrets logged; PDF inputs size-capped at 32MB; constant-time key compare; rate limit before auth; CORS opt-in only; landing page targets WCAG 2.2 AA (a11y == inclusion is a security/UX requirement, not a nice-to-have)
- **Systematic:** One agent class, one entrypoint, no parallel codepaths

## Changelog

| Version | Date       | Changes |
|---------|------------|---------|
| 0.1.0   | 2026-06-15 | Initial scaffold: contract review agent, FastAPI, Docker ARM64, Fly.io, CI |
| 0.2.0   | 2026-06-17 | API key auth on `/review*` via `X-API-Key`; `API_KEYS` env allowlist; `/health` stays open |
| 0.3.0   | 2026-06-18 | Per-IP token bucket rate limit on `/review*`; `RATE_LIMIT_PER_MIN`/`RATE_LIMIT_BURST`/`TRUST_PROXY_HEADERS` env |
| 0.4.0   | 2026-06-19 | Citations: `char_start`/`char_end` on each `KeyClause`, server-filled via exact substring match against source text |
| 0.5.0   | 2026-06-19 | Landing page (`site/`, WCAG 2.2 AA), GTM playbook, CORS via `CORS_ORIGINS`, README rewrite, Distribution Channels table |
