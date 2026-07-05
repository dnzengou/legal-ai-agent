# legal-ai-agent

Contract review agent. FastAPI service that ingests contracts (text or PDF), extracts clauses, flags risk, and summarizes — powered by Claude Opus 4.8 via the Anthropic SDK.

## Stack

- **Language:** Python 3.12
- **API:** FastAPI + Uvicorn
- **LLM:** Anthropic SDK (`anthropic`), model `claude-opus-4-8`, adaptive thinking, `effort: high`
- **Output shape:** structured outputs via `output_config.format` (json_schema); server-owned safety score, letter grade, and citation offsets
- **PDF:** native Claude PDF support via `document` content block (base64 source)
- **Container:** Docker, ARM64 multi-arch
- **Deploy:** Fly.io (`fly.toml`)
- **CI:** GitHub Actions → GHCR image build

## Layout

```
api/app.py          FastAPI app: /, /health, /review, /review-pdf + observability/security middleware
api/auth.py         X-API-Key header dependency
api/rate_limit.py   Per-IP token bucket limiter
src/agent.py        LegalAgent class — single review() entrypoint
src/prompts.py      System prompt + JSON schema
src/schema.py       Pydantic models for request/response
src/scoring.py      Deterministic safety score (0-100) + letter grade (A-F)
examples/client.py  Dependency-free (stdlib) Python client — copy-paste, no pip install
site/index.html     Landing page + interactive client-side demo (sample review)
tests/              Smoke + scoring + app + auth + rate-limit + anchoring + client tests (no network — mocked)
Dockerfile          ARM64 multi-arch image (Python 3.12 / uvicorn)
fly.toml            Fly.io machine config (512mb, shared cpu)
```

## Commands

```bash
# Dev
uvicorn api.app:app --reload --port 8000
# Test
pytest -q
# Build (ARM64)
docker buildx build --platform linux/arm64 -t legal-ai-agent .
# Deploy
fly deploy
```

## Env

- `ANTHROPIC_API_KEY` — required
- `API_KEYS` — comma-separated client API key allowlist (checked against `X-API-Key` header on `/review*`). Empty disables auth (dev only).
- `RATE_LIMIT_PER_MIN` — sustained requests/min per client IP on `/review*` (default 30; 0 disables)
- `RATE_LIMIT_BURST` — burst capacity for the token bucket (default 60)
- `TRUST_PROXY_HEADERS` — when truthy, key limiter on first `X-Forwarded-For` hop. Enable behind Fly.io / a reverse proxy.
- `CORS_ORIGINS` — comma-separated allowed origins. Empty disables CORS.
- `PORT` — defaults to 8000
- `LOG_LEVEL` — defaults to INFO

## Design rules

- No secrets in code; all via env
- Validate at boundaries only (FastAPI Pydantic models); trust internal calls
- Stream responses if `max_tokens > 16000`
- Use `client.messages.parse()` for structured outputs (auto-validates)
- Errors: surface as HTTP 4xx/5xx with sanitized messages, never echo API keys
- Verifiable values (safety score, citation offsets) are computed server-side, never trusted from the model — the model proposes, the server owns the number

## Short-command grammar (DevFlow / KafCa / Evolve)

This repo ships composable skills under `.claude/skills/` (also see `COMMANDS.md`).
When a message is a bare command string — single letters or letters joined by
`+`, space, `,`, or `→` — interpret it with the DevFlow grammar and invoke the
matching skill rather than treating it as prose.

| Cmd | Skill | Meaning |
|-----|-------|---------|
| `B` | devflow | Build — implement next roadmap item / specified feature |
| `I` | devflow | Integrate — reflect on changes, sync docs + state |
| `Im` | devflow | Improve — refactor/optimise/harden, no new features |
| `E` | devflow | Evaluate — audit quality · security · performance · consistency |
| `C` | devflow | Consolidate — dedupe, remove dead code, reorganise |
| `Bl` | devflow | Blueprint — update `BLUEPRINT.md` (preserve past changelogs) |
| `P` | devflow | Push — staged commit (smart message) + push |
| `D` | devflow | Deploy — deploy to the detected target, confirm live |
| `CI` | devflow | Continuous Improve — `I→Im→E→C→Bl→P→D` |

- **Overlays:** `KafCa` (terse Karpathy/fixClaude/Caveman mode — no preamble, minimal code) and `RRSS`/`R²S²` (Robust·Reliable·Solid·Stable·Resistant·Scalable·Secure·Systematic quality gates) prefix any command, e.g. `kafca E+Im`.
- **Evolve / evo-metaclaw:** evolutionary meta-learning — draw on the EvoForge/MetaClaw concepts (matrix-thinking, population dynamics, circuit breaker, lineage). Skills: `evolved-skillopt-v2/v3-agentic/v4-bio`.
- **KafCade:** multi-project DevFlow cascade across subagents.
- Commands are case-insensitive; `+`, space, `,`, `→` are equivalent separators.

Reference decode — the original session command **`KafCa E+Im + Bl. Evolve evo-metaclaw.`** = *in terse KafCa mode: Evaluate → Improve → update Blueprint, then evolve the app using evo-metaclaw (evolutionary meta-learning)* — which is what shipped in v0.6.0.

## Roadmap

See `BLUEPRINT.md`.
