# Changelog

All notable changes to this project. The format roughly follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows [Semantic Versioning](https://semver.org/) for the API surface.

For the full architecture-level history with rationale, session lessons, and evo-metaclaw patterns, see [`BLUEPRINT.md`](./BLUEPRINT.md).

---

## [0.7.5] — 2026-11-14

### Added

- **Standalone portable GEO skill** at `.claude/skills/geo-ai-seo/` — `SKILL.md`, `README.md`, `CHECKLIST.md`, 9 parameterised templates (llms.txt, llms-full.txt, robots.txt, sitemap.xml, security.txt, humans.txt, faq.html, jsonld-graph.json, netlify-headers.toml), 3 helper scripts (`generate_openapi.py`, `generate_og_image.py`, `validate.py`). Drop-in portable: the whole directory copies into any project's `.claude/skills/` and works unchanged.
- **`ONBOARDING.md`** — four-rung ladder from zero-install (live demo) → bookmarklet → cURL → Docker self-host, with expected JSON, troubleshooting table, minimum viable config.
- **`.github/workflows/openapi-freshness.yml`** — CI gate: regenerates `site/openapi.json` on every PR touching `api/` or `src/`; fails if the committed snapshot drifts.
- **`examples/mcp_server.py`** — runnable MCP server (3 tools: `review_contract`, `review_pdf`, `health`) with `claude_desktop_config.json` snippet in the docstring.
- **Root `CHANGELOG.md`** (this file) — extracted from the architecture blueprint for SEO + conventional-commits friendliness.
- **README one-click deploy buttons** — Netlify + Render.

### Changed

- `BLUEPRINT.md` — v0.7.5 changelog entry, status description updated, four new evo-metaclaw lessons.
- `INTEGRATE.md` — explicit note that `api.legal-ai-agent.fly.dev` is a reference / placeholder host; link ONBOARDING for one-click deploy paths.
- `api/app.py` — `VERSION` 0.7.4 → 0.7.5.
- `site/openapi.json` — regenerated for v0.7.5.

### Fixed

- Landing page: dropped misleading "DeepSeek / other LLM" claim in *How it works* (we only call Claude Opus 4.8).

---

## [0.7.4] — 2026-11-07

### Added

- **AI-agent discoverability bundle** — legitimate GEO (Generative Engine Optimization):
  - `site/llms.txt`, `site/llms-full.txt` (llmstxt.org format).
  - `site/robots.txt` with explicit allow-list for 20+ AI crawlers.
  - `site/sitemap.xml`.
  - `site/.well-known/security.txt` (RFC 9116, GitHub Advisories as contact).
  - `site/humans.txt`.
  - `site/openapi.json` snapshot (served with CORS).
  - `site/og-image.png` + `og-image.svg` (1200×630, brand palette).
  - `site/faq.html` with `FAQPage` schema (14 real Q&As).
- Enriched JSON-LD `@graph` on `site/index.html`: Organization + WebSite (with SearchAction) + SoftwareApplication (with featureList, offers, author, citation) + FAQPage + HowTo + BreadcrumbList.
- Alternate `link` rels declaring llms.txt / llms-full.txt / openapi.json so crawlers discover them from the page head.
- Inline FAQ snippet on index.
- **Credibility files** at repo root: `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CITATION.cff`.
- **`INTEGRATE.md`** — bookmarklet, GitHub Action, Slack bridge, Zapier recipe, MCP server wrapper, Postman, iOS Shortcut, Node.js fetch, cURL.
- `scripts/generate_openapi.py`, `scripts/generate_og_image.py`.
- README shields.io badges (MIT, Python 3.12, 72 tests, OpenAPI 3.1, GHCR, Netlify).

### Changed

- `netlify.toml` — content-type + CORS pins for `.txt`, `/.well-known/*`, `openapi.json`; cache-control for `og-image.*`.
- `api/app.py` — `VERSION` 0.7.3 → 0.7.4.

---

## [0.7.3] — 2026-07-23

### Added

- **Provenance + confidence — anti-hallucination gate.** `Provenance` schema on every `Risk` and `ComplianceFlag`; the model must attach a `text_excerpt` from the source justifying each finding.
- Server anchors every provenance excerpt by exact substring match. Any finding whose citation is not present verbatim is auto-downgraded to `low` confidence.
- Deterministic `overall_confidence` (0–100) + `confidence_level` (high/medium/low) computed as `50 × anchor_rate + 50 × avg_self_confidence`.
- Landing-page demo shows the glass-box: cited excerpts inline per risk, per-finding confidence badges, top-level confidence pill, raw JSON exposes `provenance` + `overall_confidence`.
- +17 tests (72 total).

### Changed

- System prompt — provenance now mandatory for every risk and non-NA compliance flag.

---

## [0.7.2] — 2026-07-17

### Added

- Autofocus prompt on load; `/` keyboard shortcut to focus; Escape resets stage.
- Illustrative-sample badge on the result panel with a "Call the live API" link.

---

## [0.7.1] — 2026-07-17

### Added

- **Search-first UX:** landing rebuilt as a Google-search-like fold — big centered wordmark, prompt input, 3 sample chips, minimal chrome.
- Svensk medborgarskap överklagan sample (Migrationsverket appeal; MedbL 11§/12§ + FL 44§ citations, MIG 2019:20 case law).
- Role reveal chips — Creators / Entrepreneurs / Builders / Consultants / Owners / Operators — each with top 5 legal matters.

### Removed

- 9 sections collapsed to 1 stage + 1 result + collapsed "learn more".

---

## [0.7.0] — 2026-07-16

### Removed

- **Less is more:** retired the unbuilt React/Hono frontend (142 files, ~100 npm deps, Vite/tRPC/Drizzle toolchain) that never deployed.

### Changed

- Repo is now one coherent product — the FastAPI contract-review API + static landing page.
- Trimmed `.env.example` to API vars.
- Streamlined `BLUEPRINT.md` to a single blueprint.
- Pointed Vercel at the static `site/` (zero build).

---

## [0.6.1] — 2026-06-28

### Added

- Interactive **live demo** on the landing page (client-side sample review).
- Refreshed landing value props + API example.
- Dependency-free Python client (`examples/client.py`) + 7 tests.

### Changed

- `X-Request-ID` now echoed on sanitized 500s.

---

## [0.6.0] — 2026-06-28

### Added

- Safety score (0–100) + letter grade (A–F) computed server-side from risks.
- Per-framework compliance flags.
- Production hardening: request-id tracing, access logs, security headers, GZip, sanitized 500, root `/`.

### Fixed

- Corrupted Dockerfile (was building the Node frontend, not the FastAPI service).

---

## [0.5.0] — 2026-06-19

### Added

- Landing page (`site/`, WCAG 2.2 AA).
- GTM playbook.
- CORS via `CORS_ORIGINS`.
- README rewrite.
- Distribution Channels table.

---

## [0.4.0] — 2026-06-19

### Added

- Citations: `char_start` / `char_end` on each `KeyClause`, server-filled via exact substring match against source text.

---

## [0.3.0] — 2026-06-18

### Added

- Per-IP token-bucket rate limit on `/review*`.
- `RATE_LIMIT_PER_MIN` / `RATE_LIMIT_BURST` / `TRUST_PROXY_HEADERS` env vars.

---

## [0.2.0] — 2026-06-17

### Added

- API-key auth on `/review*` via `X-API-Key`; `API_KEYS` env allowlist.
- `/health` stays open.

---

## [0.1.0] — 2026-06-15

### Added

- Initial scaffold: contract review agent, FastAPI, Docker ARM64, Fly.io, CI.
