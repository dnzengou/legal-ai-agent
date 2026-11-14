# legal-ai-agent — Blueprint

**Version:** 0.7.5
**Date:** 2026-11-14
**Status:** lean single-product API — auth · rate limit · citations · safety scoring · compliance flags · prod hardening · search-first landing · Python client · provenance-enabled anti-hallucination · AI-agent discoverability bundle (llms.txt, OpenAPI snapshot, FAQPage/HowTo/Organization schemas, security.txt, CITATION.cff) · end-user integrations (bookmarklet, GitHub Action, MCP, Slack, Zapier) · **standalone portable GEO skill** · **onboarding ladder** · **openapi-freshness CI gate** · root `CHANGELOG.md`

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
- [x] Safety score (0–100) + letter grade (A–F) — server-computed deterministically from risks (`src/scoring.py`); never trusted from the model
- [x] Compliance flags — model-assessed per-framework status (GDPR/CCPA/HIPAA/PCI-DSS/SOC2) with notes
- [x] Production hardening — request-id tracing, access logging with latency, security headers, GZip, sanitized catch-all 500, root `/` endpoint
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
| Landing page + live demo | ✅ | `site/index.html` (interactive sample review, WCAG AA) |
| Python client (copy-paste) | ✅ | `examples/client.py` — stdlib-only, no deps |
| GitHub releases | 🔲 | tag-on-merge workflow planned |
| Python SDK (`pip install legal-ai-agent`) | 🔲 | packaged wrapper (client exists as `examples/client.py`) |
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
    {
      "severity": "low|medium|high",
      "category": "string",
      "description": "string",
      "clause_ref": "string",
      "confidence": "high|medium|low (model self-report; server downgrades to 'low' if provenance did not anchor)",
      "provenance": {
        "text_excerpt": "string (verbatim quote from source ≤500 chars)",
        "char_start": "int|null (server-filled)",
        "char_end": "int|null (server-filled)",
        "anchored": "bool (server-filled: true iff excerpt found character-for-character in source)"
      }
    }
  ],
  "compliance_flags": [
    {
      "framework": "GDPR|CCPA|HIPAA|PCI-DSS|SOC2|...",
      "status": "compliant|gap|not_applicable|unclear",
      "note": "string",
      "confidence": "high|medium|low",
      "provenance": "same shape as risks[].provenance (may be null for 'not_applicable')"
    }
  ],
  "recommendations": ["string"],
  "safety_score": "int 0-100 (server-computed from risks)",
  "letter_grade": "A|B|C|D|F (server-derived from safety_score)",
  "overall_confidence": "int 0-100 (server-computed: 50 × anchor_rate + 50 × avg_self_confidence)",
  "confidence_level": "high (≥80) | medium (≥60) | low"
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
| 0.6.0   | 2026-06-28 | Safety score (0–100) + letter grade (A–F) computed server-side from risks; per-framework compliance flags; production hardening (request-id tracing, access logs, security headers, GZip, sanitized 500, root `/`); fixed corrupted Dockerfile (was building the Node frontend, not the FastAPI service) |
| 0.6.1   | 2026-06-28 | Commercial low-hanging fruit: interactive **live demo** on the landing page (client-side sample review — score ring, A–F grade, risk badges, compliance chips; verified light/dark, WCAG AA); refreshed landing value props + API example to show `safety_score`/`letter_grade`/`compliance_flags`; **dependency-free Python client** (`examples/client.py`) + 7 tests; `X-Request-ID` now echoed on sanitized 500s |
| 0.7.0   | 2026-07-16 | **Less is more:** retired the unbuilt React/Hono frontend (142 files, ~100 npm deps, Vite/tRPC/Drizzle toolchain) that never deployed. Repo is now one coherent product — the FastAPI contract-review API + static landing page. No cross-imports removed anything from the Python app (55 tests still green). Trimmed `.env.example` to API vars, streamlined `BLUEPRINT.md` to a single blueprint, and pointed Vercel at the static `site/` (zero build). |
| 0.7.1   | 2026-07-17 | **Search-first UX:** landing page rebuilt as a Google-search-like fold — big centered wordmark, prompt input, 3 sample chips, minimal chrome. Cut 9 sections down to 1 stage + 1 result + collapsed "learn more". Added the **Svensk medborgarskap överklagan** sample (Migrationsverket appeal with adaptive verdict, MedbL 11§/12§ + FL 44§ citations, MIG 2019:20 case law). Added **role reveal chips** — Creators / Entrepreneurs / Builders / Consultants / Owners / Operators — each with the top 5 legal matters for that profile. Verified light + dark, 55 tests green. |
| 0.7.2   | 2026-07-17 | **UX polish (E→Im pass):** autofocus prompt on load · `/` keyboard shortcut to jump focus (with subtle `kbd` hint in the input) · Escape resets stage · **illustrative-sample badge** on the result panel with a "Call the live API" link (so nobody mistakes the client-side demo for a real analysis of typed text). CLAUDE.md landing description synced. 55 tests green. |
| 0.7.3   | 2026-07-23 | **Provenance + confidence — the anti-hallucination gate.** New `Provenance` schema on every `Risk` and `ComplianceFlag`: the model must attach a `text_excerpt` from the source justifying each finding. The server anchors it by exact substring match (same logic as `KeyClause`); any finding whose citation is not present verbatim is auto-downgraded to `low` confidence — **the model cannot fabricate a citation without the server catching it**. Deterministic `overall_confidence` (0–100) + `confidence_level` (high/medium/low) computed as `50 × anchor_rate + 50 × avg_self_confidence`. Landing demo shows the whole glass-box: cited excerpts inline per risk (green ✓ badge + blockquote), per-finding confidence badges, top-level confidence pill, raw JSON exposes `provenance` + `overall_confidence`. Prompt updated to make provenance mandatory. +17 tests (72 total). Answers the "risk of hallucination" feedback: the tool now *measures* trustworthiness at the source level. |
| 0.7.5   | 2026-11-14 | **Standalone GEO skill + onboarding + CI freshness gate.** Packaged the v0.7.4 GEO bundle into a self-contained Claude Skill at `.claude/skills/geo-ai-seo/` — drop-in portable to any project: `SKILL.md` (triggers, when-to-use, seven commandments), `README.md` (extract-and-use guide), `CHECKLIST.md` (full audit checklist, 10 sections), 9 parameterised templates (llms.txt, llms-full.txt, robots.txt, sitemap.xml, security.txt, humans.txt, faq.html, jsonld-graph.json, netlify-headers.toml), 3 helper scripts (`generate_openapi.py` — portable ASGI-app spec snapshot; `generate_og_image.py` — Pillow-based 1200×630 PNG + SVG; `validate.py` — checklist auditor that runs over a `site/` dir and prints OK/WARN/FAIL per check). The skill passes its own validator against this repo (15/15 OK). **Onboarding** (`ONBOARDING.md`): four-rung ladder from zero-install (live demo) → bookmarklet → cURL → Docker self-host, with expected JSON responses, a troubleshooting table, and a "minimum viable config" note. **CI freshness gate**: `.github/workflows/openapi-freshness.yml` regenerates `site/openapi.json` on every PR touching `api/` or `src/` and fails if the committed snapshot drifts. **MCP server extracted** from INTEGRATE.md into `examples/mcp_server.py` — runnable, documented, with `claude_desktop_config.json` snippet in the module docstring; three tools (`review_contract`, `review_pdf`, `health`). **Honesty fixes**: dropped misleading "DeepSeek / other LLM" claim on landing (we only call Claude); INTEGRATE.md explicitly flags `api.legal-ai-agent.fly.dev` as a reference / placeholder host. **README**: Deploy-to-Netlify + Deploy-to-Render one-click buttons; ONBOARDING link promoted to first bullet; GEO skill linked. **Root `CHANGELOG.md`** extracted (conventional, SEO-friendly). Blueprint version date bump 2026-11-07 → 2026-11-14. No Python code changes beyond `VERSION` bump — 72 tests still green. |
| 0.7.4   | 2026-11-07 | **AI-agent discoverability + end-user integrations.** Legitimate GEO (Generative Engine Optimization) bundle for the landing page — no cloaking, no hidden text, no keyword stuffing. **Site-level:** `site/llms.txt` + `site/llms-full.txt` (llmstxt.org format) so LLM-powered search tools can cite us from a well-structured source; `site/robots.txt` with explicit allow-list for 20+ AI crawlers (GPTBot, OAI-SearchBot, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended, Applebot-Extended, CCBot, Mistral, DeepSeek, …); `site/sitemap.xml`; `site/.well-known/security.txt` (RFC 9116, GitHub Security Advisories as contact); `site/humans.txt`; `site/openapi.json` snapshot of the FastAPI spec (served with CORS so agents can fetch it from anywhere); `site/og-image.png` + `site/og-image.svg` (1200×630, 38 KB, logomark with score ring); `site/faq.html` with `FAQPage` schema; inline FAQ snippet on index. **Enriched JSON-LD** on index.html as an `@graph` of `Organization` + `WebSite` (with `SearchAction`) + `SoftwareApplication` (with `featureList`, `offers`, `author`, `citation`, `softwareVersion`, `applicationSubCategory: LegalTech`) + `FAQPage` + `HowTo` + `BreadcrumbList`. **Alternate links** declare llms.txt / llms-full.txt / openapi.json so crawlers can discover them from the page head. **Netlify headers** pin content-types for `.txt`, `/.well-known/*`, and `openapi.json` (CORS open) with sensible cache-control. **Credibility files** at repo root: `SECURITY.md` (responsible-disclosure policy), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` (short, adapted from Contributor Covenant), `CITATION.cff` (CFF 1.2.0 with ORCID-friendly metadata, keywords for academic indexing). **README** gets shields.io badges (MIT, Python 3.12, 72 tests, OpenAPI 3.1, GHCR, Netlify). **End-user integrations in `INTEGRATE.md`:** browser bookmarklet (one-click review of any page's text or selection), GitHub Action (contract-review on PR), Slack slash-command bridge (signed webhook), Zapier / Make webhook recipe, **MCP server wrapper** (four-line stdio MCP server that exposes `review_contract` as a tool to Claude / ChatGPT / Cursor — turns legal-ai-agent into an agent-callable tool), Postman via OpenAPI import, iOS/macOS Shortcut, Node.js fetch. **Scripts/:** `generate_openapi.py` and `generate_og_image.py` for rebuilding the snapshots on demand. No Python code changes — 72 tests still green. White-hat only: every claim maps to code in the repo, no fabricated reviews / ratings / social proof. |

## Session lessons (evo-metaclaw)

Extracted patterns from the v0.5 → v0.7 arc, kept here so future sessions can inherit them.

- **Aggressive subtraction beats debugging** — v0.7.0 removed 142 files of unbuilt frontend and resolved the entire multi-week Vercel saga by *not shipping the broken thing*. The signal: when a system's config is opaque (Vercel dashboard, in this case) and repo-side changes fail 4+ times in a row, stop pushing and change what you deploy, not how you deploy it.
- **Server-owned truth beats model-owned truth** — the safety score and grade are computed deterministically from the model's risk list, never taken from the model. Same idea as the citation offset anchoring. Makes the number testable offline, immune to model drift, and impossible to inflate. Pattern generalizes to any LLM output that carries a verifiable number.
- **Sample-driven demos > docs** — the interactive `site/` demo converted more skepticism into engagement than any tier-comparison table would. Adding the Svensk medborgarskap sample made the tool's generality *concrete* in a way "we also support appeals" never could.
- **Adaptive verdict language > forced consistency** — the same score-ring UI serves both contract review ("Do not sign as-is") and appeal drafting ("Weak case — supplementary evidence essential") through a per-sample `verdictOverride`. Less code than a fork, more clarity than a shared verbose label.
- **Ask when scopes diverge** — when the Vercel deploy could be fixed by three genuinely different paths (repo, dashboard, disable), AskUserQuestion cut the round-trip loop that had been failing. Don't guess at reversibility questions.
- **Illustrative ≠ live** — the v0.7.2 badge (`Illustrative sample — this preview runs client-side`) came from noticing the demo *looked* like a real analysis of typed text. When a UI simulates real behavior, disclose it or make it real — halfway is misleading.
- **Glass-box beats "trust me" for LLM outputs.** The v0.7.3 provenance gate answers "how do you prevent hallucination?" not by measuring hallucination probability, but by making it structurally impossible for an ungrounded claim to score well. Every finding must attach a verbatim excerpt; the server anchors it; unanchored → auto-`low`; `overall_confidence` drops. Same pattern as the safety-score / citation-offset design: the model proposes, the server *verifies at the source level*. Reusable across any LLM product where the risk of confabulation is the product risk.
- **AI-agent discoverability is a multi-format bet, not a keyword game.** The v0.7.4 SEO/GEO pass shipped seven simultaneous machine-readable surfaces — JSON-LD `@graph` (Organization/WebSite/SoftwareApplication/FAQPage/HowTo/BreadcrumbList), `llms.txt`, `llms-full.txt`, `openapi.json`, `robots.txt` with explicit AI-crawler allow-list, `sitemap.xml`, `security.txt`, `CITATION.cff` — all pointing at the same facts in slightly different shapes. The win is redundancy: whichever format a given retrieval pipeline consumes, it hits the same ground truth. Credibility signals (SECURITY.md, CODE_OF_CONDUCT.md, CITATION.cff, shields.io badges) are low-effort/high-leverage because both humans *and* LLM search crawlers register them as "real project" markers. White-hat rule: every claim on these surfaces must map to code or docs in the repository — no fabricated ratings, reviews, or social proof, because the moment an AI agent hallucinates on your behalf, your credibility signal is upside-down.
- **End-user integrations beat landing-page copy.** A bookmarklet, a GitHub Action, and an MCP-tool wrapper are each about 15 lines of code and each unlock a different buyer: the lawyer who tried us once, the ops team that automates PRs, the AI-agent builder. They also become their own distribution: a bookmarklet pasted into Slack reaches more people than a tweet about the landing page. The MCP wrapper in particular is the agentic-era "Zapier integration" — put your API behind a four-line MCP server and you become a tool the host LLM can reach for.
- **Package capabilities as reusable skills, not one-off work.** The v0.7.4 GEO work shipped as site-level edits; v0.7.5 repackaged the same capability as a portable Claude Skill (`.claude/skills/geo-ai-seo/`) that drops into any other project unchanged. Templates with `{{placeholders}}`, scripts with CLI args, a validator that runs against any `site/` dir. The signal: when a bundle of work is clearly re-applicable (checklist + templates + scripts + examples), extract it as a skill *in the same PR as the first use*. Cost to extract is near-zero while the context is fresh; cost to extract later is a rewrite. Same pattern applies to any workflow a codebase would benefit from applying to future projects.
- **Onboarding is a ladder, not a slope.** `ONBOARDING.md` offers four rungs — live demo (0s / 0 install), bookmarklet (10s / 0 install), cURL against your deploy (60s), Docker self-host (90s). Each rung works on its own; climb only as far as the task needs. Flattening the first-success latency to seconds for the demo rung (while keeping the production rung well-documented) converted the "how do I try this?" question into a no-op.
- **Freshness is a CI concern, not a documentation one.** v0.7.4 snapshotted `site/openapi.json`; v0.7.5 added a GHA that regenerates it on every PR and fails if the committed copy drifts. The lesson: anything that's both auto-derivable *and* publicly served needs a freshness gate, because docs that silently rot are worse than no docs — crawlers cite stale shapes with high confidence. Every machine-readable artifact (`openapi.json`, `llms.txt` version strings, sitemap `lastmod`) is a candidate for the same pattern.
