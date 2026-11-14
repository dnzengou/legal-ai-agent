# Integrations — practical recipes

Short, copy-pasteable patterns for pulling legal-ai-agent into whatever workflow you already have. All assume you have a running deploy and either an `X-API-Key` or no auth (dev only).

> **Note on the URLs below:** `https://api.legal-ai-agent.fly.dev` is a **reference / placeholder host** for readability. Swap it for your own self-hosted URL (local `http://localhost:8000`, your Fly/Render/Cloud Run host, or whatever you deployed). See [`ONBOARDING.md`](./ONBOARDING.md) for one-click deploy paths.

- [Browser bookmarklet — review any page as a contract](#browser-bookmarklet)
- [Zero-dependency Python client](#zero-dependency-python-client)
- [cURL one-liner](#curl-one-liner)
- [Node.js (fetch)](#nodejs-fetch)
- [GitHub Action — review contract files in a PR](#github-action)
- [Slack slash command](#slack-slash-command)
- [Zapier / Make webhook](#zapier--make-webhook)
- [MCP server — expose as a tool to AI agents](#mcp-server--tool-for-ai-agents)
- [Postman collection](#postman)
- [iOS / macOS Shortcut](#ios--macos-shortcut)
- [OpenAPI spec (machine-readable)](#openapi-spec)

---

## Browser bookmarklet

Drag this to your bookmarks bar. Click it on any legalese-looking page; the selected text (or the full page body if nothing is selected) gets sent for review, and the response renders in a new tab.

```js
javascript:(function(){
  var sel = window.getSelection().toString() || document.body.innerText;
  var endpoint = 'https://api.legal-ai-agent.fly.dev/review';
  var key = prompt('X-API-Key (leave blank for dev):', '');
  fetch(endpoint, {
    method: 'POST',
    headers: Object.assign({'Content-Type':'application/json'}, key ? {'X-API-Key': key} : {}),
    body: JSON.stringify({contract_text: sel.slice(0, 500000)})
  })
  .then(function(r){return r.json();})
  .then(function(j){
    var w = window.open('', '_blank');
    w.document.title = 'legal-ai-agent review — ' + (j.safety_score ?? '?');
    w.document.body.style.cssText = 'font:14px ui-monospace,monospace;padding:2rem;max-width:960px;margin:auto;background:#0a0e14;color:#e6edf3;';
    w.document.body.innerHTML = '<h1>Score ' + (j.safety_score ?? '?') + ' · ' + (j.letter_grade ?? '?') + ' · confidence ' + (j.overall_confidence ?? '?') + '</h1><pre style="white-space:pre-wrap;background:#101620;padding:1rem;border-radius:6px;">' + JSON.stringify(j, null, 2).replace(/[<>&]/g, function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;'}[c];}) + '</pre>';
  })
  .catch(function(e){alert('legal-ai-agent error: ' + e);});
})();
```

**Minified for the bookmarklet URL:**

```
javascript:(function(){var s=getSelection().toString()||document.body.innerText;var k=prompt('X-API-Key:','');fetch('https://api.legal-ai-agent.fly.dev/review',{method:'POST',headers:Object.assign({'Content-Type':'application/json'},k?{'X-API-Key':k}:{}),body:JSON.stringify({contract_text:s.slice(0,500000)})}).then(r=>r.json()).then(j=>{var w=open('','_blank');w.document.body.style.cssText='font:14px ui-monospace,monospace;padding:2rem;max-width:960px;margin:auto;background:%230a0e14;color:%23e6edf3';w.document.body.innerHTML='<h1>Score '+j.safety_score+' · '+j.letter_grade+' · confidence '+j.overall_confidence+'</h1><pre>'+JSON.stringify(j,null,2)+'</pre>'}).catch(e=>alert(e))})();
```

Point it at your own deploy by swapping the URL.

---

## Zero-dependency Python client

Ships in [`examples/client.py`](./examples/client.py) — stdlib only, no `pip install`.

```python
from examples.client import LegalAIClient

client = LegalAIClient("https://api.legal-ai-agent.fly.dev", api_key="…")
review = client.review("This Agreement is entered into…", jurisdiction="US-DE")
print(review["safety_score"], review["letter_grade"], review["overall_confidence"])
for risk in review["risks"]:
    print(f"{risk['severity']:6} {risk['category']:30} {risk['description']}")
```

For a folder of contracts rolled up into a portfolio view: [`examples/batch_review.py`](./examples/batch_review.py).

---

## cURL one-liner

```bash
curl -X POST https://api.legal-ai-agent.fly.dev/review \
  -H "X-API-Key: $LEGAL_AI_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contract_text": "…", "jurisdiction": "US-DE", "party_role": "buyer"}' | jq .
```

PDF (base64-encoded, decoded size ≤ 32 MB):

```bash
curl -X POST https://api.legal-ai-agent.fly.dev/review-pdf \
  -H "X-API-Key: $LEGAL_AI_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"pdf_base64\": \"$(base64 -w0 contract.pdf)\"}" | jq .
```

---

## Node.js (fetch)

Native `fetch` in Node 18+:

```js
const review = await fetch("https://api.legal-ai-agent.fly.dev/review", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": process.env.LEGAL_AI_KEY,
  },
  body: JSON.stringify({
    contract_text: contractText,
    jurisdiction: "US-DE",
    party_role: "buyer",
  }),
}).then(r => r.json());

console.log(`${review.safety_score}/${review.letter_grade} · confidence ${review.overall_confidence}`);
```

---

## GitHub Action

Review any `.txt` or `.md` contract file changed in a PR, post the summary as a comment. Drop into `.github/workflows/contract-review.yml`:

```yaml
name: Contract review
on:
  pull_request:
    paths:
      - 'contracts/**/*.md'
      - 'contracts/**/*.txt'

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      - name: Review changed contracts
        env:
          LEGAL_AI_KEY: ${{ secrets.LEGAL_AI_KEY }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PR: ${{ github.event.pull_request.number }}
        run: |
          set -eu
          for f in $(git diff --name-only HEAD^ HEAD -- 'contracts/**/*.md' 'contracts/**/*.txt'); do
            body=$(jq -Rs --arg jur "US-DE" '{contract_text: ., jurisdiction: $jur}' < "$f")
            resp=$(curl -sf -X POST https://api.legal-ai-agent.fly.dev/review \
              -H "X-API-Key: $LEGAL_AI_KEY" \
              -H "Content-Type: application/json" \
              -d "$body")
            score=$(echo "$resp" | jq -r '.safety_score')
            grade=$(echo "$resp" | jq -r '.letter_grade')
            conf=$(echo "$resp"  | jq -r '.overall_confidence')
            summary=$(echo "$resp" | jq -r '.summary')
            gh pr comment "$PR" --body "**legal-ai-agent — \`$f\`** · score **$score / $grade** · confidence **$conf**\\n\\n$summary"
          done
```

Add `LEGAL_AI_KEY` to the repository's Actions secrets. First run also needs `permissions: pull-requests: write` at the job level if the repo defaults are restrictive.

---

## Slack slash command

Fly.io route that fronts the API with Slack's slash-command signature. Minimal recipe — paste into any FastAPI app you already run, or spin up a one-file app:

```python
# slack_bridge.py — deploy anywhere; set LEGAL_AI_URL, LEGAL_AI_KEY, SLACK_SIGNING_SECRET
import hashlib, hmac, os, time, urllib.request, urllib.parse, json
from fastapi import FastAPI, Form, Header, HTTPException, Request
app = FastAPI()

@app.post("/slack/review")
async def review(
    request: Request,
    x_slack_request_timestamp: str = Header(...),
    x_slack_signature: str = Header(...),
    text: str = Form(""),
):
    raw = await request.body()
    if abs(time.time() - int(x_slack_request_timestamp)) > 60 * 5:
        raise HTTPException(401, "stale")
    base = f"v0:{x_slack_request_timestamp}:{raw.decode()}"
    sig = "v0=" + hmac.new(os.environ["SLACK_SIGNING_SECRET"].encode(), base.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, x_slack_signature):
        raise HTTPException(401, "bad signature")

    body = json.dumps({"contract_text": text[:500_000]}).encode()
    req = urllib.request.Request(
        os.environ["LEGAL_AI_URL"].rstrip("/") + "/review",
        data=body,
        headers={"Content-Type": "application/json", "X-API-Key": os.environ["LEGAL_AI_KEY"]},
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        j = json.load(r)
    return {
        "response_type": "ephemeral",
        "text": f"*legal-ai-agent* · {j['safety_score']}/{j['letter_grade']} · confidence {j['overall_confidence']}\n{j['summary']}",
    }
```

Slack app config: *Slash Commands* → *Create New Command* → `/review` → request URL `https://your-bridge.example.com/slack/review`.

---

## Zapier / Make webhook

legal-ai-agent is a plain HTTP API, so any workflow tool can call it. In Zapier: *Webhooks by Zapier* → *POST*:

- **URL:** `https://api.legal-ai-agent.fly.dev/review`
- **Payload type:** JSON
- **Data:** `contract_text = <your variable>`
- **Headers:** `X-API-Key: <your key>` · `Content-Type: application/json`

Pipe the response's `safety_score`, `letter_grade`, `overall_confidence`, and `summary` into whatever action comes next (Slack message, Google Sheets row, Notion page, email).

---

## MCP server — tool for AI agents

If you build with [Model Context Protocol](https://modelcontextprotocol.io/) (Claude, ChatGPT, or Cursor as the host), expose legal-ai-agent as a tool with four lines:

```python
# mcp_server.py — stdio MCP server wrapping the legal-ai-agent API
from mcp.server.fastmcp import FastMCP
import os, urllib.request, json

mcp = FastMCP("legal-ai-agent")
BASE = os.environ["LEGAL_AI_URL"].rstrip("/")
KEY = os.environ.get("LEGAL_AI_KEY")

@mcp.tool()
def review_contract(contract_text: str, jurisdiction: str = "", party_role: str = "") -> dict:
    """Review a contract and return clauses, risks, compliance flags, recommendations, safety score, and confidence."""
    body = json.dumps({"contract_text": contract_text, "jurisdiction": jurisdiction, "party_role": party_role}).encode()
    headers = {"Content-Type": "application/json"} | ({"X-API-Key": KEY} if KEY else {})
    req = urllib.request.Request(f"{BASE}/review", data=body, headers=headers)
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)

if __name__ == "__main__":
    mcp.run()
```

Point your MCP host's config at this script. The agent now has `review_contract` as a callable tool — Claude / ChatGPT / Cursor can ask it on your behalf.

---

## Postman

Import the OpenAPI 3.1 spec directly:

1. Postman → *Import* → *Link*.
2. Paste `https://legal-ai-agent.netlify.app/openapi.json`.
3. Postman generates a full collection with request bodies pre-filled from the schema.

Insomnia, Hoppscotch, Bruno, and Thunder Client accept the same URL.

---

## iOS / macOS Shortcut

Create a Shortcut that accepts text from the Share Sheet and shows the score:

1. *Get Contents of URL* →
   - URL: `https://api.legal-ai-agent.fly.dev/review`
   - Method: POST
   - Headers: `X-API-Key = <your key>`, `Content-Type = application/json`
   - Request Body → JSON: `contract_text = Shortcut Input`
2. *Get Dictionary Value* → `safety_score`
3. *Show Notification* → `Score: <value>`

Share-sheet target it from PDF previews, Mail attachments, or any text selection.

---

## OpenAPI spec

Machine-readable API description (OpenAPI 3.1) published at every deploy:

- **Live:** [`https://legal-ai-agent.netlify.app/openapi.json`](https://legal-ai-agent.netlify.app/openapi.json)
- **Self-host:** FastAPI serves it at `/openapi.json` too (interactive explorer at `/docs`).

Code generators: `openapi-generator`, `openapi-typescript`, `oapi-codegen`, `datamodel-code-generator` — all accept the spec URL.
