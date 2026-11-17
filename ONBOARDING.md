# Onboarding — first review in 60 seconds

Four ladders, from zero-install to self-host. Climb only as far as you need.

- [Rung 1 — Try the live demo (0 seconds, 0 install)](#rung-1--try-the-live-demo)
- [Rung 2 — Browser bookmarklet (10 seconds, 0 install)](#rung-2--browser-bookmarklet)
- [Rung 3 — cURL against your own deploy (60 seconds)](#rung-3--curl-against-your-own-deploy)
- [Rung 4 — Self-host in Docker (90 seconds)](#rung-4--self-host-in-docker)
- [What the response looks like](#what-the-response-looks-like)
- [What you've just done](#what-youve-just-done)

---

## Rung 1 — Try the live demo

[**legal-ai-agent.netlify.app**](https://legal-ai-agent.netlify.app)

The landing page carries three interactive samples that run client-side — **no signup, no API key, no network call to any model**. You'll see the score ring, letter grade, confidence pill, per-risk citations, compliance chips, and raw JSON toggle in the exact shape the live API returns.

**Try all three samples:**
1. **SaaS subscription** — uncapped liability + no DPA → F grade
2. **Mutual NDA** — perpetual confidentiality → C grade
3. **Svensk medborgarskap — överklagan** — a naturalization appeal to Migrationsverket (shows the tool works beyond contracts)

Watch the citation anchoring: findings with verbatim quotes get a green ✓ badge; findings without get downgraded. That's the glass-box: the model can't fabricate a citation without the server catching it.

---

## Rung 2 — Browser bookmarklet

Drag this to your bookmarks bar → click it on any legalese page → the selected text (or the whole page body) gets reviewed and the response renders in a new tab.

```js
javascript:(function(){var s=getSelection().toString()||document.body.innerText;var k=prompt('X-API-Key (blank for dev):','');fetch('https://api.legal-ai-agent.fly.dev/review',{method:'POST',headers:Object.assign({'Content-Type':'application/json'},k?{'X-API-Key':k}:{}),body:JSON.stringify({contract_text:s.slice(0,500000)})}).then(r=>r.json()).then(j=>{var w=open('','_blank');w.document.body.style.cssText='font:14px ui-monospace,monospace;padding:2rem;max-width:960px;margin:auto;background:%230a0e14;color:%23e6edf3';w.document.body.innerHTML='<h1>Score '+j.safety_score+' · '+j.letter_grade+' · confidence '+j.overall_confidence+'</h1><pre>'+JSON.stringify(j,null,2)+'</pre>'}).catch(e=>alert(e))})();
```

Point it at your own deploy (change the URL) if you're not using the reference host. Full bookmarklet discussion in [INTEGRATE.md](./INTEGRATE.md#browser-bookmarklet).

---

## Rung 3 — cURL against your own deploy

The API has one endpoint that matters: `POST /review`.

```bash
# (1) Point at your running deploy — localhost for dev, your Fly/Render/Cloud Run URL for prod
export LEGAL_AI_URL="http://localhost:8000"
export LEGAL_AI_KEY="dev-key"        # anything if API_KEYS is unset

# (2) Call it
curl -sS -X POST "$LEGAL_AI_URL/review" \
  -H "X-API-Key: $LEGAL_AI_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contract_text": "This Agreement shall automatically renew for successive twelve (12) month terms. Vendor liability shall be unlimited.",
    "jurisdiction": "US-DE",
    "party_role": "buyer"
  }' | jq '{safety_score, letter_grade, overall_confidence, confidence_level, risks: [.risks[] | {severity, category}]}'
```

Expected:

```json
{
  "safety_score": 60,
  "letter_grade": "D",
  "overall_confidence": 100,
  "confidence_level": "high",
  "risks": [
    {"severity": "high", "category": "uncapped_liability"},
    {"severity": "high", "category": "auto_renewal"}
  ]
}
```

PDF variant: `POST /review-pdf` with `{"pdf_base64": "..."}`. See [INTEGRATE.md](./INTEGRATE.md#curl-one-liner) and the machine-readable [OpenAPI spec](https://legal-ai-agent.netlify.app/openapi.json).

---

## Rung 4 — Self-host in Docker

Zero setup; prebuilt multi-arch image lives at GHCR.

```bash
docker run -d --name legal-ai-agent \
  -p 8000:8000 \
  -e ANTHROPIC_API_KEY=sk-ant-your-key \
  -e API_KEYS=your-chosen-key \
  ghcr.io/dnzengou/legal-ai-agent:latest

# Health check
curl -s http://localhost:8000/health
# {"status":"ok","version":"0.7.5"}

# Review something
curl -s -X POST http://localhost:8000/review \
  -H "X-API-Key: your-chosen-key" \
  -H "Content-Type: application/json" \
  -d '{"contract_text": "..."}'  | jq .safety_score
```

**One-click deploys** from the repository README:

- **Netlify** (landing page) — [Deploy to Netlify](https://app.netlify.com/start/deploy?repository=https://github.com/dnzengou/legal-ai-agent)
- **Render** (API as a service) — connect your fork; Render auto-detects the Dockerfile.
- **Fly.io** — `fly launch` picks up `fly.toml`; `fly deploy`.
- **Cloud Run** — `gcloud run deploy --image ghcr.io/dnzengou/legal-ai-agent:latest`.
- **Kubernetes / any container host** — standard, no special config.

Full deploy details in [README — Deploy](./README.md#deploy).

---

## What the response looks like

Every call returns one JSON object with this shape (full OpenAPI spec at [`/openapi.json`](https://legal-ai-agent.netlify.app/openapi.json)):

```json
{
  "summary": "Two-year SaaS subscription that auto-renews without notice...",
  "parties": ["Acme SaaS Inc.", "Buyer Corp."],
  "key_clauses": [
    {"type": "auto_renewal", "summary": "...", "text_excerpt": "...", "char_start": 24, "char_end": 112}
  ],
  "risks": [
    {
      "severity": "high",
      "category": "uncapped_liability",
      "description": "No limitation-of-liability clause — exposure unbounded.",
      "clause_ref": "§8",
      "confidence": "high",
      "provenance": {
        "text_excerpt": "Vendor liability shall be unlimited.",
        "char_start": 95, "char_end": 131,
        "anchored": true
      }
    }
  ],
  "compliance_flags": [
    {"framework": "GDPR", "status": "gap", "note": "No Article 28 DPA", "confidence": "high",
     "provenance": {"text_excerpt": "Customer personal data may be processed...", "anchored": true}}
  ],
  "recommendations": ["Add a mutual liability cap...", "Attach a GDPR-compliant DPA..."],
  "safety_score": 60,       // server-computed, 0-100
  "letter_grade": "D",      // A/B/C/D/F
  "overall_confidence": 100, // 0-100: 50 x anchor_rate + 50 x avg_self_conf
  "confidence_level": "high" // high >= 80, medium >= 60, else low
}
```

**The three server-owned numbers** — `safety_score`, `overall_confidence`, and whether each `provenance.anchored` is `true` — are computed deterministically by the server from the model's output. The model is instructed to leave them null and cannot inflate them. This is the anti-hallucination contract.

---

## What you've just done

- Called a FastAPI service that talks to Claude Opus 4.8 with adaptive thinking and structured outputs.
- Received a response whose every finding is anchored to a verbatim quote from your source (or forcibly downgraded to low confidence).
- Ground your confidence in a score the server can prove, not one the model reported.

## What next

- **Wire it in somewhere real** — [INTEGRATE.md](./INTEGRATE.md) has bookmarklet, GitHub Action, Slack, Zapier, MCP, Postman, iOS Shortcut recipes.
- **Understand the shape** — [BLUEPRINT.md](./BLUEPRINT.md) has the full API contract, architecture, and roadmap.
- **Compare honestly** — [POSITIONING.md](./POSITIONING.md) is the comparison matrix vs. ChatGPT / Claude / Gemini / Harvey / CoCounsel / Kira / Luminance / Spellbook / Ironclad.
- **Cite us in research** — [CITATION.cff](./CITATION.cff).
- **Report a vulnerability** — [SECURITY.md](./SECURITY.md) (please don't open a public issue).

## Troubleshooting

| Symptom                                       | Likely cause                            | Fix                                  |
| --------------------------------------------- | --------------------------------------- | ------------------------------------ |
| `401 Unauthorized`                            | `X-API-Key` missing or wrong            | Set `API_KEYS` env or match the header |
| `429 Too Many Requests`                       | Hit the per-IP token bucket             | Wait or raise `RATE_LIMIT_PER_MIN` |
| `413 Payload Too Large`                       | PDF > 32 MB decoded                     | Reduce / split the PDF               |
| `500 Internal server error` with `X-Request-ID` | Unhandled exception — logs have detail | Check server logs for the matching request-id |
| `confidence_level: "low"` even for clean input | Model's quotes don't match verbatim     | Expected — the server caught non-verbatim citations; retry or accept the signal |
| Import error on `anthropic`                   | Wrong Python runtime                    | Use Python 3.12; `pip install -r requirements.txt` |

## Minimum viable configuration

```bash
# .env — enough to run locally
ANTHROPIC_API_KEY=sk-ant-...     # required
# everything else is optional; sensible defaults in src/
```

Everything else is tuning. The service runs with one env variable.
