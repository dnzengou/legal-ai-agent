# legal-ai-agent

Open-source contract review API. Send a contract (text or PDF), get back parties, key clauses with character-offset citations, risk flags, a 0–100 safety score with an A–F grade, per-framework compliance flags, and recommendations — validated against a strict JSON schema.

Powered by Claude Opus 4.8 with adaptive thinking, structured outputs, and native PDF support.

- [Landing page & pricing](./site/index.html)
- [Roadmap](./BLUEPRINT.md)
- [Go-to-market](./GTM.md)

## Quickstart

```bash
cp .env.example .env
# fill in ANTHROPIC_API_KEY (required)
# set API_KEYS to a comma-separated allowlist for production

pip install -r requirements-dev.txt
pytest -q                      # 44 tests, no network
uvicorn api.app:app --reload --port 8000
```

## Call it

Auth disabled (dev):

```bash
curl -X POST http://localhost:8000/review \
  -H "Content-Type: application/json" \
  -d '{"contract_text": "<contract>", "jurisdiction": "US-DE", "party_role": "buyer"}'
```

Auth enabled — set `API_KEYS=client-key-1,client-key-2` then:

```bash
curl -X POST http://localhost:8000/review \
  -H "X-API-Key: client-key-1" \
  -H "Content-Type: application/json" \
  -d '{"contract_text": "<contract>"}'
```

PDF:

```bash
curl -X POST http://localhost:8000/review-pdf \
  -H "X-API-Key: client-key-1" \
  -H "Content-Type: application/json" \
  -d "{\"pdf_base64\": \"$(base64 -w0 contract.pdf)\"}"
```

## Endpoints

| Method | Path | Auth | Rate-limited |
|--------|------|------|--------------|
| `GET` | `/` | — | no |
| `GET` | `/health` | — | no |
| `POST` | `/review` | `X-API-Key` | yes |
| `POST` | `/review-pdf` | `X-API-Key` | yes |

Response shape: see [BLUEPRINT.md](./BLUEPRINT.md#api-contract). Every `KeyClause` includes server-filled `char_start` / `char_end` offsets into the source contract — null for PDFs or non-verbatim quotes. Each response also carries a server-computed `safety_score` (0–100), `letter_grade` (A–F), and `compliance_flags`.

Every response echoes an `X-Request-ID` header (honoring an inbound one if present) for log correlation, and carries hardening headers (`X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`).

## Configuration

All via env; see [.env.example](./.env.example).

| Var | Purpose | Default |
|-----|---------|---------|
| `ANTHROPIC_API_KEY` | Required. Anthropic key. | — |
| `API_KEYS` | Comma-separated client allowlist. Empty = auth disabled. | empty |
| `RATE_LIMIT_PER_MIN` | Per-IP sustained rate on `/review*`. `0` disables. | `30` |
| `RATE_LIMIT_BURST` | Token bucket capacity. | `60` |
| `TRUST_PROXY_HEADERS` | Honor `X-Forwarded-For` first hop. Set behind a proxy. | `false` |
| `CORS_ORIGINS` | Comma-separated allowed origins. Empty = CORS disabled. | empty |
| `PORT` | HTTP port. | `8000` |
| `LOG_LEVEL` | Python log level. | `INFO` |

## Deploy

### Fly.io

```bash
fly launch                                       # one-time
fly secrets set ANTHROPIC_API_KEY=sk-ant-...
fly secrets set API_KEYS=key-1,key-2
fly secrets set TRUST_PROXY_HEADERS=true         # Fly sits in front
fly deploy
fly status
curl https://<your-app>.fly.dev/health
```

### Docker

```bash
docker buildx build --platform linux/arm64 -t legal-ai-agent .
docker run -p 8000:8000 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e API_KEYS=demo-key \
  legal-ai-agent
```

The container runs as a non-root user with a `/health` HEALTHCHECK probe.

ARM64 images are built and pushed to GHCR on every `main` push via [.github/workflows](./.github/workflows).

## Security

- API key check uses `hmac.compare_digest` (constant-time).
- Rate limit bucket store is LRU-capped to bound memory.
- `X-Forwarded-For` is only trusted when `TRUST_PROXY_HEADERS=true` to prevent spoofing on direct-exposed instances.
- Contracts are processed in memory only — no persistence layer in v0.
- Citations are server-validated by exact substring match; the model can't fabricate offsets.
- The safety score and letter grade are computed server-side from the model's risks; the model is instructed to leave them null and cannot inflate the result.
- Unhandled errors return a generic `500` with no internals; every request is logged with an `X-Request-ID` for correlation.

## License

MIT — see [LICENSE](./LICENSE).
