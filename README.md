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
pytest -q                      # 51 tests, no network
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

### Python client (no dependencies)

A stdlib-only client ships in [`examples/client.py`](./examples/client.py) — copy it into any project:

```python
from client import LegalAIClient

client = LegalAIClient("http://localhost:8000", api_key="client-key-1")
review = client.review("This Agreement is entered into...", jurisdiction="US-DE")
print(review["safety_score"], review["letter_grade"])   # e.g. 72 C
for risk in review["risks"]:
    print(risk["severity"], risk["category"])
```

Try it live — no signup — on the [landing page demo](./site/index.html#demo) (includes a "View raw JSON" toggle showing the exact response).

**Example app — portfolio batch review:** [`examples/batch_review.py`](./examples/batch_review.py) reviews a folder of contracts and rolls the per-contract safety scores into a portfolio view (average grade, critical contracts, common compliance gaps):

```bash
python examples/batch_review.py http://localhost:8000 --key client-key-1 --dir ./contracts_txt
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

Two things to deploy: **the API** (Python, Anthropic key required, long-running) and **the landing page** (static HTML + CSS, no build). They ship to different hosts.

### API — Fly.io *(recommended)*

The `fly.toml` and `Dockerfile` are pre-wired for a 512 MB shared-CPU machine in `iad`.

```bash
fly launch                                       # one-time — accepts fly.toml
fly secrets set ANTHROPIC_API_KEY=sk-ant-...
fly secrets set API_KEYS=key-1,key-2
fly secrets set TRUST_PROXY_HEADERS=true         # Fly sits in front
fly deploy
fly status
curl https://<your-app>.fly.dev/health
```

### API — Docker (any container host: Railway, Render, ECS, Cloud Run, self-host)

```bash
docker buildx build --platform linux/arm64 -t legal-ai-agent .
docker run -p 8000:8000 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e API_KEYS=demo-key \
  legal-ai-agent
```

Non-root user, `/health` HEALTHCHECK probe. ARM64 + AMD64 images are built and pushed to **GHCR** on every push to `main` via [.github/workflows/ci.yml](./.github/workflows/ci.yml) — no config needed. Image lands at `ghcr.io/dnzengou/legal-ai-agent:latest`.

### Landing page — pick one

The `site/` folder is a self-contained static page. Deploy it anywhere; three zero-config paths, easiest first:

**GitHub Pages *(auto, no signup)*** — [.github/workflows/pages.yml](./.github/workflows/pages.yml) publishes `site/` on every push to `main` that touches it. One-time setup: on GitHub → **Settings → Pages → Source: GitHub Actions**. Live at `https://<owner>.github.io/legal-ai-agent/`.

**Netlify *(free tier, connect via UI)*** — `netlify.toml` in the repo root sets `publish = "site"` and no build command. At [netlify.com](https://netlify.com) → *Add new site* → *Import from Git* → pick this repo → Deploy. Auto-deploys on every push.

**Vercel *(same idea)*** — `vercel.json` is configured; a zero-dep `package.json` copies `site/` → `dist/` so any forced build succeeds. At [vercel.com](https://vercel.com) → *Add New… → Project* → pick this repo → Deploy. If the dashboard forces a framework preset the deploy will fail; set **Settings → Build & Development → Framework Preset: Other** to let `vercel.json` take effect, then remove `"git": { "deploymentEnabled": false }` from `vercel.json`.

**Any static host** — `site/` is two files. Copy them to S3 + CloudFront, Cloudflare Pages, Surge, an nginx box, etc.

### One-command deploy (bird's-eye)

| Target | Command / step | Cost | Notes |
|--------|----------------|------|-------|
| API → Fly.io | `fly deploy` | free tier available | The product's home. Native ARM64. |
| API → Any Docker host | `docker run ghcr.io/dnzengou/legal-ai-agent:latest` | depends | Auto-pushed to GHCR. |
| Landing → GitHub Pages | Push to `main` (workflow ships) | free | Enable in repo Settings → Pages once. |
| Landing → Netlify | Import repo in Netlify UI | free tier | `netlify.toml` handles config. |
| Landing → Vercel | Import repo in Vercel UI | free tier | `vercel.json` handles config; see caveat above. |

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
