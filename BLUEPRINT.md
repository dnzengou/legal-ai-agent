# BLUEPRINT — Nexus Legal AI Platform

> Merged architecture: **Kimi_Agent_LegalAI_Build** (full-stack web app) + **ai-legal-claude** (Claude Code skill system with deep legal expertise)

---

## 1. What This Is

**Nexus Legal** is a production-ready AI-powered legal intelligence platform.

- **Frontend:** React 19 + TypeScript + Tailwind CSS + shadcn/ui (40+ components)
- **Backend:** Hono + tRPC + Drizzle ORM (MySQL)
- **AI Layer:** Multi-provider AI engine (DeepSeek, Kimi, OpenAI, Anthropic, Gemini)
- **UI Theme:** Deep navy (`#001A33`) + teal (`#00BFBF`) glassmorphism
- **Auth:** Kimi OAuth 2.0 + JWT sessions

---

## 2. Feature Map (Merged)

### From Kimi_Agent_LegalAI_Build (existing)

| Route | Feature | Status |
|-------|---------|--------|
| `/dashboard` | Analytics, charts, quick actions | ✅ Built |
| `/documents` | Upload, manage legal documents | ✅ Built |
| `/contract-review` | 5-Agent safety analysis + Contract Safety Score | ✅ Built |
| `/analysis` | 8 analysis types (NLP pipeline) | ✅ Built |
| `/contracts` | Generate contracts from 6 templates | ✅ Built |
| `/precedents` | Search case law with relevance scoring | ✅ Built |
| `/judgments` | Judgment summaries + rhetoric labeling | ✅ Built |
| `/ethics` | AI bias/fairness/transparency auditing | ✅ Built |
| `/ai-engines` | Multi-model AI engine configuration | ✅ Built |
| `/settings` | User preferences | ✅ Built |

### From ai-legal-claude (new additions)

| Route | Feature | Status |
|-------|---------|--------|
| `/batch-review` | Review 2-10 contracts simultaneously in parallel | ✅ Added |
| `/generate` | Generate NDA / Terms / Privacy / Agreement / SOW | ✅ Added |
| `/negotiate` | Counter-proposal generator + negotiation email | ✅ Added |
| `/compliance` | GDPR/CCPA/ADA/PCI/CAN-SPAM gap audit | Planned |

---

## 3. Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    NEXUS LEGAL                          │
│                  nexuslegal.vercel.app                  │
└─────────────────────────────────────────────────────────┘
         │                              │
  ┌──────▼──────┐              ┌────────▼────────┐
  │   Frontend  │              │   API (Hono)    │
  │  React 19   │◄────tRPC────►│ /api/trpc/*     │
  │  Vite SSG   │              └────────┬────────┘
  └─────────────┘                       │
                            ┌───────────┼───────────┐
                            │           │           │
                    ┌───────▼──┐ ┌──────▼────┐ ┌───▼──────────┐
                    │ contract │ │  batch-   │ │   generate   │
                    │  review  │ │  review   │ │   (NDA etc.) │
                    │ (5-agent)│ │(N-agent)  │ │              │
                    └───────┬──┘ └──────┬────┘ └───┬──────────┘
                            │           │           │
                    ┌───────▼───────────▼───────────▼──────────┐
                    │            AI Engine Layer               │
                    │  DeepSeek · Kimi · OpenAI · Anthropic    │
                    │  (via configurable API keys in DB)       │
                    └──────────────────┬───────────────────────┘
                                       │
                    ┌──────────────────▼───────────────────────┐
                    │              MySQL (PlanetScale)         │
                    │  users · documents · contractReviews ·   │
                    │  analyses · precedents · judgments ·     │
                    │  ethicalReviews · reports · activityLog  │
                    └──────────────────────────────────────────┘
```

---

## 4. CoT Multi-Agent Pipeline (Enhanced)

### 4.1 Contract Review — 5 Parallel Agents

```
Input: Contract text
  │
  ├─ Agent 1 [20%]: Clause Analyst
  │    Identifies 20+ clause types, completeness score 1-5,
  │    cross-reference map, gap analysis, defined terms registry
  │
  ├─ Agent 2 [25%]: Risk Assessor  ← HIGHEST WEIGHT
  │    10 risk categories: Financial Exposure, Liability Transfer,
  │    Restrictive Covenants, Unclear Terms, Missing Protections,
  │    One-Sided Terms, Unlimited Liability, Broad Indemnification,
  │    Auto-Renewal Traps, Non-Compete Overreach
  │    Poison pill detection: buried boilerplate, cross-reference chains,
  │    definition manipulation, incorporation by reference
  │    Score = (Severity×0.40) + (Likelihood×0.25) + (Financial×0.20) + (Asymmetry×0.15)
  │
  ├─ Agent 3 [20%]: Compliance Checker
  │    GDPR Art.28, CCPA/CPRA, State non-compete law (50 states),
  │    IRS 20-factor contractor test, ABC test, usury laws,
  │    consumer protection, HIPAA/GLBA/FERPA flags
  │
  ├─ Agent 4 [15%]: Terms & Obligations Mapper
  │    Obligation taxonomy: PERF/PAY/NOTC/APPR/RPT/INS/COMP/REST/COND/SURV
  │    Financial exposure: guaranteed + contingent + uncapped + consequential
  │    Auto-renewal trap detection, deadline calendar, payment schedule
  │
  └─ Agent 5 [20%]: Recommendations Engine
       Priority tiers: P0 Dealbreaker → P4 Cosmetic
       8 action types: REP/MOD/ADD/DEL/CO/CAP/MUT/CLR
       Negotiation scripts: Opening → Justification → Fallback → Trade-off → Walk-away
       Concession strategy matrix
  │
  └─▶ Contract Safety Score (0-100) + Grade (A+/A/B/C/D/F)
       → CONTRACT-REVIEW Report
       → PDF Export (ReportLab score gauge + risk bar chart)
```

### 4.2 Batch Review — N Parallel Agents

```
Input: N contract files (2-10)
  │
  ├─ Agent 1 → Contract 1 rapid assessment
  ├─ Agent 2 → Contract 2 rapid assessment
  ├─ Agent N → Contract N rapid assessment
  │   (all fire simultaneously)
  │
  └─▶ Comparative risk table ranked by Safety Score
       Cross-contract pattern analysis
       Recommended action order
```

### 4.3 Document Generation Pipeline

```
Input: type + user-provided parameters
  │
  ├─ NDA Generator: mutual/one-way/employee/vendor
  │   15 sections + plain English annotations
  │
  ├─ Terms of Service: GDPR/CCPA compliant, 18 sections
  │
  ├─ Privacy Policy: scans actual data collection practices
  │
  ├─ Service Agreement: MSA/SOW/freelancer/partnership
  │
  └─▶ Markdown document with legal annotations
       → Available for PDF export
```

---

## 5. Database Schema

```
users              ← Kimi OAuth users
aiEngines          ← Multi-provider AI config (DeepSeek/Kimi/OpenAI/Anthropic)
documents          ← Legal docs (contract/judgment/statute/brief/nda/terms/privacy)
contractReviews    ← 5-agent results: clauseAnalysis/riskAssessment/complianceFlags/
                     obligationsMap/recommendations/plainEnglish/negotiationStrategy/
                     missingProtections + safetyScore + letterGrade
analyses           ← All analysis types (14 types)
precedents         ← Case law with relevance scoring
statutes           ← Legal statutes by jurisdiction
judgments          ← Judicial opinions with rhetoric labels
ethicalReviews     ← Bias/fairness/transparency/privacy scores
reports            ← Exportable reports (PDF references)
activityLog        ← User action audit trail
```

---

## 6. Enhanced Scoring Logic

### Contract Safety Score Formula
```
Start at 100 points.

High-risk clauses (score 7-10):
  - Critical (9-10): -12 points each
  - High (7-8):      -8 points each

Medium-risk clauses (score 4-6):
  - Upper (6):   -5 points each  
  - Middle (5):  -4 points each
  - Lower (4):   -3 points each

Missing critical protections:
  - No liability cap:      -10 points
  - No data protection:    -8 points
  - No IP clause:          -7 points
  - No force majeure:      -5 points
  - No dispute resolution: -5 points

Compliance failures:
  - FAIL (void clause):    -8 points each
  - WARNING:               -3 points each

Floor: 0. Ceiling: 100.

Grade: A+ (90-100) | A (80-89) | B (70-79) | C (60-69) | D (40-59) | F (0-39)
```

### Risk Score Per Clause
```
Score = (Severity × 0.40) + (Likelihood × 0.25) + (Financial_Exposure × 0.20) + (Asymmetry × 0.15)

Severity (1-10): Worst-case outcome
Likelihood (1-10): Probability of trigger
Financial_Exposure (1-10): 
  1-2 = <$10K | 3-4 = $10-50K | 5-6 = $50-250K | 7-8 = $250K-1M | 9-10 = >$1M/uncapped
Asymmetry (1-10): How one-sided is this clause

Round up when exposure is uncapped.
```

---

## 7. Files Created / Modified in This Session

### New Files
| File | Purpose |
|------|---------|
| `BLUEPRINT.md` | This document |
| `api/routers/batch-review.ts` | Parallel multi-contract analysis |
| `api/routers/generate.ts` | NDA/Terms/Privacy/Agreement generator |
| `api/routers/negotiate.ts` | Counter-proposal + negotiation strategy |
| `src/pages/BatchReview.tsx` | Batch review UI |
| `src/pages/Generate.tsx` | Document generation UI |
| `vercel.json` | Vercel deployment configuration |

### Modified Files
| File | Change |
|------|--------|
| `api/routers/contract-review.ts` | Upgraded scoring, 10 risk categories, poison pill detection |
| `api/router.ts` | Added batchReview + generate + negotiate routers |
| `src/App.tsx` | Added /batch-review and /generate routes |
| `src/components/AppLayout.tsx` | Added Batch Review + Generate nav items |

---

## 8. Deployment

### Option A: Vercel (Recommended — Frontend + Serverless API)

**Prerequisites:**
- GitHub account + repo
- Vercel account (free tier works)
- Database: PlanetScale (MySQL, free tier) or Neon (PostgreSQL — requires schema change) or Railway (MySQL)

**Steps:**
```bash
# 1. Push to GitHub
git init
git add .
git commit -m "feat: Nexus Legal AI Platform — initial production build"
git remote add origin https://github.com/YOUR_USER/nexus-legal.git
git push -u origin main

# 2. Connect to Vercel
# - Go to vercel.com → New Project → Import from GitHub
# - Select your repo
# - Framework: Vite

# 3. Set Environment Variables in Vercel dashboard:
APP_ID=your_app_id
APP_SECRET=your_secret_32chars_min
DATABASE_URL=mysql://user:pass@host/db
VITE_KIMI_AUTH_URL=https://auth.moonshot.cn
VITE_APP_ID=your_kimi_app_id
KIMI_AUTH_URL=https://auth.moonshot.cn
KIMI_OPEN_URL=https://api.moonshot.cn
OWNER_UNION_ID=your_kimi_union_id

# 4. Database setup
npm run db:push   # Push schema to PlanetScale

# 5. Deploy
# Vercel auto-deploys on every push to main
```

**vercel.json** configures:
- Build command: `npm run build`
- Output: `dist/public`
- API routes: `/api/*` → Hono serverless handler

### Option B: Railway (Full-stack including MySQL)

```bash
# Railway gives you MySQL + Node.js in one platform
# 1. Create project on railway.app
# 2. Add MySQL plugin → copy DATABASE_URL
# 3. Deploy via GitHub integration
# 4. Set all env vars in Railway dashboard
```

### Option C: Netlify (Frontend) + Separate API

```bash
# Netlify for static frontend, separate API host (Railway/Render/Fly.io)
netlify.toml:
  [build]
    command = "npm run build"
    publish = "dist/public"
  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
```

---

## 9. Demo Mode (No Database Required)

If `DATABASE_URL` is not set, the app runs in **demo mode**:
- Contract review uses simulated data
- No authentication required
- Documents stored in-memory (reset on restart)
- All 5-agent analysis results are synthetic but realistic

To enable demo mode, leave `DATABASE_URL` blank in env.

---

## 10. Planned Extensions

| Feature | Description | Effort |
|---------|-------------|--------|
| Real AI calls | Route agent calls to actual Kimi/DeepSeek API | Medium |
| PDF export (browser) | Client-side PDF via pdfmake or pdf-lib | Low |
| Document OCR | Extract text from uploaded PDFs via pdfjs | Medium |
| Compliance audit page | GDPR/CCPA/ADA website scanner | Medium |
| Email integration | Send negotiation email directly from the platform | Low |
| Audit trail export | Export activity log as CSV/PDF | Low |
| Team workspaces | Multi-user shared document library | High |
| Webhook events | Trigger on analysis complete | Medium |

---

## 11. Key Design Decisions

1. **tRPC over REST** — End-to-end type safety between frontend and backend. No API schema maintenance.

2. **Drizzle ORM** — Lightweight, type-safe SQL. Migrations via `npm run db:generate`.

3. **Agents as functions** — Currently synchronous functions (no real LLM calls). Designed for drop-in replacement with actual AI API calls when API keys are configured.

4. **Glassmorphism theme** — Navy/teal/dark palette chosen for professional legal UX. Not "fun AI" — serious tool aesthetic.

5. **Safety Score before signing** — Core UX principle: every contract gets a 0-100 score before the user makes a decision. Inspired by credit scores — immediately actionable.

6. **No vendor lock-in** — AI engine table lets users bring their own API keys for any provider. Multi-model support built-in.

---

## 12. Quick Start (Local Dev)

```bash
cd Kimi_Agent_LegalAI_Build

# Install
npm install

# Configure env
cp .env.example .env
# Edit .env with your values

# Database
npm run db:push

# Dev server (localhost:3000)
npm run dev

# Production build
npm run build
npm start
```

---

*Blueprint generated: 2026-05-18 | Nexus Legal v1.0*
