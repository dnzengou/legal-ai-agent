# legal-ai-agent — Go-to-Market

**Version:** 0.1 · **Date:** 2026-06-19 · **Owner:** founder

## Mission (one line)

Cut first-pass contract review from hours to minutes for the teams who can't justify a full legal hire.

---

## ICP (Ideal Customer Profile)

Three concentric circles. Sell to the inner; market to all three.

| Tier | Who | Pain | Pricing fit |
|------|-----|------|-------------|
| **A — Wedge** | Legal ops at scale-ups (50–500 FTE), 1–3 in-house counsel handling 30–200 contracts/mo | Inbound vendor MSAs and NDAs flood counsel. Triage is manual, inconsistent, and slow. | **Pro €9.99 → Enterprise** |
| **B — Volume** | Solo GCs, fractional GCs, small law firms (≤10 attorneys) doing first-pass for SMB clients | Time-on-paper is unbillable. First read is the most expensive minute of the engagement. | **Pro €9.99** |
| **C — Long tail** | Founders, ops leads, procurement at no-GC SMBs | Sign blind or pay a lawyer to read a 4-page NDA. Both feel wrong. | **OSS self-host or Pro €9.99** |

**Disqualified:** AmLaw 200 firms (won't trust black-box AI on client work), pure-play contract lifecycle vendors (we're a feature, not a competitor).

---

## Positioning

> Open-source contract review API. Send a contract, get cited clauses and risk flags back. Self-host or use the managed tier — no vendor lock-in, no training on your data.

**Three claims, each defensible:**
1. **Cited** — every excerpt anchors to character offsets in your source. No hallucinated quotes.
2. **Open** — every prompt and parser is in the repo. Audit before you trust.
3. **Yours** — your data isn't trained on, ever. Self-host if you need the guarantee in writing.

**Anti-positioning** (what we're not):
- Not a CLM (Ironclad, LinkSquares). We don't store, redline, or workflow.
- Not a generic LLM wrapper. We have a specific schema, specific prompts, specific guardrails.
- Not legal advice. We're tooling for attorneys, not a replacement.

---

## Channels (ranked by expected CAC payback)

| # | Channel | Audience tier | Effort | Why |
|---|---------|---------------|--------|-----|
| 1 | **Show HN / Lobsters** | A, B (founders, devs, GCs who lurk there) | 1 post | Free, high-signal, our crowd. Lead with the open repo + a working demo. |
| 2 | **r/legaltech, r/legaladvice, r/Entrepreneur** | A, B, C | Weekly | Where the actual buyers complain about their workflows. |
| 3 | **Direct outreach** to ~50 named legal-ops leads on LinkedIn | A | 5/week | Tier A buyers respond to a personal note + a 30-second Loom. |
| 4 | **Content: "Reviewed in 3 minutes"** series | A, B | 1/week | Take a public template (Y Combinator SAFE, Stripe Atlas TOS) and walk through what our tool flags. SEO compounding. |
| 5 | **Conference talks** at legalops.com, CLOC | A | Quarterly | Tier A buyers gather here. One talk = 12 months of warm leads. |
| 6 | **Integrations** with Notion / Linear / Slack | A, B | Per integration | Where contracts already live. Inbound trigger reviews. |

**Not pursuing yet** (premature): paid ads, podcast sponsorships, conference sponsorships, partner channel.

---

## Messaging by tier

| Tier | Headline | Proof point |
|------|----------|-------------|
| **A** | "Cut your contract review queue 70% before counsel even sees it." | Cite a case study at +30 days. |
| **B** | "The first read of an MSA is now a coffee break." | API example + Loom. |
| **C** | "Know what you're signing. No lawyer required for the first read." | Free demo in browser. |

---

## Pricing rationale

| Tier | Price | Why |
|------|-------|-----|
| **Open Source** | €0 | Trust + funnel. The repo *is* the marketing. |
| **Pro** | €9.99/mo · 1,000 reviews | Below the "ask my boss" threshold. Single-credit-card sale. |
| **Enterprise** | Contact | Annual contract, SLA, on-prem option. €5k–€50k ACV target. |

**Why not freemium hosted?** Anthropic API costs are real (~€0.10 per long contract). Free hosted invites abuse and breaks unit economics. Free *self-hosted* gives the same trust signal without the cost.

---

## Launch sequence

### T-30 days (now)
- [x] Auth, rate limit, citations shipped
- [x] Landing page with WCAG 2.2 AA compliance
- [ ] Deploy to fly.io · verify /health · Plausible analytics
- [ ] Write 3 long-form posts (one per tier headline)
- [ ] Loom demo (90 seconds, no audio gimmicks)
- [ ] 5 friendly users for design partner feedback

### T-7 days
- [ ] Pro waitlist form live with Web3Forms (no DB needed)
- [ ] DPA + ToS + Privacy linked from footer
- [ ] Status page at status.legal-ai-agent.dev (UptimeRobot free tier)
- [ ] First 50 LinkedIn outreach messages sent

### T-day (launch)
- [ ] Show HN post 6am PT Tuesday
- [ ] LinkedIn announcement from founder account
- [ ] Email 5 design partners with the public URL
- [ ] Monitor: tail Fly.io logs, Plausible live view, X mentions

### T+7 days
- [ ] Public retro: traffic, signups, errors, what surprised us
- [ ] Ship one of: streaming endpoint, multi-contract compare, or persistence (whichever waitlist demands)

### T+30 days
- [ ] Convert 5 waitlist → paying Pro
- [ ] One Tier A pilot conversation booked
- [ ] First "Reviewed in 3 minutes" blog post live

---

## ARM — Adoption · Retention · Monetization KPIs

| Dim | Metric | T+30 target | T+90 target |
|-----|--------|-------------|-------------|
| **A**doption | Unique visitors / week | 500 | 2,500 |
|  | GitHub stars | 100 | 500 |
|  | Self-host installs (telemetry-opt-in or Docker pulls) | 50 | 250 |
|  | Pro waitlist signups | 30 | 150 |
| **R**etention | Pro 30-day active rate | n/a | 60% |
|  | OSS weekly active repos (issues + commits referencing) | 5 | 20 |
| **M**onetization | Paying Pro accounts | 5 | 30 |
|  | MRR | €50 | €300 |
|  | First Enterprise pilot booked | 0 | 1 |
|  | First Enterprise contract signed | 0 | 0 (T+180) |

**Kill criteria** (re-evaluate the wedge if any hit at T+90):
- < 10 paying Pro accounts
- < 100 GitHub stars
- Zero Enterprise pilot conversations

---

## Competitive lay-of-the-land

| Player | Their wedge | Our angle vs them |
|--------|-------------|-------------------|
| **Ironclad / LinkSquares** | Full CLM — storage, workflow, redlining | We're upstream of them. Slot into their inbox, not their database. |
| **Harvey / Hebbia** | Enterprise legal AI, opaque | We're open. You can read the prompt. |
| **ChatGPT + a custom GPT** | Free-ish, general | Structured outputs, citations, rate-limited, deployable. |
| **In-house Python script** | Free, custom | Ours is maintained, tested, has a schema, ships in a container. |

---

## Risks

| Risk | Mitigation |
|------|------------|
| LLM output is wrong on a contract that costs the customer money | "Not legal advice" disclaimer everywhere; insurance E&O policy at €1k MRR threshold. |
| Anthropic price increase squeezes Pro margin | Multi-provider abstraction roadmap item; raise Pro price in v2; OSS users unaffected. |
| Open-source clone undercuts Pro | The repo *is* the OSS clone. Pro is hosting + support, not features. |
| GDPR breach via PDF metadata | Pro tier strips PDF metadata before sending to upstream; document in DPA. |

---

## What we're NOT doing in v0 GTM

- Cold email at scale (irritation > revenue at this size)
- Paid Google / LinkedIn ads (no signal on creative yet)
- A second product (focus until 30 paying Pro)
- A free hosted tier (cost structure won't support it)
- Hiring (founder + contractors only until €5k MRR)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-06-19 | Initial GTM — ICP, channels, pricing, launch calendar, ARM KPIs |
