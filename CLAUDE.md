# legal-ai-agent

Contract review agent. FastAPI service that ingests contracts (text or PDF), extracts clauses, flags risk, and summarizes — powered by Claude Opus 4.8 via the Anthropic SDK.

## Stack

- **Language:** Python 3.12
- **API:** FastAPI + Uvicorn
- **LLM:** Anthropic SDK (`anthropic`), model `claude-opus-4-8`, adaptive thinking, `effort: high`
- **Output shape:** structured outputs via `output_config.format` (json_schema)
- **PDF:** native Claude PDF support via `document` content block (base64 source)
- **Container:** Docker, ARM64 multi-arch
- **Deploy:** Fly.io (`fly.toml`)
- **CI:** GitHub Actions → GHCR image build

## Layout

```
api/app.py          FastAPI app: /health, /review, /review-pdf
api/auth.py         X-API-Key header dependency
api/rate_limit.py   Per-IP token bucket limiter
src/agent.py        LegalAgent class — single review() entrypoint
src/prompts.py      System prompt + JSON schema
src/schema.py       Pydantic models for request/response
tests/test_agent.py Smoke tests (no network — mocked client)
Dockerfile          ARM64 multi-arch image
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

## Roadmap

See `BLUEPRINT.md`.
