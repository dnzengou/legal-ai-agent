# Nexus Legal — Blueprint v3.0

> "ChatGPT for Legal Work" — lean, chat-first, installable AI legal platform.
> Last updated: 2026-05-19

---

## 1. Vision

A single-screen experience where lawyers, founders, and freelancers drop a contract and get instant, structured legal analysis. No navigation overhead. Just: upload → ask → act.

Inspired by Harvey AI (depth of analysis), Claude.ai (UX simplicity), and Perplexity (cited, structured answers).

---

## 2. Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite 7 |
| Styling | Tailwind CSS v3 + shadcn/ui + HSL design tokens |
| Routing | React Router v7 (nested routes) |
| State | TanStack Query v5 + tRPC v11 |
| Backend | Hono v4 (serverless-ready) |
| API | tRPC routers (end-to-end type safety) |
| Database | Drizzle ORM + MySQL (optional — demo mode when absent) |
| Auth | Kimi OAuth 2.0 + JWT (skippable in demo) |
| Deploy | Vercel (Vite frontend + Hono serverless API) |
| PWA | vite-plugin-pwa + Workbox (offline, installable on mobile/desktop) |

---

## 3. Architecture

```
src/
├── pages/
│   ├── Chat.tsx          ← PRIMARY (route: "/")
│   ├── Documents.tsx     ← Document library
│   └── Settings.tsx      ← Config + API keys
├── components/
│   ├── AppLayout.tsx     ← 3-item nav: Chat / Documents / Settings
│   ├── NeuralBackground.tsx
│   └── ErrorBoundary.tsx
├── providers/
│   └── trpc.tsx          ← tRPC client + QueryClient
└── index.css             ← HSL design tokens + animations

api/
├── routers/
│   ├── chat.ts           ← Intent engine + 11 response generators
│   ├── document.ts       ← Upload, list, delete
│   ├── contract-review.ts ← 5-agent CoT pipeline
│   ├── batch-review.ts   ← N-parallel assessment
│   └── generate.ts       ← NDA / Terms / Privacy / Agreement generators
├── router.ts             ← tRPC app router (all routers merged)
├── boot.ts               ← Hono Node.js server (dev)
└── index.ts              ← Vercel serverless entry (export default app.fetch)

db/
├── schema.ts             ← Drizzle schema
└── index.ts              ← MySQL connection pool

public/
├── manifest.webmanifest  ← PWA manifest
└── icons/                ← 192×192, 512×512 PNG app icons
```

---

## 4. Routes (v3 — simplified)

```
/          → Chat (primary experience)
/documents → Document library
/settings  → Settings
/login     → Auth (Kimi OAuth)
/landing   → Marketing page
*          → NotFound
```

Removed (low value, superseded by Chat): `/dashboard`, `/review`, `/batch-review`, `/generate`, `/analysis`, `/precedents`, `/judgments`, `/ethics`, `/ai-engines`

---

## 5. Chat — Core Feature

### Intent Detection (11 intents)

```
User message → detectIntent() → buildResponse()

review           → "review this contract", "analyze this agreement"
risk             → "what are the risks", "red flags"
compliance       → "GDPR compliant?", "CCPA", "HIPAA"
plain            → "explain in plain English", "summarize"
negotiate        → "counter-proposals", "negotiate", "modify"
missing          → "what protections am I missing?", "gaps"
generate_nda     → "draft a mutual NDA"
generate_terms   → "create Terms of Service", "TOS"
generate_privacy → "write a privacy policy", "GDPR policy"
generate_agreement → "generate a service agreement", "MSA"
general          → definitions, help, anything else
```

### 5-Agent CoT Pipeline (contract review)

```
Phase 1: Ingest + classify (contract / NDA / ToS / privacy / other)
Phase 2: 5 agents IN PARALLEL
  [20%] Clause Analyst     → 20 clause types, completeness score
  [25%] Risk Assessor      → weighted formula per clause
  [20%] Compliance Checker → GDPR / CCPA / IRS / state laws
  [15%] Terms Mapper       → obligations + deadlines timeline
  [20%] Recommendations    → P0–P4 priorities, fix language
Phase 3: Aggregate → Safety Score (0–100) + Grade (A–F)
```

### Analysis Type Selector (chat header dropdown)

| Mode | What it does |
|------|-------------|
| Contract Review | Full 5-agent analysis + safety score |
| Risk Assessment | Clause-by-clause risk scoring |
| Compliance Check | GDPR / CCPA / IRS / state law gaps |
| Plain English | Legalese → readable summary |
| Negotiate | Counter-proposals + email template |
| Missing Protections | Gap finder |

### In-Chat Features

- **Drag & drop + click** file upload (PDF, TXT, DOCX)
- **Document selector** — switch active document in header
- **Typewriter streaming effect** — adaptive-speed rendering
- **AnalysisCard** — animated SVG score gauge, risk breakdown, clause list
- **Citation rendering** — BookOpen icon cards for references
- **Copy + Download** per message (markdown)
- **Session URL** — `?s=sessionId` shareable link
- **Typing indicator** — 3 bouncing dots
- **Empty state** — 6 quick-action cards

---

## 6. Design System

### Color Tokens (CSS custom properties, HSL)

```css
--background:      220 25% 5%    /* #080f1a  near-black navy */
--card:            220 30% 8%    /* #0d1829  card bg */
--primary:         180 100% 37%  /* #00BFBF  teal accent */
--primary-fg:      220 25% 5%    /* dark text on teal */
--foreground:      168 60% 95%   /* #E0F2F1  light text */
--muted-fg:        210 20% 50%   /* #5a7080  subdued */
--border:          210 40% 15%   /* #172130  subtle border */
--destructive:     0 85% 60%     /* #f25555  errors */
--sidebar-bg:      220 30% 4%    /* #07101a  sidebar */
```

### Typography

- UI: `Inter` (system fallback: system-ui, sans-serif)
- Code / data / scores: `JetBrains Mono`

### Animations

```css
fadeIn          0.3s ease-out          messages, cards entering
slideUp         0.25s ease-out         panels
typingDot       1.4s ease-in-out ∞    typing indicator dots
shimmer         1.5s linear ∞          loading skeletons
pulseGlow       2s ease-in-out ∞       score gauge ring
```

### Key CSS Utility Classes

```
.glass-card     backdrop-blur + translucent dark navy bg
.badge-high     red background  — 🔴 high risk
.badge-medium   amber           — 🟡 medium risk
.badge-low      green           — 🟢 low risk
.badge-contract teal            — contract document type
.font-mono-data JetBrains Mono for numbers/scores
.typing-dot     animation: typingDot + staggered delay
```

---

## 7. Database Schema

```typescript
users           id, unionId, name, email, avatar, role
documents       id, userId, title, content, type, status, fileUrl, fileSize
chatSessions    id, userId, title, documentId, engineId, messageCount, timestamps
chatMessages    id, sessionId, role, content, analysisType, analysisResult, citations, tokenCount
contractReviews id, documentId, userId, safetyScore, letterGrade, [5 agent JSON fields], status
analyses        id, documentId, type, status, result, summary, confidence
aiEngines       id, name, provider, model, apiKey, baseUrl, temperature, maxTokens, isDefault
reports         id, userId, type, entityId, content, safetyScore, fileUrl
activityLog     id, userId, action, entityType, entityId, metadata
```

---

## 8. Scoring Formulas

### Contract Safety Score (0–100)

```
Start at 100. Deduct:
  −15  unlimited liability
  −12  no data protection / GDPR missing
  −10  no liability cap
  −10  missing IP ownership clause
  −8   missing dispute resolution
  −8   missing force majeure
  −8   auto-renewal < 60-day window
  −5   no payment terms
  −5   missing confidentiality clause
  −3   each additional unprotected risk

Grade:  90–100 = A   |   80–89 = B   |   70–79 = C
        60–69 = D    |   < 60 = F
```

### Clause Risk Score (per clause)

```
Score = (Severity × 0.40) + (Likelihood × 0.25) + (Financial × 0.20) + (Asymmetry × 0.15)

🔴 High:   7.0 – 10.0
🟡 Medium: 4.0 – 6.9
🟢 Low:    1.0 – 3.9
```

---

## 9. Document Generators

| Type | Variants | Compliance |
|------|----------|------------|
| NDA | Mutual / One-way / Employee / Vendor | Standard |
| Terms of Service | SaaS / Marketplace / API | GDPR + CCPA |
| Privacy Policy | Full / Minimal / Cookie-only | GDPR Art. 13 + CCPA |
| Service Agreement | MSA / SOW / Freelancer / Partnership | IRS contractor-safe |

Each document:
- Full markdown with clause headings
- Plain-English annotations per clause
- Legal disclaimer footer

---

## 10. PWA Configuration

```json
{
  "name": "Nexus Legal",
  "short_name": "Nexus",
  "description": "AI legal analysis — chat-first",
  "theme_color": "#00BFBF",
  "background_color": "#080f1a",
  "display": "standalone",
  "start_url": "/",
  "scope": "/"
}
```

**Workbox caching strategy:**
- `NetworkFirst` — API calls (`/api/trpc/*`)
- `CacheFirst` — static assets (JS/CSS bundles, fonts)
- `StaleWhileRevalidate` — HTML pages

---

## 11. Demo Mode

When `DATABASE_URL` is unset (Vercel without DB):
- Auth: skipped — app opens as guest
- Chat: intent engine runs fully — all responses are real, rule-based
- Documents: upload stored in-memory (reset on restart)
- Batch: accepts raw text directly
- All generation: works without DB

---

## 12. Deployment

### Live

- **GitHub:** https://github.com/dnzengou/legal-ai-agent
- **Production:** https://legal-ai-agent-fawn.vercel.app
- **Account:** dnzengou (desire.yavro@gmail.com)

### Environment Variables

```
DATABASE_URL=mysql://...        # optional — demo mode if absent
APP_SECRET=<32+ chars>
KIMI_AUTH_URL=https://auth.moonshot.cn
KIMI_OPEN_URL=https://api.moonshot.cn
APP_ID=<kimi app id>
OWNER_UNION_ID=<kimi union id>
```

### Commands

```bash
npm install               # install deps (includes vite-plugin-pwa)
npm run dev               # http://localhost:3000
npm run build             # build frontend + bundle API
npm run db:push           # apply schema to DB (requires DATABASE_URL)
```

---

## 13. Files — v3 Change Log

| File | Status | Notes |
|------|--------|-------|
| `src/index.css` | ✅ Enhanced | Rich design tokens, typing animations, badge classes, shimmer, scrollbar |
| `src/App.tsx` | ✅ Simplified | 3 routes: /, /documents, /settings + /login + /landing |
| `src/components/AppLayout.tsx` | ✅ Lean | 3-item nav, New Chat button, PanelLeft collapse icons |
| `src/pages/Chat.tsx` | ✅ Full rewrite | AnalysisCard, score gauge, session URL, drag-drop, type selector |
| `db/schema.ts` | ✅ Extended | + chatSessions + chatMessages tables |
| `api/routers/chat.ts` | ✅ Enhanced | Intent engine + 11 response generators |
| `api/routers/batch-review.ts` | ✅ Built | Parallel rapidAssess + portfolio scoring |
| `api/routers/generate.ts` | ✅ Built | NDA/Terms/Privacy/Agreement generators |
| `api/index.ts` | ✅ Created | Vercel serverless entry |
| `vite.config.ts` | ✅ PWA | VitePWA() plugin added |
| `public/manifest.webmanifest` | ✅ Created | PWA manifest |
| `package.json` | ✅ Updated | + vite-plugin-pwa devDependency |
| `vercel.json` | ✅ Fixed | No broken functions block |
| `BLUEPRINT.md` | ✅ This file | v3 full spec |

---

## 14. Planned Extensions (v4+)

| Feature | Effort | Priority |
|---------|--------|----------|
| Real AI calls (Anthropic Claude API) | Medium | High |
| PDF text extraction (pdfjs-dist) | Medium | High |
| Streaming API responses (SSE) | Medium | High |
| Conversation persistence (DB-backed) | Medium | Medium |
| PDF export from chat (ReportLab) | Low | Medium |
| Custom AI engine per chat session | Low | Low |
| Team workspaces + shared sessions | High | Low |
| Chrome extension — review on DocuSign | High | Low |
| Contract expiry webhook alerts | Medium | Low |
| Mobile app (PWA + Capacitor) | High | Low |

---

## 15. Rules

1. Legal outputs always include the disclaimer — never omit it
2. Never claim to provide legal advice — only analysis and drafting assistance
3. Always surface risks even when the user seems to want a green light
4. Risk levels: 🔴 High (7–10), 🟡 Medium (4–6), 🟢 Low (1–3)
5. Output markdown files to cwd unless user specifies otherwise
6. File names follow the templates above — stay consistent
7. Demo mode must be fully functional without any database

---

*Nexus Legal v3.0 — 2026-05-19*
