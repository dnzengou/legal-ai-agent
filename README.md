# legal-ai-agent

Contract review API. Send a contract (text or PDF), get back a structured review: parties, key clauses, risks, recommendations.

Powered by Claude Opus 4.8 with adaptive thinking and structured outputs.

## Quickstart

```bash
cp .env.example .env
# fill in ANTHROPIC_API_KEY

pip install -r requirements-dev.txt
pytest -q
uvicorn api.app:app --reload --port 8000
```

Then:

```bash
curl -X POST http://localhost:8000/review \
  -H "Content-Type: application/json" \
  -d '{"contract_text": "<full contract text here>", "jurisdiction": "US-DE", "party_role": "buyer"}'
```

## Endpoints

- `GET /health` — liveness
- `POST /review` — review text contract
- `POST /review-pdf` — review PDF (base64-encoded)

See [BLUEPRINT.md](./BLUEPRINT.md) for the API contract and roadmap.

## Deploy

```bash
fly launch       # one-time
fly secrets set ANTHROPIC_API_KEY=sk-ant-...
fly deploy
```

ARM64 image is built and published to GHCR on every push to `main`.

## License

See [LICENSE](./LICENSE).
