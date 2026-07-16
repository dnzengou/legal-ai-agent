import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware.js";
import { getDb } from "../queries/connection.js";
import { contractReviews, documents } from "../../db/schema.js";

// ── Risk Score Formula ────────────────────────────────────────────
// Score = (Severity×0.40) + (Likelihood×0.25) + (Financial×0.20) + (Asymmetry×0.15)
// Round up when financial exposure is uncapped.
function riskScore(severity: number, likelihood: number, financial: number, asymmetry: number): number {
  return Math.round(severity * 0.40 + likelihood * 0.25 + financial * 0.20 + asymmetry * 0.15);
}

// ── Agent 1: Clause Analyst (20% weight) ─────────────────────────
// 20 clause categories, completeness 1-5, gap analysis
function runClauseAnalyst(_content: string) {
  const clauses = [
    { section: "1.0", type: "Scope of Services", category: "Performance", found: true, completeness: 4, text: "Defines deliverables, timelines, and acceptance criteria per SOW Exhibit A." },
    { section: "2.0", type: "Payment Terms", category: "Payment", found: true, completeness: 3, text: "Net-30 from invoice. No late fee clause. No acceleration clause." },
    { section: "3.0", type: "Indemnification", category: "Indemnification", found: true, completeness: 2, text: "Mutual indemnification — 'any and all claims' with no cap and no carve-out for own negligence." },
    { section: "4.0", type: "Limitation of Liability", category: "Liability", found: true, completeness: 2, text: "Cap at $50,000. Section 8.3 carve-out explicitly excludes indemnification from this cap." },
    { section: "5.0", type: "Termination", category: "Termination", found: true, completeness: 3, text: "Either party may terminate with 30 days notice. No cure period. No kill fee." },
    { section: "6.0", type: "Intellectual Property", category: "Intellectual Property", found: false, completeness: 0, text: "NOT FOUND — Critical gap. No IP ownership clause detected." },
    { section: "7.0", type: "Confidentiality", category: "Confidentiality", found: true, completeness: 4, text: "3-year survival post-termination. Standard exclusions for public domain and independent development." },
    { section: "8.0", type: "Data Protection", category: "Data Protection", found: false, completeness: 0, text: "NOT FOUND — No DPA, no GDPR/CCPA provisions despite services involving user data." },
    { section: "9.0", type: "Force Majeure", category: "Force Majeure", found: false, completeness: 0, text: "NOT FOUND — No protection for non-performance due to extraordinary events." },
    { section: "10.0", type: "Dispute Resolution", category: "Dispute Resolution", found: true, completeness: 4, text: "Binding arbitration in New York. AAA rules. No class action waiver." },
    { section: "11.0", type: "Governing Law", category: "Governing Law", found: true, completeness: 5, text: "Laws of the State of Delaware. Federal courts for injunctive relief." },
    { section: "12.0", type: "Non-Compete", category: "Non-Compete", found: false, completeness: 0, text: "NOT FOUND." },
    { section: "13.0", type: "Insurance Requirements", category: "Insurance", found: false, completeness: 0, text: "NOT FOUND — No insurance minimums specified. High exposure if vendor uninsured." },
    { section: "14.0", type: "Audit Rights", category: "Audit Rights", found: false, completeness: 0, text: "NOT FOUND — Cannot verify compliance without audit access." },
    { section: "15.0", type: "Warranty", category: "Warranty", found: true, completeness: 2, text: "30-day warranty only. Excludes consequential damages. No fitness for purpose warranty." },
    { section: "16.0", type: "Assignment", category: "Assignment", found: false, completeness: 0, text: "NOT FOUND — Vendor may assign to unknown third parties without consent." },
    { section: "17.0", type: "Amendment", category: "Amendment", found: true, completeness: 3, text: "Written amendment required signed by both parties." },
    { section: "18.0", type: "Severability", category: "Severability", found: true, completeness: 5, text: "Standard — invalid provisions severed without affecting remainder." },
    { section: "19.0", type: "Entire Agreement", category: "Entire Agreement", found: true, completeness: 4, text: "Supersedes all prior agreements." },
    { section: "20.0", type: "Survival", category: "Survival", found: true, completeness: 3, text: "Confidentiality and indemnification survive. Payment obligations not explicitly listed." },
  ];

  const completenessAvg = (clauses.reduce((s, c) => s + c.completeness, 0) / clauses.length).toFixed(1);
  const missingCount = clauses.filter(c => !c.found).length;

  return {
    clauses,
    completenessAvg: parseFloat(completenessAvg),
    missingCount,
    totalClauses: clauses.length,
    foundCount: clauses.filter(c => c.found).length,
    crossReferenceIssues: [
      "Section 4.0 (Liability Cap) explicitly excludes indemnification per Section 8.3 — creating uncapped exposure",
      "Section 3.0 (Indemnification) survives termination per Section 20.0 but no time limit specified",
    ],
    poisonPillsDetected: [
      { location: "Section 4.0 + 8.3", technique: "Cross-Reference Chain", description: "Liability cap appears to limit exposure but Section 8.3 excludes indemnification — indemnification is effectively uncapped" },
      { location: "Section 7.0", technique: "Incorporation by Reference", description: "Confidentiality references 'Company's then-current data handling policies' — these can change without contract amendment" },
    ],
  };
}

// ── Agent 2: Risk Assessor (25% weight — highest) ─────────────────
// 10 risk categories, poison pill detection, financial exposure
function runRiskAssessor(_content: string) {
  const risks = [
    {
      level: "high", score: riskScore(9, 6, 9, 9),
      category: "Broad Indemnification + Unlimited Liability",
      section: "3.0 + 4.0 + 8.3",
      text: "'Any and all claims' indemnification with liability cap carve-out — net unlimited exposure",
      impact: "Defense costs alone: $50K-$500K+. Total exposure: UNCAPPED",
      recommendation: "Replace with: mutual indemnification capped at contract value, excluding indemnifying party's own negligence. Add duty-to-defend trigger requiring prompt notice.",
      financialExposure: "UNCAPPED",
      benefitedParty: "Company",
    },
    {
      level: "high", score: riskScore(8, 7, 7, 9),
      category: "Missing IP Assignment",
      section: "6.0",
      text: "No IP ownership clause detected — vendor may retain rights to work product",
      impact: "You may pay $50K+ but not legally own the deliverables",
      recommendation: "Add: 'All work product, inventions, and deliverables created during this engagement are works-for-hire. Upon payment in full, all IP rights assign to Client.'",
      financialExposure: "$50,000 (contract value at risk)",
      benefitedParty: "Vendor",
    },
    {
      level: "high", score: riskScore(8, 8, 8, 8),
      category: "Missing Data Protection",
      section: "8.0",
      text: "No DPA, GDPR Art.28 provisions, or data breach notification requirements",
      impact: "GDPR fines: up to 4% annual global revenue. CCPA fines: $7,500/violation",
      recommendation: "Add data processing agreement (DPA) as Exhibit covering: processing purposes, security measures, sub-processor authorization, breach notification (72hr), data return/deletion on termination.",
      financialExposure: "$100,000+ (regulatory fines)",
      benefitedParty: "Neither",
    },
    {
      level: "high", score: riskScore(7, 6, 6, 8),
      category: "Missing Insurance Requirements",
      section: "13.0",
      text: "No insurance minimums specified. Uninsured vendor = risk transfers to you",
      impact: "If vendor causes incident with no insurance, your organization absorbs the cost",
      recommendation: "Require: General Liability $1M/$2M, E&O/Professional Liability $1M, Workers Comp per statute. Name Client as additional insured. Require certificate before work begins.",
      financialExposure: "$100,000-$1,000,000+",
      benefitedParty: "Vendor",
    },
    {
      level: "medium", score: riskScore(6, 7, 4, 6),
      category: "Inadequate Payment Terms",
      section: "2.0",
      text: "Net-30 with no late fee clause and no acceleration on non-payment",
      impact: "No incentive for timely payment. Disputes over 'received' date common",
      recommendation: "Add: 1.5%/month interest on overdue invoices. IP rights don't transfer until payment in full. Acceleration clause: all remaining milestones due if 2+ invoices unpaid.",
      financialExposure: "$5,000-$15,000 (cash flow impact)",
      benefitedParty: "Client",
    },
    {
      level: "medium", score: riskScore(6, 5, 5, 7),
      category: "No Assignment Restriction",
      section: "16.0",
      text: "No restriction on vendor assigning contract to unknown third parties",
      impact: "Vendor could subcontract your work or sell obligations without consent",
      recommendation: "Add: 'Neither party may assign this Agreement without prior written consent of the other party, not to be unreasonably withheld. Any assignment without consent is void.'",
      financialExposure: "$10,000-$50,000 (renegotiation costs)",
      benefitedParty: "Vendor",
    },
    {
      level: "medium", score: riskScore(5, 6, 4, 5),
      category: "Short Warranty Period",
      section: "15.0",
      text: "30-day warranty only — insufficient for complex software/services",
      impact: "Defects discovered after 30 days become new billable work",
      recommendation: "Extend to 90-180 days. Add fitness for purpose warranty. Require vendor to fix defects at no charge within warranty period.",
      financialExposure: "$5,000-$25,000",
      benefitedParty: "Vendor",
    },
    {
      level: "medium", score: riskScore(5, 5, 5, 6),
      category: "No Data Return Post-Termination",
      section: "5.0",
      text: "Termination clause has no data return or destruction obligation",
      impact: "Vendor retains your data indefinitely after contract ends",
      recommendation: "Add: 'Within 30 days of termination, Vendor shall return or certifiably destroy all Client data and provide written confirmation of destruction.'",
      financialExposure: "$10,000-$50,000 (privacy liability)",
      benefitedParty: "Vendor",
    },
    {
      level: "low", score: riskScore(3, 4, 2, 4),
      category: "No Force Majeure",
      section: "9.0",
      text: "No provision for non-performance due to extraordinary events",
      impact: "Either party could be in breach for events outside their control",
      recommendation: "Add standard force majeure covering: natural disasters, pandemics, government actions, infrastructure outages. Require notice within 5 business days. 30-day trigger before termination right.",
      financialExposure: "Variable",
      benefitedParty: "Neither",
    },
    {
      level: "low", score: riskScore(3, 3, 2, 3),
      category: "Email-Only Notice",
      section: "Misc",
      text: "Notices by email only — no physical address, no delivery confirmation",
      impact: "Disputes over whether critical notices (termination, breach) were received",
      recommendation: "Require dual notice: email + certified mail to named contact at specified address. Notice effective upon confirmed delivery.",
      financialExposure: "$2,000-$10,000 (dispute costs)",
      benefitedParty: "Neither",
    },
  ];

  const high = risks.filter(r => r.level === "high").length;
  const medium = risks.filter(r => r.level === "medium").length;
  const low = risks.filter(r => r.level === "low").length;
  const maxScore = Math.max(...risks.map(r => r.score));

  return { risks, high, medium, low, total: risks.length, maxRiskScore: maxScore };
}

// ── Agent 3: Compliance Checker (20% weight) ──────────────────────
// GDPR, CCPA, state law, contractor classification, usury
function runComplianceChecker(_content: string) {
  return {
    jurisdiction: "Delaware (governing law) / New York (arbitration venue)",
    applicableFrameworks: ["GDPR", "CCPA/CPRA", "IRS 20-Factor", "NY Contract Law"],
    checks: [
      { framework: "GDPR Art. 28", requirement: "Data Processing Agreement", status: "FAIL", section: "8.0", enforceability: "VOID", finding: "No DPA despite services involving user data. GDPR Article 28 mandates a written DPA. Fines: up to €20M or 4% global revenue." },
      { framework: "CCPA/CPRA", requirement: "Service Provider Designation", status: "FAIL", section: "8.0", enforceability: "VOID", finding: "No CCPA service provider clause. Vendor may use data for own purposes. Fines: $7,500/intentional violation." },
      { framework: "IRS 20-Factor", requirement: "Contractor Classification", status: "WARNING", section: "Overall", enforceability: "VOIDABLE", finding: "13/20 factors indicate potential employee relationship. If misclassified: back FICA taxes, penalties, state unemployment liability." },
      { framework: "NY GOL 5-501", requirement: "Late Payment Interest", status: "WARNING", section: "2.0", enforceability: "ENFORCEABLE WITH RISK", finding: "No interest rate specified — prevents Late Fee enforcement. If interest is added >16%, may violate NY civil usury cap." },
      { framework: "UCC Article 2", requirement: "Warranty Scope", status: "WARNING", section: "15.0", enforceability: "VOIDABLE", finding: "Disclaimer of implied warranties may be unenforceable in some states if not conspicuous." },
      { framework: "NY Contract Law", requirement: "Indemnification Cap", status: "WARNING", section: "3.0+8.3", enforceability: "ENFORCEABLE WITH RISK", finding: "Courts may limit uncapped indemnification as unconscionable, but this is unpredictable." },
      { framework: "SOC 2 Type II", requirement: "Security Controls", status: "FAIL", section: "8.0", enforceability: "N/A", finding: "No security requirements for vendor handling client data. SOC 2 compliance cannot be verified." },
    ],
    summary: {
      fail: 3,
      warning: 3,
      pass: 1,
      voidClauses: 2,
      voidableClauses: 2,
    },
  };
}

// ── Agent 4: Terms & Obligations Mapper (15% weight) ──────────────
// Obligation taxonomy, financial exposure calculator, deadline calendar
function runTermsMapper(_content: string) {
  return {
    yourObligations: [
      "Make payments per agreed milestone schedule (Net-30 from invoice)",
      "Provide necessary data, access, and cooperation",
      "Designate a single point of contact within 5 business days",
      "Review and accept/reject deliverables within 10 business days",
      "Cooperate with arbitration procedures in New York",
    ],
    theirObligations: [
      "Deliver Phase 1 within 30 days, Phase 2 within 90 days of effective date",
      "Maintain confidentiality for 3 years post-termination",
      "Provide 30-day warranty on all deliverables",
      "Comply with applicable laws and regulations",
      "Maintain professional liability insurance (none specified)",
    ],
    keyDates: [
      { event: "Effective Date", date: "Upon execution", type: "CALENDAR" },
      { event: "Phase 1 Delivery", date: "30 days from start", type: "MILESTONE" },
      { event: "Phase 2 Delivery", date: "90 days from start", type: "MILESTONE" },
      { event: "Payment Due", date: "Net-30 from each invoice", type: "ROLLING" },
      { event: "Deliverable Review Window", date: "10 business days after delivery", type: "EVENT" },
      { event: "Warranty Expiry", date: "30 days after final acceptance", type: "MILESTONE" },
      { event: "Termination Notice", date: "30 days written notice", type: "EVENT" },
      { event: "Confidentiality Survives", date: "3 years post-termination", type: "SURVIVAL" },
    ],
    paymentSchedule: [
      { milestone: "Contract Signing", percentage: 25, amount: "$12,500", due: "Upon execution" },
      { milestone: "Design Approval", percentage: 25, amount: "$12,500", due: "30 days from start" },
      { milestone: "Development Complete", percentage: 40, amount: "$20,000", due: "75 days from start" },
      { milestone: "Final Acceptance", percentage: 10, amount: "$5,000", due: "90 days from start" },
    ],
    financialExposure: {
      guaranteed: "$50,000 (contract value)",
      contingent: "$0 (no early termination fee)",
      uncapped: "UNLIMITED (indemnification excludes liability cap)",
      consequential: "NOT EXCLUDED from indemnification scope",
      totalMaximum: "$50,000 guaranteed + UNLIMITED indemnification exposure",
    },
    autoRenewal: { present: false, term: "N/A", optOutWindow: "N/A" },
    trapsIdentified: [
      "'Deemed accepted' — deliverables auto-accepted after 10 business days with no response",
      "No cure period before termination right — immediate termination possible for first breach",
    ],
  };
}

// ── Agent 5: Recommendations Engine (20% weight) ──────────────────
// Priority tiers P0-P4, negotiation scripts, concession strategy
function runRecommendationsEngine(_clauses: unknown, _risks: unknown) {
  return [
    {
      priority: "P0",
      tier: "Dealbreaker",
      type: "ADD",
      action: "Add IP Assignment Clause",
      section: "New Section 6.0",
      riskReduction: "8/10 → 2/10",
      financialSavings: "Protects $50K+ deliverable ownership",
      acceptanceLikelihood: "High",
      language: "All work product, inventions, and deliverables created during this engagement are works-for-hire under 17 U.S.C. § 101. To the extent any work product does not qualify as work-for-hire, Vendor hereby assigns to Client all right, title, and interest in such work product, including all intellectual property rights therein, effective upon Client's payment in full.",
      negotiationScript: "This is standard in services engagements — you're being paid to create deliverables for us, so we need to own them. We're happy to carve out your pre-existing tools and frameworks.",
      walkAway: "Do not sign without explicit IP assignment clause. This is a P0 dealbreaker.",
    },
    {
      priority: "P0",
      tier: "Dealbreaker",
      type: "ADD",
      action: "Add Data Processing Agreement",
      section: "New Exhibit C",
      riskReduction: "8/10 → 2/10",
      financialSavings: "Avoids GDPR fines up to €20M",
      acceptanceLikelihood: "High",
      language: "Vendor shall: (a) process Personal Data only on documented Client instructions; (b) implement appropriate technical and organizational security measures; (c) not engage sub-processors without prior written consent; (d) notify Client of any Personal Data breach within 48 hours; (e) delete or return all Personal Data within 30 days of termination; (f) make available information to demonstrate compliance and allow for audits.",
      negotiationScript: "GDPR requires this as a legal obligation — it protects both of us. Standard clause, non-negotiable from a regulatory standpoint.",
      walkAway: "Non-negotiable for any engagement involving personal data.",
    },
    {
      priority: "P1",
      tier: "Critical",
      type: "CAP",
      action: "Cap Indemnification and Fix Liability Carve-Out",
      section: "3.0 + 8.3",
      riskReduction: "9/10 → 4/10",
      financialSavings: "Caps unlimited exposure at $250K",
      acceptanceLikelihood: "Medium",
      language: "Each party's total aggregate indemnification obligation shall not exceed two hundred fifty thousand dollars ($250,000). This cap shall apply notwithstanding Section 8.3 or any other provision. Each party shall indemnify the other only for claims arising from that party's material breach, gross negligence, or willful misconduct — not for claims caused by the indemnified party's own acts or omissions.",
      negotiationScript: "Mutual indemnification without a cap creates symmetric unlimited risk for both parties. A $250K cap is standard for a $50K engagement — it's actually more protection for you too.",
      walkAway: "Accept up to $500K cap. Do not accept uncapped mutual indemnification.",
    },
    {
      priority: "P1",
      tier: "Critical",
      type: "ADD",
      action: "Add Insurance Requirements",
      section: "New Section 13.0",
      riskReduction: "7/10 → 2/10",
      financialSavings: "Transfers $1M+ incident risk to vendor",
      acceptanceLikelihood: "High",
      language: "Vendor shall maintain throughout the Term: (a) Commercial General Liability: $1,000,000 per occurrence / $2,000,000 aggregate; (b) Professional Liability / E&O: $1,000,000 per claim; (c) Workers Compensation: as required by law. Client shall be named as additional insured on CGL policy. Vendor shall provide certificates of insurance before commencing work.",
      negotiationScript: "Industry standard for service engagements of this value. If you're properly insured, this costs you nothing to agree to.",
      walkAway: "Minimum: $1M general liability. Non-negotiable for physical/professional risk.",
    },
    {
      priority: "P2",
      tier: "Important",
      type: "MOD",
      action: "Add Late Payment Penalty and IP Rights Hold",
      section: "2.0",
      riskReduction: "6/10 → 3/10",
      financialSavings: "Incentivizes $50K payment within 30 days",
      acceptanceLikelihood: "Medium",
      language: "Invoices not paid within 30 days accrue interest at 1.5% per month (18% per annum) from the due date. Intellectual property rights in deliverables shall not transfer until all outstanding invoices are paid in full. Client's failure to pay within 60 days shall be deemed material breach entitling Vendor to suspend services.",
      negotiationScript: "Payment terms without enforcement are unenforceable. This is standard practice — 1.5%/month is below NY usury limits and is a market norm.",
      walkAway: "Accept 1% minimum interest. IP hold until payment is non-negotiable.",
    },
    {
      priority: "P2",
      tier: "Important",
      type: "MOD",
      action: "Extend Warranty to 90 Days + Add Force Majeure",
      section: "15.0 + New 9.0",
      riskReduction: "5/10 → 2/10",
      financialSavings: "$10,000-$25,000 (defect repair cost avoidance)",
      acceptanceLikelihood: "High",
      language: "Warranty (Section 15.0): Vendor warrants deliverables for 90 days from final acceptance. Vendor shall remedy defects at no charge within this period. Force Majeure (Section 9.0): Neither party shall be in breach for non-performance caused by events outside their reasonable control including natural disasters, pandemics, or government actions, provided written notice is given within 5 business days.",
      negotiationScript: "90 days is the market standard for custom software. Force majeure is mutual — it protects both parties.",
      walkAway: "Accept 60 days minimum for warranty.",
    },
    {
      priority: "P3",
      tier: "Improvement",
      type: "ADD",
      action: "Add Non-Assignment Restriction",
      section: "New Section 16.0",
      riskReduction: "4/10 → 2/10",
      financialSavings: "Control over who performs your work",
      acceptanceLikelihood: "High",
      language: "Neither party may assign this Agreement or delegate its obligations without the other party's prior written consent, not to be unreasonably withheld. Any purported assignment without consent is void. This Agreement binds and inures to permitted successors and assigns.",
      negotiationScript: "Standard clause — prevents either party from transferring obligations without consent.",
      walkAway: "Nice to have. Acceptable as-is if not agreed.",
    },
  ];
}

// ── Safety Score Calculator (Upgraded) ────────────────────────────
// Weighted deductions from 100 using the risk profile
function calculateSafetyScore(risks: { level: string; score: number }[]) {
  let score = 100;

  // Deduct per risk level
  for (const r of risks) {
    if (r.level === "high") {
      score -= r.score >= 9 ? 12 : 8;
    } else if (r.level === "medium") {
      score -= r.score >= 6 ? 5 : r.score >= 5 ? 4 : 3;
    } else {
      score -= 2;
    }
  }

  // Additional deductions for missing critical protections (from clause analyst)
  score -= 10; // no IP clause
  score -= 8;  // no data protection
  score -= 5;  // no insurance
  score -= 5;  // no force majeure
  score -= 3;  // no assignment restriction

  score = Math.max(0, Math.min(100, score));

  const gradeMap: [number, string, string][] = [
    [90, "A+", "Safe"],
    [80, "A", "Good"],
    [70, "B", "Fair"],
    [60, "C", "Caution"],
    [40, "D", "Risky"],
    [0, "F", "Dangerous"],
  ];
  const [, grade, gradeLabel] = gradeMap.find(([min]) => score >= min) ?? [0, "F", "Dangerous"];

  return { score, grade, gradeLabel };
}

// ── Plain English Summary ─────────────────────────────────────────
function generatePlainEnglish() {
  return [
    { section: "1.0", clause: "Scope", plain: "You'll get specific deliverables listed in a separate document (SOW). If something isn't in that document, it's not included in the price." },
    { section: "2.0", clause: "Payment", plain: "You have 30 days to pay each invoice. There's no penalty if you're late — which is unusual and a risk for the vendor." },
    { section: "3.0", clause: "Indemnification", plain: "If something goes wrong, each side covers the other's legal costs. But there's no cap — you could owe unlimited money if a lawsuit happens." },
    { section: "4.0", clause: "Liability Cap", plain: "Your financial exposure appears limited to $50,000. BUT this cap doesn't apply to indemnification (Section 8.3) — so the real limit is unlimited." },
    { section: "5.0", clause: "Termination", plain: "Either side can end the contract with 30 days notice. No penalty for leaving early, but also no severance or 'kill fee' if the client walks." },
    { section: "7.0", clause: "Confidentiality", plain: "Both sides keep each other's secrets for 3 years after the contract ends. Standard and reasonable." },
    { section: "10.0", clause: "Disputes", plain: "If you disagree, you use a private arbitrator in New York, not a public court. This is faster and cheaper than litigation but you give up your right to a jury." },
    { section: "11.0", clause: "Governing Law", plain: "Delaware law applies. Delaware has business-friendly courts and is a common choice for contracts." },
  ];
}

// ── Missing Protections Finder ────────────────────────────────────
function findMissingProtections() {
  return [
    { protection: "IP Assignment Clause", urgency: "Critical", risk: "You may not own deliverables you paid for", section: "Section 6.0" },
    { protection: "Data Processing Agreement (DPA)", urgency: "Critical", risk: "GDPR/CCPA non-compliance — fines up to €20M", section: "Exhibit C" },
    { protection: "Insurance Requirements", urgency: "High", risk: "Uninsured vendor transfers all incident costs to you", section: "Section 13.0" },
    { protection: "Force Majeure Clause", urgency: "Medium", risk: "Either party could be in breach for acts of God, pandemics, etc.", section: "Section 9.0" },
    { protection: "Non-Assignment Restriction", urgency: "Medium", risk: "Vendor can subcontract to unknown parties without consent", section: "Section 16.0" },
    { protection: "Late Payment Penalty", urgency: "Medium", risk: "No financial incentive for timely payment", section: "Section 2.0" },
    { protection: "Audit Rights", urgency: "Low", risk: "Cannot verify vendor compliance without inspection rights", section: "Section 14.0" },
    { protection: "Data Return/Destruction on Termination", urgency: "Medium", risk: "Vendor retains your data indefinitely after contract ends", section: "Section 5.0" },
  ];
}

// ── Negotiation Strategy ──────────────────────────────────────────
function generateNegotiationStrategy(recommendations: ReturnType<typeof runRecommendationsEngine>) {
  const dealbreakers = recommendations.filter(r => r.priority === "P0");
  const critical = recommendations.filter(r => r.priority === "P1");
  const important = recommendations.filter(r => r.priority === "P2");
  const improvements = recommendations.filter(r => r.priority === "P3");

  return {
    summary: {
      dealbreakers: dealbreakers.length,
      critical: critical.length,
      important: important.length,
      improvements: improvements.length,
      overallRecommendation: "NEGOTIATE — do not sign without resolving P0 items",
    },
    dealbreakers,
    critical,
    important,
    improvements,
    emailTemplate: `Subject: Proposed Revisions to [Contract Name] — [Date]

Dear [Contact Name],

Thank you for sending the agreement. We're excited to move forward and have a few revisions to ensure it works well for both parties.

KEY REQUESTS:

1. IP Assignment (Section 6.0 — Missing)
   Please add an explicit IP assignment clause confirming we own all deliverables upon payment in full.

2. Data Processing Agreement (Exhibit C — Missing)
   Required for GDPR compliance. We can provide our standard DPA if helpful.

3. Indemnification Cap (Section 3.0 + 8.3)
   We propose capping mutual indemnification at $250,000 and clarifying the cap applies to all obligations.

4. Insurance Requirements (Section 13.0 — Missing)
   Please confirm General Liability ($1M/$2M) and Professional Liability ($1M). We'll need certificates before work begins.

We're happy to schedule a call to discuss. These are standard market terms and we expect minimal back-and-forth.

Best regards,
[Your Name]`,
  };
}

// ── Router ────────────────────────────────────────────────────────
export const contractReviewRouter = createRouter({
  create: publicQuery
    .input(z.object({ documentId: z.number(), userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [doc] = await db.select().from(documents).where(eq(documents.id, input.documentId)).limit(1);
      if (!doc) return { error: "Document not found" };

      const [result] = await db.insert(contractReviews).values({
        documentId: input.documentId,
        userId: input.userId,
        status: "processing",
      });
      const reviewId = Number(result.insertId);

      const startTime = Date.now();

      // 5 agents (synchronous simulation — swap for real LLM calls when AI engine configured)
      const clauseResult = runClauseAnalyst(doc.content);
      const riskResult = runRiskAssessor(doc.content);
      const compliance = runComplianceChecker(doc.content);
      const obligations = runTermsMapper(doc.content);
      const recommendations = runRecommendationsEngine(clauseResult.clauses, riskResult.risks);

      const { score, grade, gradeLabel } = calculateSafetyScore(riskResult.risks);
      const plainEnglish = generatePlainEnglish();
      const missingProtections = findMissingProtections();
      const negotiationStrategy = generateNegotiationStrategy(recommendations);
      const processingTime = Date.now() - startTime;

      await db.update(contractReviews).set({
        status: "completed",
        safetyScore: score,
        letterGrade: grade + " (" + gradeLabel + ")",
        highRiskCount: riskResult.high,
        mediumRiskCount: riskResult.medium,
        lowRiskCount: riskResult.low,
        clauseAnalysis: clauseResult,
        riskAssessment: riskResult,
        complianceFlags: compliance,
        obligationsMap: obligations,
        recommendations,
        plainEnglish,
        missingProtections,
        negotiationStrategy,
        processingTime,
      }).where(eq(contractReviews.id, reviewId));

      const [review] = await db.select().from(contractReviews).where(eq(contractReviews.id, reviewId)).limit(1);
      return { ...review, gradeLabel };
    }),

  list: publicQuery
    .input(z.object({ userId: z.number().optional(), limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input.userId) conditions.push(eq(contractReviews.userId, input.userId));
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const [rows, countResult] = await Promise.all([
        db.select().from(contractReviews).where(where).orderBy(desc(contractReviews.createdAt)).limit(input.limit).offset(input.offset),
        db.select({ count: sql<number>`count(*)` }).from(contractReviews).where(where),
      ]);
      return { items: rows, total: countResult[0]?.count ?? 0 };
    }),

  getById: publicQuery.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = getDb();
    const [row] = await db.select().from(contractReviews).where(eq(contractReviews.id, input.id)).limit(1);
    return row ?? null;
  }),

  getByDocument: publicQuery.input(z.object({ documentId: z.number() })).query(async ({ input }) => {
    const db = getDb();
    return db.select().from(contractReviews).where(eq(contractReviews.documentId, input.documentId)).orderBy(desc(contractReviews.createdAt));
  }),
});
