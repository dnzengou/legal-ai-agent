# Why (and when) to use `legal-ai-agent`

> Written to answer "why should I use this instead of ChatGPT / Claude.ai / Gemini / [enterprise legal AI]?" without invention or persuasion. Every claim about `legal-ai-agent` links back to specific code and tests in this repo. Claims about other tools are limited to what is publicly documented and verifiable; cells we can't verify are marked `—`.

## The honest one-liner

`legal-ai-agent` is a small, open-source **JSON API** for first-pass contract and legal-document review. It is neither a chat product nor an enterprise legal platform. It gives developers a way to embed structured, source-cited legal analysis into their own product with a **glass-box provenance guarantee** — the model's findings are anchored to verbatim excerpts from the source, and unquotable findings are auto-downgraded to low confidence.

If you don't need to embed this in something, you don't need this tool.

## Who this is for

- **Developers / founders / small teams** who want to add contract review to their own product (SaaS onboarding, marketplace vendor screening, procurement gate).
- **Compliance/procurement leads** who want a per-request API to run over incoming vendor contracts.
- **Independent lawyers, paralegals, consultants** who want to script batch analyses without paying enterprise seat licenses.
- **Anyone who needs auditability** — the code, prompts, and scoring are all in this repo (MIT); every finding cites its source excerpt; the safety score and confidence score are computed server-side, not taken from the model.

## Who this is **not** for

- People who want a chat product — use [claude.ai](https://claude.ai), [chatgpt.com](https://chatgpt.com), or [gemini.google.com](https://gemini.google.com). They handle single-document analysis fine at zero setup cost.
- Big Law firms with millions in AI budget and hundreds of matter-workflows — look at Harvey, CoCounsel, Ironclad, Kira, Luminance. These are integrated platforms with legal-research databases, matter management, redlining, e-signature, and enterprise support — none of which this tool provides.
- Anyone who wants a substitute for an attorney. It isn't one. See the disclaimers.

## Concrete differences vs off-the-shelf LLM chat apps

These are things `legal-ai-agent` does that a chat prompt in ChatGPT / Claude.ai / Gemini does not, by default:

| Capability | How this repo delivers it |
|---|---|
| **Strict, typed JSON output** — same schema every time, validated with Pydantic | [`src/schema.py`](./src/schema.py); uses `client.messages.parse()` |
| **Character-offset citation anchoring** — every quoted clause verified in the source, non-verbatim quotes are flagged with null offsets | [`src/agent.py`](./src/agent.py) `_anchor_clauses`; [`tests/test_anchoring.py`](./tests/test_anchoring.py) |
| **Server-computed safety score** — deterministic, computed from the risks (not taken from the model) | [`src/scoring.py`](./src/scoring.py) |
| **Provenance-enforced anti-hallucination gate** — every risk/compliance flag must attach a verbatim source excerpt; unquotable findings are auto-downgraded to `low` confidence; overall confidence drops accordingly | [`src/confidence.py`](./src/confidence.py); [`tests/test_confidence.py`](./tests/test_confidence.py) |
| **Per-framework compliance flags** in a strict shape (GDPR / CCPA / HIPAA / PCI-DSS / SOC2 / any) | schema in [`src/schema.py`](./src/schema.py) |
| **Embeddable API** — one `POST /review` endpoint, one `POST /review-pdf`, key-auth, per-IP rate limiting | [`api/app.py`](./api/app.py), [`api/auth.py`](./api/auth.py), [`api/rate_limit.py`](./api/rate_limit.py) |
| **Self-hostable** — 72-test test suite (no network), Docker image on GHCR, `fly.toml` for Fly.io, `netlify.toml` for the landing | [`Dockerfile`](./Dockerfile), [`fly.toml`](./fly.toml), CI in [`.github/workflows`](./.github/workflows) |
| **BYO Anthropic key** — the tool costs whatever the underlying model calls cost, plus your hosting | [`README.md#configuration`](./README.md) |

Off-the-shelf chats (Claude.ai / ChatGPT / Gemini) can produce prose that *looks* similar, but:

- The output is unstructured — you'd write your own parser.
- Nothing verifies that quoted text is actually in your document — the model can (and sometimes does) invent citations.
- No numeric score you can trust as a signal, because nothing computes it deterministically.
- No API contract — you can't gate a business flow on a specific response shape.

None of that makes chat products bad — they're excellent for a one-off skim. It just makes them the wrong shape for an integrated legal-review feature.

## Concrete differences vs dedicated legal-AI platforms

Dedicated legal-AI platforms (**Harvey**, **CoCounsel** by Thomson Reuters / Casetext, **Ironclad AI**, **Kira Systems**, **Luminance**, **Spellbook**, **Lawgeex**) do many things this repo doesn't:

- **Legal-research databases** — case-law search, statute look-up, docket tracking. `legal-ai-agent` has none — it only knows what the LLM was trained on. (See [Known limits](#known-limits).)
- **Redlining / track-changes** editing loops inside Word / Google Docs.
- **Matter and contract-lifecycle management** — pipelines, approvals, e-signature.
- **Domain-fine-tuned models** on proprietary legal corpora.
- **Enterprise features** — SSO, audit logs at rest, SOC 2 Type II reports, per-jurisdiction data residency.

Those platforms are the right choice if you need any of that. What `legal-ai-agent` gives back in exchange for not having any of it: **it's inspectable, embeddable, pay-as-you-go on LLM tokens, and every finding is provably anchored to your source**.

## Comparison matrix

Cells marked ✓/✗ are those we can verify from public documentation or from this repo's code. Cells marked `—` are unknown to us or vary by tier/plan; **please verify with the vendor** before relying on any judgment about their products.

| Capability | `legal-ai-agent` (this repo) | ChatGPT / Claude.ai / Gemini (paste-and-ask) | Harvey / CoCounsel / Kira / Ironclad / Luminance (enterprise legal AI) |
|---|---|---|---|
| **Interface** | JSON REST API + optional static demo | Chat UI (+ generic API on some) | Enterprise app + integrations (Word, iManage, etc.) |
| **Strict JSON output schema** | ✓ Pydantic, `messages.parse()` | ✗ prose by default (schemas possible via prompting, no guarantee) | — (varies by product / API tier) |
| **Verbatim citation anchoring** | ✓ character offsets, verified server-side | ✗ | — some do "clause-level attribution"; verify per product |
| **Anti-hallucination provenance gate** | ✓ unanchored findings auto-downgraded to `low` | ✗ | — some do "grounding" or "retrieval-augmented" but implementation varies |
| **Deterministic scoring** (safety + confidence) | ✓ server-computed, not from model | ✗ | — |
| **Open source (MIT)** | ✓ | ✗ | ✗ |
| **Self-hostable** | ✓ Docker, Fly.io | ✗ | ✗ (typically SaaS) |
| **Per-request pricing** (BYO LLM key) | ✓ pay for LLM tokens + hosting | Free tier + per-seat/per-request | Per-seat enterprise contracts (typically annual, sales-led) |
| **Setup to first review** | Clone repo → `pip install -r` → `ANTHROPIC_API_KEY=…` → `uvicorn` (minutes) | Open browser, paste (seconds) | Sales cycle, procurement, onboarding (weeks–months) |
| **Legal-research database** (case law, statutes) | ✗ — model knowledge only | ✗ | ✓ typically included; the main reason to pay |
| **Document generation** (NDAs, MSAs, contracts) | ✗ | ✓ (via prompt) | ✓ template libraries + generation |
| **Redlining / track-changes editing** | ✗ | ✗ | ✓ (Spellbook, Ironclad, Harvey) |
| **Contract lifecycle management (CLM)** | ✗ | ✗ | ✓ (Ironclad, DocuSign CLM) |
| **Enterprise features** (SSO, audit, SOC 2) | ✗ (add yourself if self-hosted) | ✓ on enterprise tiers | ✓ typically standard |
| **Domain-fine-tuned model** | ✗ (uses general-purpose Claude Opus 4.8) | ✗ | — some vendors claim fine-tuning; independent verification varies |
| **Handles PDFs** | ✓ via Claude's native document blocks | ✓ (varies by product) | ✓ |

### Reading the matrix

- If your row of interest is `Interface`, `Setup to first review`, or `Open source / self-hostable` — `legal-ai-agent` is different from both alternatives in a way that matters to some builders.
- If your row is `Legal-research database`, `Redlining`, or `Contract lifecycle management` — the enterprise platforms are the right pick. Don't bother with this tool.
- If your row is "I just want to skim one document" — a chat product is the right pick. Don't set up a server for that.

## When to pick each option

Concrete decision rules, not marketing:

1. **You have one contract, once, and just want to understand it.** → Paste it into [Claude.ai](https://claude.ai) or ChatGPT / Gemini. Free (with a tier), ~30 seconds. No need to set anything up.
2. **You're a Big Law firm or in-house legal team of 20+ managing thousands of matters.** → Trial Harvey, CoCounsel, or Ironclad. Their integrations with your document system, matter management, and legal research are the value; the LLM is a small part.
3. **You're building a product that needs contract review as a feature** (e.g. onboarding-flow risk check, marketplace vendor screening, procurement gate) **and you want structured, source-cited output over a stable API**. → `legal-ai-agent` is designed for this. Alternative: build the same thing yourself over the Anthropic or OpenAI API — this repo just saves you the schema, prompt, anchoring logic, deterministic scoring, and anti-hallucination gate.
4. **You're an independent lawyer / consultant / paralegal who wants to script batch reviews over hundreds of documents without paying per-seat.** → `legal-ai-agent` + the [`examples/batch_review.py`](./examples/batch_review.py) portfolio example fit this. So does calling Claude / OpenAI directly.
5. **You care about auditability / are wary of hallucination.** → Any tool where you cannot inspect the prompt, the scoring, and the source anchoring is a black box. `legal-ai-agent` is a glass box because it has to be — the code is here, the tests prove the guarantees.

## Known limits

Being explicit so nobody is surprised:

- **Not a lawyer, not legal advice.** Every response ships with a disclaimer; every review should be verified by a qualified attorney before you act on it.
- **No legal-research database.** The model knows what it was trained on. It does not query current case law, statutes, or dockets. For jurisdiction-specific research, use CoCounsel / Westlaw / Lexis or the equivalent in your jurisdiction.
- **Model knowledge cutoff and jurisdiction bias.** The underlying model's training data has a date cutoff and is predominantly English / US-centric with strong EU coverage; less strong on non-EU civil-law jurisdictions. Always pass the `jurisdiction` hint and treat outputs outside the model's strong regions as advisory.
- **No document generation, no lifecycle management, no e-signature.** Those are features of other categories.
- **No fine-tuned legal model.** Uses general-purpose Claude Opus 4.8. The [ai-legal-claude](https://github.com/zubair-trabzada/ai-legal-claude) fork includes 16 domain skills; this repo deliberately stays small.
- **PDF anchoring caveat.** The character-offset anchoring runs against plain text. For PDF input, the excerpts are recorded but offsets are null and confidence is honestly reported as lower (since we can't verify at the source-string level without OCR/extraction on our side).
- **You bring your own Anthropic API key.** Your queries go directly to Anthropic under your key; we don't proxy or persist your contracts.

## What "verifiable" means here

Every capability claim about this repo can be reproduced by:

- `pytest -q` — 72 tests, all green, no network required
- `curl -X POST http://localhost:8000/review …` — the actual response shape
- Reading `src/*.py` — the prompt, the schema, the scoring, the anchoring, the confidence gate all live in <500 lines total
- Trying the [live demo](https://legal-ai-agent.netlify.app) — click any sample and inspect the raw JSON response

If any claim in this document turns out to be false, [open an issue](https://github.com/dnzengou/legal-ai-agent/issues/new) — treated as a bug, not a debate.
