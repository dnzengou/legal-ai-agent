# BLUEPRINT — Nexus Legal AI
> Version 2.0 — Chat-First Redesign | 2026-05-18

---

## 1. What This Is

**Nexus Legal** is a lean, chat-first AI legal intelligence platform.

**Core principle:** One input. Everything flows from the chat. Upload a document, type a question, get expert legal analysis instantly.

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Hono + tRPC + Drizzle ORM (MySQL / demo mode without DB)
- **AI Layer:** Multi-provider engine (Anthropic, OpenAI, DeepSeek, Kimi, Gemini)
- **UI Theme:** Deep navy `#001A33` + teal `#00BFBF` glassmorphism
- **Auth:** Kimi OAuth 2.0 + JWT (skippable in demo mode)

---

## 2. Feature Map (v2 — Lean)

### Active Routes

| Route | Feature | Status |
|-------|---------|--------|
| `/` | Landing page | ✅ |
| `/login` | Kimi OAuth login | ✅ |
| `/chat` | **Chat-first interface — primary experience** | ✅ NEW |
| `/dashboard` | Analytics overview, quick metrics | ✅ Simplified |
| `/documents` | Upload, manage legal documents | ✅ |
| `/review` | 5-Agent contract safety analysis + score | ✅ Enhanced |
| `/batch-review` | 2–10 contracts in parallel | ✅ |
| `/generate` | NDA / Terms / Privacy / Agreement generator | ✅ |
| `/settings` | AI engine config + user preferences (merged) | ✅ Merged |

### Removed (low value, redundant)
| Route | Reason |
|-------|--------|
| `/analysis` | Superseded by `/chat` + `/review` |
| `/contracts` | Superseded by `/generate` |
| `/precedents` | Niche, low daily usage |
| `/judgments` | Niche, low daily usage |
| `/ethics` | Niche, low daily usage |
| `/ai-engines` | Merged into `/settings` |

---

## 3. Chat-First Architecture

```
User opens /chat
  │
  ├─ Empty state: 6 quick-action cards
  │   [Review Contract] [Generate NDA] [Check Compliance]
  │   [Identify Risks]  [Plain English] [Draft Counter-Proposal]
  │
  ├─ User uploads document (drag-drop or click)
  │   → Text extracted, stored in conversation context
  │   → Chip shown above input: 📄 contract.pdf (2,400 words)
  │
  ├─ User types message (or clicks quick action)
  │
  ├─ Intent detection:
  │   review/analyze  → runContractReview() → Safety Score + full report
  │   generate/draft  → runDocumentGenerator()
  │   risk/danger     → runRiskExtractor()
  │   compliance/gdpr → runComplianceCheck()
  │   explain/plain   → runPlainEnglish()
  │   negotiate/counter → runNegotiationStrategy()
  │   general         → runLegalQA()
  │
  └─ Response streams in, formatted with markdown sections
       → Actions offered: [Copy] [Download .md] [Open in Review]
```

---

## 4. CoT Multi-Agent Pipeline (Contract Review)

```
Input: Contract text (via chat upload or /review page)
  │
  ├─ [20%] Clause Analyst      → 20 clause types, completeness, gap map
  ├─ [25%] Risk Assessor       → 10 risk categories, weighted score formula
  ├─ [20%] Compliance Checker  → GDPR Art.28, CCPA, IRS 20-Factor, state laws
  ├─ [15%] Terms Mapper        → Obligation taxonomy, financial exposure
  └─ [20%] Recommendations     → P0–P4 priorities, negotiation scripts
  │
  └─▶ Contract Safety Score (0–100) + Grade (A+/A/B/C/D/F)
```

**Risk formula:** `Score = (Severity×0.40) + (Likelihood×0.25) + (Financial×0.20) + (Asymmetry×0.15)`

**Safety score deductions:**
- Critical risk (9–10): −12 pts each
- High risk (7–8): −8 pts each
- Medium risk (4–6): −3 to −5 pts each
- Missing IP clause: −7 | Missing data protection: −8 | No liability cap: −10

---

## 5. Database Schema (unchanged)

```
users              ← OAuth users
aiEngines          ← Multi-provider config
documents          ← Legal docs (contract/nda/terms/privacy/other)
contractReviews    ← 5-agent results + safetyScore + letterGrade
analyses           ← All analysis results
precedents         ← Case law (retained, not exposed in UI v2)
statutes           ← Statutes (retained, not exposed in UI v2)
judgments          ← Judgments (retained, not exposed in UI v2)
ethicalReviews     ← Ethics (retained, not exposed in UI v2)
reports            ← Exportable reports
activityLog        ← User action audit trail
```

*Retained tables not shown in UI allow future re-enable without migration.*

---

## 6. Best-In-Class Patterns Adopted

| Pattern | Source inspiration | Implementation |
|---------|-------------------|----------------|
| Chat-first with doc context | Claude.ai, Harvey AI | `/chat` page — primary UX |
| Document pill in input | Claude.ai | Chip shown when doc attached |
| Conversation history sidebar | Claude.ai, ChatGPT | Left panel with recent chats |
| Suggested prompts empty state | Claude.ai | 6 quick-action cards |
| Streaming response feel | Claude.ai, Perplexity | Typewriter animation |
| Safety score gauge | Credit score apps | Circular SVG gauge 0–100 |
| Single settings page | Linear, Vercel | Merged AI engines + prefs |
| Mobile-first collapsible nav | Linear | Slide-over drawer on mobile |

---

## 7. Files Created / Modified

### v1 (initial build)
| File | Purpose |
|------|---------|
| `api/routers/contract-review.ts` | 5-agent pipeline (rewritten) |
| `api/routers/batch-review.ts` | Parallel multi-contract analysis |
| `api/routers/generate.ts` | NDA/Terms/Privacy/Agreement generator |
| `src/pages/BatchReview.tsx` | Batch review UI |
| `src/pages/Generate.tsx` | Document generation UI |
| `api/index.ts` | Vercel serverless entry point |
| `vercel.json` | Vercel deployment config |

### v2 (chat-first redesign)
| File | Change |
|------|--------|
| `api/routers/chat.ts` | NEW — intent-aware response engine |
| `src/pages/Chat.tsx` | NEW — chat-first interface with doc upload |
| `src/components/AppLayout.tsx` | Slimmed to 6 nav items |
| `src/App.tsx` | Updated routes |
| `api/router.ts` | Added chat router |
| `BLUEPRINT.md` | This file — updated |

---

## 8. Deployment

### Vercel (live)
- **GitHub:** https://github.com/dnzengou/legal-ai-agent
- **Production:** https://legal-ai-agent-fawn.vercel.app
- **Account:** dnzengou (desire.yavro@gmail.com)

### Environment Variables (Vercel dashboard)
```
DATABASE_URL=mysql://...         # PlanetScale/Railway — leave blank for demo mode
APP_SECRET=<32+ chars>
KIMI_AUTH_URL=https://auth.moonshot.cn
KIMI_OPEN_URL=https://api.moonshot.cn
APP_ID=<kimi app id>
OWNER_UNION_ID=<kimi union id>
```

### Demo Mode
When `DATABASE_URL` is unset:
- Auth skipped — app opens directly
- All analysis uses simulated data
- Documents stored in-memory (reset on restart)
- Full UI functional for evaluation

---

## 9. Quick Start (Local)

```bash
cd Kimi_Agent_LegalAI_Build
npm install
cp .env.example .env   # leave DATABASE_URL blank for demo
npm run dev            # http://localhost:3000
```

---

## 10. Planned Extensions (v3)

| Feature | Effort | Priority |
|---------|--------|----------|
| Real AI calls (Anthropic/OpenAI) | Medium | High |
| PDF text extraction (pdfjs-dist) | Medium | High |
| Streaming API responses | Medium | High |
| Conversation persistence (DB) | Medium | Medium |
| PDF export from chat | Low | Medium |
| Custom AI engine per chat | Low | Low |
| Team workspaces | High | Low |

---

*Nexus Legal v2.0 — 2026-05-18*
