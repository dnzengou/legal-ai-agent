# legal-ai-agent — Blueprint

**Version:** 0.1.0
**Date:** 2026-06-15
**Status:** v0 scaffold — contract review MVP

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
- [ ] Rate limiting (per-IP, in-memory token bucket)
- [ ] Persistent review history (SQLite → Postgres)
- [ ] Multi-contract comparison endpoint
- [ ] Citations/quote-anchoring to source text
- [ ] Auth (API key middleware)

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
    { "type": "string", "summary": "string", "text_excerpt": "string" }
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
- **Secure:** API key from env only; no secrets logged; PDF inputs size-capped at 32MB
- **Systematic:** One agent class, one entrypoint, no parallel codepaths

## Changelog

| Version | Date       | Changes |
|---------|------------|---------|
| 0.1.0   | 2026-06-15 | Initial scaffold: contract review agent, FastAPI, Docker ARM64, Fly.io, CI |
