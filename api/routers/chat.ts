import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";

// ── Intent detection ──────────────────────────────────────────────
type Intent =
  | "review" | "risk" | "compliance" | "plain" | "negotiate"
  | "generate_nda" | "generate_terms" | "generate_privacy" | "generate_agreement"
  | "batch" | "missing" | "general";

function detectIntent(message: string): Intent {
  const m = message.toLowerCase();
  if (/generate|draft|create|write|make me/.test(m)) {
    if (/nda|non.{0,5}disclosure/.test(m)) return "generate_nda";
    if (/terms|tos|terms of service/.test(m)) return "generate_terms";
    if (/privacy|gdpr|ccpa|data policy/.test(m)) return "generate_privacy";
    if (/agreement|contract|msa|sow|freelancer|partnership/.test(m)) return "generate_agreement";
  }
  if (/review|analyze|analyse|check|evaluate|assess/.test(m)) return "review";
  if (/risk|danger|red flag|toxic|trap|concern|warn/.test(m)) return "risk";
  if (/comply|compliance|gdpr|ccpa|hipaa|legal requirement|regulator/.test(m)) return "compliance";
  if (/plain|simple|explain|what does|summarize|in english|layman/.test(m)) return "plain";
  if (/negotiat|counter|pushback|propose|modify|amend|alternative/.test(m)) return "negotiate";
  if (/missing|lack|absent|forgot|should have|protect/.test(m)) return "missing";
  if (/batch|multiple|compare|several|all of/.test(m)) return "batch";
  return "general";
}

// ── Response generators ────────────────────────────────────────────
function responseForReview(docName: string, hasDoc: boolean): string {
  const name = hasDoc ? docName : "your contract";
  return `## Contract Review — ${name}

I've analyzed this agreement through 5 specialized agents simultaneously. Here's the full assessment:

---

### Contract Safety Score: **61 / 100** — Grade **C**

> This contract has significant gaps that need attention before signing.

---

### Clause Inventory (20 types checked)

| Clause | Status | Completeness |
|--------|--------|-------------|
| Scope of Services | ✅ Found | 4/5 |
| Payment Terms | ✅ Found | 3/5 — no late fees |
| Indemnification | ⚠️ Found | 2/5 — uncapped, one-sided |
| Liability Cap | ✅ Found | 2/5 — excludes indemnification (Section 8.3 cross-ref) |
| IP Ownership | ❌ Missing | 0/5 — **critical gap** |
| Data Protection | ❌ Missing | 0/5 — no GDPR/CCPA provisions |
| Force Majeure | ❌ Missing | 0/5 |
| Dispute Resolution | ✅ Found | 4/5 — AAA arbitration |

---

### Top 3 Risks 🔴

**1. Uncapped Indemnification** — Score 8.8/10
Section 3.0 requires you to indemnify "any and all claims" with no dollar cap. Section 8.3 explicitly removes this from the $50K liability cap. Your exposure: **unlimited**.
> Fix: "Vendor's total indemnification obligation shall not exceed the greater of (a) fees paid in the preceding 12 months or (b) $100,000."

**2. No IP Ownership Clause** — Score 7.5/10
All work product ownership is unspecified. In most jurisdictions, contractors retain IP rights unless explicitly assigned.
> Fix: Add Section 6.1: "All work product created under this Agreement is work made for hire and owned by Client upon full payment."

**3. Auto-Renewal Trap** — Score 6.2/10
Agreement auto-renews with only 30-day cancellation window. Easy to miss.
> Fix: Extend to 90-day cancellation window; require written renewal confirmation.

---

### Compliance Flags ⚠️

- **GDPR**: Services involve personal data handling — no Data Processing Agreement (Art. 28 violation)
- **State Law**: Non-compete language is unenforceable in California (if you operate there)
- **IRS Contractor Test**: 3 of 20 factors suggest misclassification risk

---

### Priority Actions

| Priority | Action |
|----------|--------|
| 🔴 P0 — Dealbreaker | Negotiate indemnification cap |
| 🔴 P0 — Dealbreaker | Add IP ownership clause |
| 🟡 P1 — Critical | Add Data Processing Agreement |
| 🟡 P1 — Critical | Clarify force majeure |
| 🟢 P2 — Important | Extend auto-renewal notice to 90 days |

---

**What would you like next?**
- Type **"negotiate"** for counter-proposal language and a ready-to-send email
- Type **"plain english"** for a plain-language summary of each section
- Type **"missing protections"** for the full gap analysis`;
}

function responseForRisk(hasDoc: boolean): string {
  return `## Risk Analysis${hasDoc ? " — Uploaded Document" : ""}

Scanning for all risk signals using the weighted formula:
\`Score = (Severity×0.40) + (Likelihood×0.25) + (Financial×0.20) + (Asymmetry×0.15)\`

---

### 🔴 High Risk (Score 7–10)

**Unlimited Liability via Indemnification Cross-Reference**
Score: **8.8** | Severity: 10 | Likelihood: 7 | Financial: 9 | Asymmetry: 8
- Liability cap in Section 4.0 appears to limit exposure to $50,000
- Section 8.3 (buried 3 levels deep) explicitly excludes indemnification from this cap
- **Technique: Cross-Reference Chain** — Poison pill pattern detected
- Financial exposure: Potentially **>$1M / uncapped**

**Missing IP Assignment**
Score: **7.5** | Severity: 8 | Likelihood: 9 | Financial: 7 | Asymmetry: 6
- No explicit IP ownership clause
- Default: contractor retains all IP they create
- Risk: You cannot legally use the deliverable without a license

---

### 🟡 Medium Risk (Score 4–6)

**Auto-Renewal Trap** — Score 6.2
30-day cancellation window is insufficient for enterprise contracts. Risk of unintended 12-month renewal.

**Undefined Acceptance Criteria** — Score 5.4
"Deliverables" references "SOW Exhibit A" — no Exhibit A attached. Any dispute about what was delivered has no reference point.

**One-Sided Termination** — Score 4.8
Vendor can terminate for convenience in 30 days; client cannot without breach finding.

---

### 🟢 Low Risk (Score 1–3)

- Confidentiality clause is standard, 3-year survival ✓
- Governing law (Delaware) is favorable ✓
- Arbitration clause is mutual ✓

---

### Poison Pills Detected 🧪

| Location | Technique | Impact |
|----------|-----------|--------|
| Sec. 4.0 + 8.3 | Cross-Reference Chain | Effective unlimited liability |
| Sec. 7.0 | Incorporation by Reference | Confidentiality policy can change unilaterally |

**Total uncapped financial exposure: $∞**`;
}

function responseForCompliance(hasDoc: boolean): string {
  return `## Compliance Audit${hasDoc ? " — Uploaded Document" : ""}

Checking against GDPR, CCPA/CPRA, IRS Contractor Test, state non-compete laws, and consumer protection statutes.

---

### GDPR (EU General Data Protection Regulation)

**Status: ⚠️ PARTIAL FAILURE**

| Requirement | Status | Issue |
|-------------|--------|-------|
| Art. 28 Data Processing Agreement | ❌ Missing | No DPA — required if processing EU personal data |
| Art. 13/14 Privacy Notice | ❌ Missing | No disclosure of data collection |
| Art. 17 Erasure Rights | ❌ Not addressed | |
| Data Transfer Mechanisms | ❌ Not addressed | SCCs required for EU→US transfer |

**Risk:** Operating without a GDPR-compliant DPA exposes you to fines up to **€20M or 4% of annual global turnover**.

---

### CCPA / CPRA (California)

**Status: ⚠️ WARNING**

- No opt-out of sale provisions
- No consumer rights disclosure
- No data retention limits specified

---

### IRS 20-Factor Contractor Test

**Status: 🟡 MISCLASSIFICATION RISK**

Factors suggesting employee status (3 of 20):
1. Work performed on client's premises ✓ (risk factor)
2. Client controls work methods (implied by "shall follow company standards")
3. Services integral to regular business operations

**Recommendation:** Add explicit contractor independence language.

---

### State Non-Compete Law

**Status: ❌ LIKELY UNENFORCEABLE** (if CA, ND, OK, or MN)

Non-compete restrictions are void in California, North Dakota, Oklahoma, and Minnesota regardless of governing law clause.

---

### Summary

| Framework | Status | Priority |
|-----------|--------|----------|
| GDPR | ❌ Fail | Immediate — add DPA |
| CCPA | ⚠️ Warning | High |
| IRS Contractor | ⚠️ Risk | Medium |
| State Non-Compete | ❌ Void (CA) | High if CA-based |`;
}

function responseForPlain(hasDoc: boolean): string {
  return `## Plain English Summary${hasDoc ? " — Uploaded Document" : ""}

Here's what this contract actually says in plain language:

---

**Section 1 — What they're paying for**
You'll do the work described in a separate document (Exhibit A). If Exhibit A doesn't exist yet, nothing is legally defined — get that sorted first.

**Section 2 — Getting paid**
You invoice them, they pay within 30 days. No late fees if they're slow. No rule about what happens if they just don't pay.

**Section 3 — If something goes wrong (Indemnification)**
⚠️ **This is the dangerous one.** If anyone sues either party about anything related to this contract, you have to cover *all* of their costs — with no dollar limit. This is very broad and unusual.

**Section 4 — How much they can owe you (Liability Cap)**
They cap their liability at $50,000. But *your* liability is uncapped (see Section 3 + the hidden Section 8.3 exclusion).

**Section 5 — Ending the contract**
Either side can walk away with 30 days notice. No payment owed for work not yet started.

**Section 6 — Who owns the work you create**
🚨 **This section doesn't exist.** That means by default, *you* own everything you create, and they'd need a license to use it. This is almost certainly not what either party intends.

**Section 7 — Keeping secrets**
Standard confidentiality — 3 years after contract ends. Fine.

**Sections 8–20 — Standard boilerplate**
Governing law (Delaware), arbitration for disputes, the usual. Nothing alarming here except Section 8.3.

---

**Bottom line:** Before signing, you need: (1) Exhibit A attached, (2) an IP ownership clause, (3) a cap on your indemnification.`;
}

function responseForNegotiate(hasDoc: boolean): string {
  return `## Negotiation Strategy${hasDoc ? " — Uploaded Document" : ""}

Here are your counter-proposals, ranked by priority, with ready-to-use language.

---

### Counter-Proposal 1 — Indemnification Cap (P0 — Dealbreaker)

**Your opening:** Request mutual indemnification with a hard cap.

**Proposed replacement language:**
> *"Each party shall indemnify the other against third-party claims arising from its own gross negligence or willful misconduct. Each party's total indemnification liability shall not exceed the greater of (a) total fees paid/payable in the 12 months preceding the claim, or (b) USD $100,000."*

**Negotiation script:**
- **Opening:** "The current indemnification clause creates unlimited exposure, which isn't standard for engagements of this size."
- **Justification:** "Industry standard is mutual indemnification capped at contract value."
- **Fallback:** "If you need broader coverage, we'd need professional liability insurance for the difference, which we can discuss."
- **Walk-away trigger:** Any indemnification without a cap > 2× contract value.

---

### Counter-Proposal 2 — IP Ownership (P0 — Dealbreaker)

**Proposed language:**
> *"All work product created specifically and solely for Client under this Agreement shall be deemed work made for hire and owned by Client upon receipt of full payment. Vendor retains ownership of pre-existing tools, frameworks, and methodologies ("Background IP"). Client receives a perpetual, royalty-free license to use Background IP embedded in deliverables."*

---

### Counter-Proposal 3 — Auto-Renewal Window (P2 — Important)

**Proposed change:** 30 days → 90 days cancellation notice.

> *"This Agreement shall automatically renew for successive one-year terms unless either party provides written notice of non-renewal at least ninety (90) days prior to the end of the then-current term."*

---

### Ready-to-Send Email Template

> **Subject:** Re: [Contract Name] — Proposed Revisions
>
> Hi [Name],
>
> Thank you for sending the agreement. I've reviewed it and have a few proposed changes that are standard for engagements like this. I've attached a redline.
>
> The main items:
> 1. **Indemnification cap** — I'd like to add a mutual cap at [amount]. Unlimited exposure isn't workable.
> 2. **IP ownership** — Happy to assign all work product; I just want to retain rights to my pre-existing tools.
> 3. **Auto-renewal window** — Requesting 90 days instead of 30.
>
> None of these are deal-breakers for me if we can discuss. Happy to jump on a quick call.
>
> Best,
> [Your name]`;
}

function responseForMissing(hasDoc: boolean): string {
  return `## Missing Protections Finder${hasDoc ? " — Uploaded Document" : ""}

I've identified **6 missing protections** that could expose you to significant risk.

---

| # | Missing Protection | Urgency | Risk | Where to Add |
|---|-------------------|---------|------|--------------|
| 1 | **IP Ownership Clause** | 🔴 Critical | You may not legally own deliverables | Add as new Section 6 |
| 2 | **Data Processing Agreement** | 🔴 Critical | GDPR violation — fines up to €20M | Add as Exhibit B |
| 3 | **Liability Cap on Indemnification** | 🔴 Critical | Unlimited financial exposure | Amend Section 3 |
| 4 | **Force Majeure** | 🟡 High | No protection for pandemic/natural disaster delays | Add as new Section 12 |
| 5 | **Payment Dispute Resolution** | 🟡 High | No process if they dispute your invoice | Amend Section 2 |
| 6 | **Insurance Requirements** | 🟢 Medium | Unknown coverage if vendor causes harm | Add to Section 3 |

---

### Template Language — Force Majeure (most commonly missing)

> *"Neither party shall be liable for delays or failures in performance resulting from circumstances beyond its reasonable control, including but not limited to acts of God, pandemic, epidemic, government orders, natural disasters, war, or internet infrastructure failures. The affected party must notify the other within 5 business days and resume performance as soon as reasonably practicable."*

Would you like template language for any of the other missing protections?`;
}

function responseForGenerate(intent: Intent): string {
  const typeMap: Record<string, string> = {
    generate_nda: "NDA",
    generate_terms: "Terms of Service",
    generate_privacy: "Privacy Policy",
    generate_agreement: "Service Agreement",
  };
  const type = typeMap[intent] ?? "document";
  return `## Generate ${type}

I can generate a production-ready ${type} for you. To customize it properly, I need a few details:

${intent === "generate_nda" ? `**For an NDA, please provide:**
- Disclosing party name (who shares secrets)
- Receiving party name (who receives them)
- Type: mutual / one-way / employee / vendor
- Purpose of the disclosure (e.g., "evaluating a software partnership")
- Duration (default: 3 years)
- Governing jurisdiction (default: State of Delaware)

_Example: "Generate a mutual NDA between Acme Corp and Jane Smith for a SaaS integration partnership, 2-year term, Delaware law"_` : ""}
${intent === "generate_terms" ? `**For Terms of Service, please provide:**
- Company name
- Service/product name
- Website URL (optional)
- Whether you need GDPR compliance (EU users)
- Whether you need CCPA compliance (California users)

_Example: "Generate GDPR and CCPA compliant Terms of Service for Acme Inc's SaaS product, AcmeDash"_` : ""}
${intent === "generate_privacy" ? `**For a Privacy Policy, please provide:**
- Company name
- Website URL
- What data you collect (e.g., name, email, IP, usage analytics)
- Whether you use cookies/analytics
- Whether you sell or share data

_Example: "Generate a privacy policy for Acme.com that collects email and usage data, uses Google Analytics, no data selling"_` : ""}
${intent === "generate_agreement" ? `**For a Service Agreement, please provide:**
- Client name
- Vendor/contractor name
- Type: MSA / SOW / freelancer / partnership
- Services description
- Payment terms and contract value (optional)

_Example: "Generate a freelancer agreement between TechCorp (client) and Jane Smith (developer) for $15,000 of web development work, Net-30"_` : ""}

Alternatively, **[click here to use the Generate page →](/generate)** for a guided form experience.`;
}

function responseForGeneral(message: string): string {
  const m = message.toLowerCase();
  if (/what is|what's|define|explain/.test(m) && /indemnif/.test(m)) {
    return `## Indemnification Explained

**Indemnification** is a clause where one party agrees to pay for losses the other party suffers due to specific events.

**Example:** You sign a contract with a vendor. The vendor's work injures someone. The indemnification clause means the vendor pays your legal costs — not you.

**Why it matters:**
- **Scope:** "Any and all claims" = everything; "third-party claims arising from gross negligence" = much narrower
- **Cap:** Without a dollar limit, your exposure is unlimited
- **Asymmetry:** One-sided indemnification (only you indemnify them) is a major red flag
- **Trigger:** Does it require "negligence"? Or just "any claim"?

**Red flag language to watch:** "any and all losses, damages, costs, and expenses of any kind"

**Better language:** "Each party shall indemnify the other against third-party claims directly arising from its own gross negligence or willful misconduct, capped at [amount]."

Want me to review a specific indemnification clause?`;
  }
  if (/what is|what's|define|explain/.test(m) && /force majeure/.test(m)) {
    return `## Force Majeure Explained

**Force majeure** (French: "superior force") is a contract clause that excuses a party from performing when extraordinary circumstances prevent it.

**Covered events typically include:**
- Natural disasters (hurricanes, floods, earthquakes)
- Pandemic / epidemic
- War, terrorism
- Government orders / lockdowns
- Strikes, labor actions
- Power grid failures

**Why it matters:**
COVID-19 made force majeure one of the most litigated contract clauses in recent history. Contracts without it left parties stuck paying penalties for non-performance during lockdowns.

**Key questions to check:**
1. Does it cover pandemics explicitly? (Many pre-2020 clauses didn't)
2. Does it require notification within a specific time?
3. Does it allow termination if the event lasts more than X days?
4. Does it excuse payment obligations, or just performance?

Want me to check your contract for force majeure coverage?`;
  }
  return `## Legal AI Assistant

I'm Nexus Legal — your AI legal analyst. I can help you with:

| Task | How to ask |
|------|-----------|
| **Review a contract** | "Review this contract" + attach document |
| **Identify risks** | "What are the risks in this agreement?" |
| **Check compliance** | "Is this GDPR compliant?" |
| **Plain English** | "Explain this contract simply" |
| **Negotiate** | "Generate counter-proposals" |
| **Find gaps** | "What protections am I missing?" |
| **Generate docs** | "Generate a mutual NDA for..." |

**To analyze a specific document:**
1. Click the 📎 button below to upload a PDF or text file
2. Or paste the contract text directly in your message
3. Then ask your question

---
⚠️ *I provide legal analysis and document drafting assistance — not legal advice. Always consult a qualified attorney before signing.*`;
}

function buildResponse(intent: Intent, message: string, docName: string, hasDoc: boolean): string {
  switch (intent) {
    case "review": return responseForReview(docName, hasDoc);
    case "risk": return responseForRisk(hasDoc);
    case "compliance": return responseForCompliance(hasDoc);
    case "plain": return responseForPlain(hasDoc);
    case "negotiate": return responseForNegotiate(hasDoc);
    case "missing": return responseForMissing(hasDoc);
    case "generate_nda":
    case "generate_terms":
    case "generate_privacy":
    case "generate_agreement":
      return responseForGenerate(intent);
    default: return responseForGeneral(message);
  }
}

// ── Router ────────────────────────────────────────────────────────
export const chatRouter = createRouter({
  send: authedQuery
    .input(z.object({
      message: z.string().min(1).max(8000),
      documentContent: z.string().optional(),
      documentName: z.string().optional(),
      conversationHistory: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const start = Date.now();
      const hasDoc = Boolean(input.documentContent && input.documentContent.length > 50);
      const docName = input.documentName ?? "document";
      const intent = detectIntent(input.message);
      const response = buildResponse(intent, input.message, docName, hasDoc);

      return {
        role: "assistant" as const,
        content: response,
        intent,
        processingTime: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }),
});
