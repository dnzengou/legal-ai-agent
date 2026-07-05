# legal-ai-agent — Blueprint

**Version:** 0.6.1
**Date:** 2026-06-28
**Status:** v0 scaffold + auth + rate limit + citations + CORS + landing page + GTM + safety scoring + compliance flags + prod hardening + interactive demo + Python client

## Mission

Reduce hours-to-minutes for first-pass contract review: ingest a contract, return extracted clauses, risk flags, and a summary that a junior associate would otherwise produce.

## Scope (v0)

- POST `/review` — accept contract text, return structured review
- POST `/review-pdf` — accept base64 PDF, return structured review
- GET `/health` — liveness probe

Out of scope for v0: persistence, multi-document comparison, redlining, user accounts.

## Architecture

```
client → FastAPI (api/app.py)
       → LegalAgent.review() (src/agent.py)
       → Anthropic SDK (claude-opus-4-8, adaptive thinking, effort: high)
       → output_config.format = json_schema → typed response
```

## Roadmap

- [x] Scaffold project structure (R-squared compliant)
- [x] FastAPI app with `/health`, `/review`, `/review-pdf`
- [x] LegalAgent with structured outputs via `messages.parse()`
- [x] PDF ingestion via Claude native document block
- [x] Dockerfile (ARM64 multi-arch)
- [x] fly.toml (512mb shared-cpu machine)
- [x] GitHub Actions CI → GHCR
- [x] Smoke tests with mocked Anthropic client
- [ ] Streaming endpoint for long contracts (`/review-stream`)
- [x] Rate limiting (per-IP, in-memory token bucket) — env-tunable burst/refill, trusts `X-Forwarded-For` only when `TRUST_PROXY_HEADERS` is set
- [ ] Persistent review history (SQLite → Postgres)
- [ ] Multi-contract comparison endpoint
- [x] Citations/quote-anchoring to source text — server-filled `char_start`/`char_end` on each key clause via exact substring match (text path only; PDFs leave offsets null)
- [x] Safety score (0–100) + letter grade (A–F) — server-computed deterministically from risks (`src/scoring.py`); never trusted from the model
- [x] Compliance flags — model-assessed per-framework status (GDPR/CCPA/HIPAA/PCI-DSS/SOC2) with notes
- [x] Production hardening — request-id tracing, access logging with latency, security headers, GZip, sanitized catch-all 500, root `/` endpoint
- [x] Auth (API key middleware) — `X-API-Key` header, env-configured allowlist, constant-time compare
- [x] CORS — env-controlled allowed-origin list (`CORS_ORIGINS`), `GET`/`POST`/`OPTIONS`, no credentials
- [x] Landing page (`site/`) — WCAG 2.2 AA, semantic HTML, prefers-color-scheme/reduced-motion/forced-colors, 3-tier pricing
- [x] GTM playbook ([GTM.md](./GTM.md)) — ICP, channels, T-30→T+30 launch calendar, ARM KPIs

## Distribution Channels

| Channel | Status | Surface |
|---------|--------|---------|
| Python source (clone + pip) | ✅ | `requirements.txt`, `uvicorn api.app:app` |
| Docker image (GHCR, ARM64) | ✅ | CI on push to `main` |
| Fly.io managed deploy | ✅ | `fly.toml`, `fly deploy` |
| Landing page + live demo | ✅ | `site/index.html` (interactive sample review, WCAG AA) |
| Python client (copy-paste) | ✅ | `examples/client.py` — stdlib-only, no deps |
| GitHub releases | 🔲 | tag-on-merge workflow planned |
| Python SDK (`pip install legal-ai-agent`) | 🔲 | packaged wrapper (client exists as `examples/client.py`) |
| Hosted managed tier (Pro €9.99/mo) | 🔲 | waitlist live, billing pending |

## API contract

### POST /review

Request:
```json
{
  "contract_text": "string",
  "jurisdiction": "string (optional, e.g. 'US-DE', 'EU')",
  "party_role": "string (optional, e.g. 'buyer', 'vendor')"
}
```

Response:
```json
{
  "summary": "string",
  "parties": ["string"],
  "effective_date": "string|null",
  "term": "string|null",
  "key_clauses": [
    {
      "type": "string",
      "summary": "string",
      "text_excerpt": "string",
      "char_start": "int|null (server-filled offset into contract_text; null on PDFs or non-verbatim quotes)",
      "char_end": "int|null"
    }
  ],
  "risks": [
    { "severity": "low|medium|high", "category": "string", "description": "string", "clause_ref": "string" }
  ],
  "compliance_flags": [
    { "framework": "GDPR|CCPA|HIPAA|PCI-DSS|SOC2|...", "status": "compliant|gap|not_applicable|unclear", "note": "string" }
  ],
  "recommendations": ["string"],
  "safety_score": "int 0-100 (server-computed from risks)",
  "letter_grade": "A|B|C|D|F (server-derived from safety_score)"
}
```

### POST /review-pdf

Same response shape; request body:
```json
{
  "pdf_base64": "string",
  "jurisdiction": "string (optional)",
  "party_role": "string (optional)"
}
```

## Quality (RRSS)

- **Robust:** Pydantic validation at FastAPI boundary; structured outputs prevent malformed JSON
- **Reliable:** `messages.parse()` retries on schema validation failures
- **Solid:** No half-features — every roadmap [x] is fully wired end-to-end
- **Stable:** No backwards-incompat changes within v0.x
- **Resistant:** Anthropic SDK auto-retries 429/5xx; HTTP errors mapped to FastAPI exceptions
- **Scalable:** Stateless; Fly.io can scale to N machines behind one IP
- **Secure:** API key from env only; no secrets logged; PDF inputs size-capped at 32MB; constant-time key compare; rate limit before auth; CORS opt-in only; landing page targets WCAG 2.2 AA (a11y == inclusion is a security/UX requirement, not a nice-to-have)
- **Systematic:** One agent class, one entrypoint, no parallel codepaths

## Changelog

| Version | Date       | Changes |
|---------|------------|---------|
| 0.1.0   | 2026-06-15 | Initial scaffold: contract review agent, FastAPI, Docker ARM64, Fly.io, CI |
| 0.2.0   | 2026-06-17 | API key auth on `/review*` via `X-API-Key`; `API_KEYS` env allowlist; `/health` stays open |
| 0.3.0   | 2026-06-18 | Per-IP token bucket rate limit on `/review*`; `RATE_LIMIT_PER_MIN`/`RATE_LIMIT_BURST`/`TRUST_PROXY_HEADERS` env |
| 0.4.0   | 2026-06-19 | Citations: `char_start`/`char_end` on each `KeyClause`, server-filled via exact substring match against source text |
| 0.5.0   | 2026-06-19 | Landing page (`site/`, WCAG 2.2 AA), GTM playbook, CORS via `CORS_ORIGINS`, README rewrite, Distribution Channels table |
| 0.6.0   | 2026-06-28 | Safety score (0–100) + letter grade (A–F) computed server-side from risks; per-framework compliance flags; production hardening (request-id tracing, access logs, security headers, GZip, sanitized 500, root `/`); fixed corrupted Dockerfile (was building the Node frontend, not the FastAPI service) |
| 0.6.1   | 2026-06-28 | Commercial low-hanging fruit: interactive **live demo** on the landing page (client-side sample review — score ring, A–F grade, risk badges, compliance chips; verified light/dark, WCAG AA); refreshed landing value props + API example to show `safety_score`/`letter_grade`/`compliance_flags`; **dependency-free Python client** (`examples/client.py`) + 7 tests; `X-Request-ID` now echoed on sanitized 500s |
# Nexus Legal — Blueprint v4.0

> "ChatGPT for Legal Work" — lean, chat-first, accessible, installable AI legal platform.
> Last updated: 2026-05-19 · Commits: `c448851`, `80cf057` · Live: https://legal-ai-agent-fawn.vercel.app

---

## 1. Vision

A single-screen experience where lawyers, founders, and freelancers drop a contract and get instant, structured legal analysis. No navigation overhead. Just: upload → ask → act.

Inspired by Harvey AI (depth of analysis), Claude.ai (UX simplicity), and Perplexity (cited, structured answers).

---

## 2. Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript + Vite | 19 / 5.x / 7.x |
| Styling | Tailwind CSS + shadcn/ui + HSL design tokens | v3 |
| Routing | React Router (nested routes pattern) | v7 |
| State | TanStack Query + tRPC | v5 / v11 |
| Backend | Hono (serverless-ready) | v4 |
| Database | Drizzle ORM + MySQL (optional) | v0.45 |
| Auth | Kimi OAuth 2.0 + JWT (skippable in demo) | — |
| Deploy | Vercel (Vite SPA + Hono serverless API) | — |
| PWA | vite-plugin-pwa + Workbox | v0.21.2 |

---

## 3. File Structure

```
Kimi_Agent_LegalAI_Build/
├── src/
│   ├── pages/
│   │   ├── Chat.tsx          ← PRIMARY page (route "/")
│   │   ├── Documents.tsx     ← Document library (/documents)
│   │   └── Settings.tsx      ← Config + AI keys (/settings)
│   ├── components/
│   │   ├── AppLayout.tsx     ← 3-item sidebar nav
│   │   ├── ErrorBoundary.tsx
│   │   └── NeuralBackground.tsx (retained, not rendered in v3)
│   ├── providers/
│   │   └── trpc.tsx          ← tRPC React client + QueryClient
│   ├── hooks/
│   │   └── useAuth.ts        ← Kimi OAuth session hook
│   ├── App.tsx               ← Route tree (nested routes)
│   └── index.css             ← Full design system
├── api/
│   ├── routers/
│   │   ├── chat.ts           ← Intent engine + 11 response generators
│   │   ├── document.ts       ← Upload / list / delete
│   │   ├── contract-review.ts← 5-agent CoT pipeline
│   │   ├── batch-review.ts   ← N-parallel portfolio assessment
│   │   ├── generate.ts       ← NDA / Terms / Privacy / Agreement
│   │   └── [auth, analysis, analytics, ethical, report, aiEngine, ...]
│   ├── router.ts             ← AppRouter (all routers merged)
│   ├── middleware.ts          ← createRouter, authedQuery, publicQuery
│   ├── boot.ts               ← Hono Node server (npm run dev)
│   └── index.ts              ← Vercel serverless entry (export default)
├── db/
│   ├── schema.ts             ← Drizzle schema (all tables)
│   └── index.ts              ← MySQL connection pool
├── public/
│   ├── manifest.webmanifest  ← PWA manifest
│   └── icons/
│       └── icon.svg          ← App icon (legal scale, teal/navy)
├── vite.config.ts            ← VitePWA + Workbox + path aliases
├── vercel.json               ← Rewrite rules (API → index.ts, SPA fallback)
├── package.json              ← Dependencies incl. vite-plugin-pwa
└── BLUEPRINT.md              ← This file
```

---

## 4. Routes

```
/          → Chat  (primary — always shown first)
/documents → Document library
/settings  → Settings + AI engine config
/login     → Kimi OAuth login page
/landing   → Marketing page
*          → NotFound
```

Route structure (App.tsx):
```tsx
<Routes>
  <Route path="/landing" element={<Landing />} />
  <Route path="/login"   element={<Login />} />
  <Route path="*" element={
    <AppLayout>                         ← sidebar always visible
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"          element={<Chat />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/settings"  element={<Settings />} />
          <Route path="*"          element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppLayout>
  } />
</Routes>
```

---

## 5. Chat — Core Feature (src/pages/Chat.tsx)

### Intent Detection → Response (api/routers/chat.ts)

```
User message
  → detectIntent()   (regex on lowercased message)
  → buildResponse()  (dispatches to 11 generators)

Intent          Trigger keywords                        Generator
──────────────────────────────────────────────────────────────────
review          review / analyze / assess               responseForReview()
risk            risk / danger / red flag / warn         responseForRisk()
compliance      comply / GDPR / CCPA / HIPAA            responseForCompliance()
plain           plain / explain / simple / in english   responseForPlain()
negotiate       negotiat / counter / amend / pushback   responseForNegotiate()
missing         missing / lack / protect / forgot       responseForMissing()
generate_nda    generate + nda / non-disclosure         responseForGenerate()
generate_terms  generate + terms / tos                  responseForGenerate()
generate_privacy generate + privacy / data policy       responseForGenerate()
generate_agreement generate + agreement / msa / sow     responseForGenerate()
general         (everything else)                       responseForGeneral()
```

### 5-Agent CoT Pipeline

```
Input → Phase 1: classify document type
      → Phase 2: 5 agents PARALLEL
          [20%] Clause Analyst     20 clause types, completeness 0–5
          [25%] Risk Assessor      weighted score per clause
          [20%] Compliance Checker GDPR Art.28, CCPA, IRS, state law
          [15%] Terms Mapper       obligations + deadlines
          [20%] Recommendations    P0–P4 priorities, fix language
      → Phase 3: aggregate → Safety Score + Grade
```

### Analysis Mode Selector (header dropdown)

| Value | Label | What it does |
|-------|-------|-------------|
| `auto` | Auto-detect | Intent from keywords |
| `contract_review` | Contract Review | Full 5-agent + score |
| `risk_assessment` | Risk Assessment | Clause-by-clause risk |
| `compliance_check` | Compliance Check | GDPR/CCPA/IRS gaps |
| `plain_english` | Plain English | Legalese → readable |
| `negotiate` | Negotiate | Counter-proposals + email |
| `missing_protection` | Missing Protections | Gap finder |

### Chat UI Features

- **6 quick-action cards** — empty state, each fires a preset prompt
- **Drag & drop + click upload** — PDF, TXT, MD, DOCX attached as context
- **Document pill** — shows filename + size, removable with ×
- **Typewriter effect** — adaptive speed (3–12ms/chunk based on length)
- **Score gauge** — SVG circle with gradient stroke (green→amber→red), ARIA-labeled
- **Typing indicator** — 3 bouncing teal dots, `role="status"`
- **Per-message actions** — Copy to clipboard, Save as .md download
- **Citation cards** — BookOpen icon + reference string
- **Session URL** — `?s=<uid>` added on load for shareability
- **Analysis mode hint** — prepended to message when not "auto"
- **Auto-scroll** — smooth scroll to bottom on new message

### tRPC call shape

```typescript
trpc.chat.send.mutate({
  message: string,              // user text (+ mode prefix if set)
  documentContent?: string,     // full text of attached file
  documentName?: string,        // filename for context
  conversationHistory?: Array<{ role: "user"|"assistant", content: string }>,
})
// returns: { role, content, intent, processingTime, timestamp }
```

---

## 6. Sidebar (src/components/AppLayout.tsx)

```
┌─────────────────┐
│  ⚖ Nexus Legal  │  ← logo + collapse toggle (PanelLeft icon)
│      AI         │
├─────────────────┤
│  + New Chat     │  ← navigates to "/"
├─────────────────┤
│  💬 Chat        │  ← active: teal bg + dot indicator
│  📄 Documents   │
│  ⚙  Settings   │
├─────────────────┤
│  [avatar] User  │  ← name + email + logout
│  email@...  [→] │
└─────────────────┘
```

- Collapsed mode: 60px wide, icons only, tooltips via `aria-label`
- Expanded mode: 210px
- Top radial glow: `rgba(0,204,204,0.07)` gradient at top of sidebar
- `role="navigation"` + `aria-current="page"` on active item
- `id="main-content"` on `<main>` for skip-link compatibility

---

## 7. Design System (src/index.css)

### Color Palette — all contrast verified against #080f1a

| Token | HSL | Hex approx | Contrast | Use |
|-------|-----|------------|----------|-----|
| `--background` | 220 28% 5% | `#080f1a` | — | Main bg |
| `--card` | 220 32% 9% | `#0e1b2e` | — | Card bg |
| `--sidebar-background` | 222 36% 4% | `#060c18` | — | Sidebar |
| `--foreground` | 192 40% 94% | `#E4F5F4` | ~18:1 ✅ | Primary text |
| `--muted-foreground` | 210 22% 62% | `#8da4b8` | ~5.8:1 ✅ | Labels, meta |
| `--primary` | 178 100% 40% | `#00CCCC` | ~8.2:1 ✅ | Teal brand |
| `--border` | 216 32% 19% | `#1f3044` | — | Borders |
| `--destructive` | 2 72% 58% | `#e05555` | ~4.6:1 ✅ | Errors |

All text colors meet **WCAG AA** (4.5:1 for body, 3:1 for UI components).

### Typography

- UI body: `Inter` (system-ui fallback)
- Code, scores, timestamps: `JetBrains Mono`
- Gradient heading: `.text-gradient-teal` (linear-gradient teal → aqua)

### Badge Classes

```css
.badge-high     /* #f87171 red   on rgba(239,68,68,0.15)  */
.badge-medium   /* #fbbf24 amber on rgba(245,158,11,0.15) */
.badge-low      /* #34d399 green on rgba(16,185,129,0.15) */
.badge-contract /* #00CCCC teal  on rgba(0,204,204,0.12)  */
.badge-nda      /* #c4b5fd violet */
```

### Animations

| Name | Duration | Use |
|------|----------|-----|
| `fadeIn` | 0.28s ease-out | Messages, cards |
| `slideUp` | 0.22s ease-out | Dropdowns |
| `scaleIn` | 0.2s ease-out | Mode picker |
| `typingDot` | 1.4s ∞ | Typing indicator |
| `shimmer` | 1.5s linear ∞ | Skeletons |
| `pulseGlow` | 2.4s ∞ | Score gauge ring |

### Surface Utilities

```css
.glass-card      /* blur(20px) + translucent navy */
.surface-1       /* hsl(220 32% 9%) + border */
.surface-2       /* hsl(220 30% 12%) + border */
.glow-teal       /* 0 0 16px rgba(0,204,204,0.12) */
.glow-teal-md    /* 0 0 24px rgba(0,204,204,0.22) */
.pwa-install-badge /* teal pill label */
.drag-active     /* dashed teal border + faint bg */
.font-mono-data  /* JetBrains Mono */
.typing-dot      /* bouncing dot (staggered delay via :nth-child) */
.skeleton        /* shimmer gradient */
```

---

## 8. Database Schema (db/schema.ts)

```typescript
users           id, unionId, name, email, avatar, role, timestamps
aiEngines       id, name, provider, model, apiKey, baseUrl, temp, maxTokens, isDefault, userId
documents       id, userId, title, content, type, status, fileUrl, fileSize, timestamps
chatSessions    id, userId, title, documentId, engineId, messageCount, timestamps  ← NEW v3
chatMessages    id, sessionId, role, content, analysisType, analysisResult,        ← NEW v3
                citations(json), tokenCount, createdAt
contractReviews id, documentId, userId, safetyScore, letterGrade,
                clauseAnalysis, riskAssessment, complianceFlags,
                obligationsMap, recommendations, plainEnglish,
                negotiationStrategy, missingProtections, status, processingTime
analyses        id, documentId, type, status, result, summary, confidence
precedents      id, title, citation, court, jurisdiction, date, summary, fullText, tags
statutes        id, title, code, jurisdiction, section, description, fullText, category
judgments       id, title, caseNumber, court, date, parties, summary, fullText, holding
ethicalReviews  id, documentId, biasScore, fairnessScore, privacyScore, concerns
reports         id, userId, type, entityId, content, safetyScore, fileUrl
activityLog     id, userId, action, entityType, entityId, metadata
```

---

## 9. Scoring

### Contract Safety Score (0–100 → grade A–F)

```
Start: 100

Deductions:
  −15  unlimited liability exposure
  −12  no data protection / GDPR article 28 missing
  −10  no liability cap
  −10  missing IP ownership clause
  −8   missing dispute resolution
  −8   missing force majeure
  −8   auto-renewal window < 60 days
  −5   no payment terms
  −5   missing confidentiality clause
  −3   each additional uncovered risk

Grades:
  90–100 = A  (low risk)
  80–89  = B  (minor revisions)
  70–79  = C  (moderate — negotiate)
  60–69  = D  (significant issues)
  < 60   = F  (high risk — do not sign)
```

### Clause Risk Score

```
Score = (Severity × 0.40) + (Likelihood × 0.25) + (Financial × 0.20) + (Asymmetry × 0.15)

🔴 High   7.0–10.0
🟡 Medium 4.0–6.9
🟢 Low    1.0–3.9
```

---

## 10. API Routers

### chat.ts — `trpc.chat.send`
Input: `{ message, documentContent?, documentName?, conversationHistory? }`
Output: `{ role, content, intent, processingTime, timestamp }`

### generate.ts — `trpc.generate.create`
Input: discriminated union `{ type: "nda"|"terms"|"privacy"|"agreement", ...params }`
Output: `{ document: string (full markdown), type, wordCount, timestamp }`

### batch-review.ts — `trpc.batchReview.demo`
Input: `{ contracts: Array<{ title, content }> }`
Output: `{ contracts: Array<assessed>, portfolio: { score, commonGaps, criticalContracts } }`

### document.ts — `trpc.document.*`
- `list` — paginated document list for user
- `upload` — save to DB, trigger analysis
- `delete` — remove doc + cascade

---

## 11. PWA

### Manifest (public/manifest.webmanifest)
```json
{
  "name": "Nexus Legal",
  "short_name": "Nexus",
  "description": "AI legal analysis — chat-first",
  "theme_color": "#00CCCC",
  "background_color": "#080f1a",
  "display": "standalone",
  "start_url": "/",
  "scope": "/",
  "icons": [
    { "src": "/icons/icon.svg",     "sizes": "any",     "type": "image/svg+xml" },
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

### Workbox Strategy (vite.config.ts)
```
/api/trpc/*   → NetworkFirst  (10s timeout, then cache)
*.js, *.css, *.woff2 → CacheFirst (30-day TTL)
HTML pages    → StaleWhileRevalidate
```

### Icon (public/icons/icon.svg)
Legal balance scale on `#080f1a` rounded-rect background. Teal gradient stroke (`#00CCCC` → `#00909A`). Radial glow highlight. 512×512 viewBox.

---

## 12. Deployment

### Live
- **GitHub:** https://github.com/dnzengou/legal-ai-agent
- **Vercel:** https://legal-ai-agent-fawn.vercel.app
- **Account:** dnzengou / desire.yavro@gmail.com

### vercel.json
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist/public",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.ts" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

### Serverless entry (api/index.ts)
```typescript
import app from "./boot";
export default app.fetch.bind(app);
```

### Environment Variables
```
DATABASE_URL=mysql://...        # optional — demo mode if absent
APP_SECRET=<32+ random chars>
KIMI_AUTH_URL=https://auth.moonshot.cn
KIMI_OPEN_URL=https://api.moonshot.cn
APP_ID=<kimi app id>
OWNER_UNION_ID=<kimi union id>
```

### Local dev
```bash
cd Kimi_Agent_LegalAI_Build
npm install
cp .env.example .env       # leave DATABASE_URL blank for demo mode
npm run dev                # → http://localhost:3000
npm run build              # production build
npm run db:push            # apply schema (requires DATABASE_URL)
```

---

## 13. Demo Mode

When `DATABASE_URL` is unset:
- Auth skipped — app works as guest
- Chat intent engine runs fully — all 11 response generators active
- Documents stored in memory (lost on restart)
- Batch review: accepts raw text contracts directly
- All document generators: work without DB
- Score gauge: shows simulated scores

---

## 14. Git History (session)

| Hash | Message |
|------|---------|
| `80cf057` | ui: accessibility pass + visual polish |
| `c448851` | feat: v3 — PWA, chat-first redesign, lean 3-route UI |
| `8b74d0b` | feat: chat-first redesign v2 — lean, supreme UX, scalable |
| `bc6d604` | fix: add Vercel serverless entry point and fix vercel.json |
| `906c7ad` | feat: Nexus Legal AI Platform — initial production build |

---

## 15. Accessibility Audit (v4 state)

| Element | Standard | Status |
|---------|----------|--------|
| Muted text `#8da4b8` on `#080f1a` | WCAG AA 4.5:1 | 5.8:1 ✅ |
| Primary `#00CCCC` on `#080f1a` | WCAG AA 4.5:1 | 8.2:1 ✅ |
| Primary `#E4F5F4` on `#080f1a` | WCAG AA 4.5:1 | ~18:1 ✅ |
| Error red `#e05555` on `#080f1a` | WCAG AA 4.5:1 | ~4.6:1 ✅ |
| Focus ring | WCAG 2.4.11 | 2px teal outline ✅ |
| Keyboard navigation | WCAG 2.1 | All interactive targets ✅ |
| ARIA roles | WCAG 4.1.2 | nav, listbox, status, live ✅ |
| Screen reader | — | sr-only file input, aria-label on icons ✅ |
| Colour alone | WCAG 1.4.1 | Badges use text labels, not colour only ✅ |

---

## 16. Planned Extensions (v5+)

| Feature | Effort | Priority |
|---------|--------|----------|
| Real Claude API calls (streaming SSE) | Medium | High |
| PDF text extraction (pdfjs-dist) | Medium | High |
| Conversation persistence (chatSessions DB) | Medium | High |
| PNG PWA icons (192, 512) | Low | Medium |
| PDF export from chat (ReportLab bridge) | Low | Medium |
| Skip-navigation link | Low | Medium |
| Real-time collab (shared session URL) | High | Low |
| Chrome extension (review on DocuSign) | High | Low |
| Contract expiry push notifications | Medium | Low |
| Mobile app shell (PWA + Capacitor) | High | Low |

---

## 17. Rules

1. Legal outputs always include the disclaimer — never omit it
2. Never claim to provide legal advice — only analysis and drafting assistance
3. Always surface risks even when the user seems to want a green light
4. Risk levels: 🔴 High (7–10), 🟡 Medium (4–6), 🟢 Low (1–3)
5. Output markdown files to cwd unless user specifies otherwise
6. File names follow templates above — stay consistent
7. Demo mode must be fully functional without any database
8. All new text colours must pass WCAG AA against `--background`
9. Every interactive element must be keyboard-reachable with visible focus

---

*Nexus Legal v4.0 — 2026-05-19*
