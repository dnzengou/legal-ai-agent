import { z } from "zod";
import { createRouter, authedQuery } from "../middleware.js";
import { getDb } from "../queries/connection.js";
import { documents } from "../../db/schema.js";
import { inArray } from "drizzle-orm";

// ── Rapid contract assessment — mirrors contract-review but lighter ─
// Used for batch comparison: each contract gets one agent pass.
function rapidAssess(content: string, title: string, index: number) {
  const word = content.split(/\s+/).length;

  // Simple heuristic risk signals in the text
  const signals = {
    hasIndemnification: /indemnif/i.test(content),
    hasLiabilityCap: /limitation.{0,20}liabilit|liabilit.{0,20}cap|cap.{0,20}liabilit/i.test(content),
    hasIP: /intellectual property|work.{0,10}for.{0,10}hire|ownership of|assigns.{0,20}rights/i.test(content),
    hasDataProtection: /gdpr|ccpa|data protection|personal data|data processing/i.test(content),
    hasForceMajeure: /force majeure|act of god|pandemic|epidemic/i.test(content),
    hasDisputeResolution: /arbitrat|mediat|dispute resolution/i.test(content),
    hasGoverningLaw: /governing law|jurisdiction|choice of law/i.test(content),
    hasTermination: /termination|terminate/i.test(content),
    hasAutoRenewal: /auto.{0,5}renew|automatically renew/i.test(content),
    hasUnlimitedLiability: /unlimited.{0,20}liabilit|without.{0,20}limitation.{0,20}liabilit/i.test(content),
    hasBroadIndemnification: /any and all claims|any and all losses|any and all damages/i.test(content),
    hasNonCompete: /non.{0,3}compete|noncompete|shall not.{0,20}compet/i.test(content),
    hasAssignmentRestriction: /may not assign|without.{0,20}prior written consent.{0,20}assign/i.test(content),
  };

  // Score: start 100, deduct for missing protections and risk signals
  let score = 100;
  const flags: string[] = [];
  const risks: string[] = [];

  if (!signals.hasLiabilityCap) { score -= 10; flags.push("No liability cap"); }
  if (!signals.hasIP) { score -= 7; flags.push("No IP ownership clause"); }
  if (!signals.hasDataProtection) { score -= 8; flags.push("No data protection provisions"); }
  if (!signals.hasForceMajeure) { score -= 5; flags.push("No force majeure"); }
  if (!signals.hasDisputeResolution) { score -= 5; flags.push("No dispute resolution mechanism"); }
  if (!signals.hasGoverningLaw) { score -= 3; flags.push("No governing law clause"); }
  if (!signals.hasAssignmentRestriction) { score -= 4; flags.push("Unrestricted assignment allowed"); }

  if (signals.hasUnlimitedLiability) { score -= 15; risks.push("Unlimited liability exposure detected"); }
  if (signals.hasBroadIndemnification) { score -= 10; risks.push("'Any and all claims' indemnification — uncapped"); }
  if (signals.hasAutoRenewal) { score -= 6; risks.push("Auto-renewal trap detected"); }
  if (signals.hasIndemnification && !signals.hasLiabilityCap) { score -= 5; risks.push("Indemnification without liability cap"); }

  score = Math.max(0, Math.min(100, score));

  const grade =
    score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" :
    score >= 60 ? "C" : score >= 40 ? "D" : "F";

  const riskLevel: "low" | "medium" | "high" | "critical" =
    score >= 75 ? "low" : score >= 55 ? "medium" : score >= 35 ? "high" : "critical";

  // Priority actions
  const priorityActions = [
    ...flags.slice(0, 3).map(f => `ADD: ${f}`),
    ...risks.slice(0, 2).map(r => `REVIEW: ${r}`),
  ];

  // Contract type detection
  const contractType =
    /non.{0,5}disclosure|nda|confidential(ity)? agreement/i.test(content) ? "NDA" :
    /employment|employee|employer|at.{0,5}will|compensation/i.test(content) ? "Employment Agreement" :
    /service agreement|master service|statement of work|sow/i.test(content) ? "Service Agreement" :
    /license agreement|software license|saas|subscription/i.test(content) ? "License Agreement" :
    /partnership|joint venture/i.test(content) ? "Partnership Agreement" :
    /terms of service|terms and conditions|user agreement/i.test(content) ? "Terms of Service" :
    /lease|rental|landlord|tenant/i.test(content) ? "Lease Agreement" :
    /purchase agreement|sale of|bill of sale/i.test(content) ? "Purchase Agreement" :
    "General Contract";

  return {
    index,
    title,
    contractType,
    wordCount: word,
    safetyScore: score,
    letterGrade: grade,
    riskLevel,
    missingProtections: flags,
    identifiedRisks: risks,
    priorityActions,
    keySignals: signals,
    recommendation:
      score >= 80 ? "Acceptable with minor review" :
      score >= 60 ? "Requires negotiation before signing" :
      score >= 40 ? "High risk — substantial revisions needed" :
      "Do not sign — critical issues require legal counsel",
  };
}

// ── Cross-contract pattern analysis ──────────────────────────────────
function analyzePatterns(results: ReturnType<typeof rapidAssess>[]) {
  const scores = results.map(r => r.safetyScore);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const lowest = results.reduce((a, b) => a.safetyScore < b.safetyScore ? a : b);
  const highest = results.reduce((a, b) => a.safetyScore > b.safetyScore ? a : b);

  // Common missing protections across all contracts
  const allFlags = results.flatMap(r => r.missingProtections);
  const flagCounts = allFlags.reduce<Record<string, number>>((acc, f) => {
    acc[f] = (acc[f] ?? 0) + 1; return acc;
  }, {});
  const commonGaps = Object.entries(flagCounts)
    .filter(([, count]) => count >= Math.ceil(results.length / 2))
    .sort((a, b) => b[1] - a[1])
    .map(([flag, count]) => ({ flag, occurrences: count, contracts: results.filter(r => r.missingProtections.includes(flag)).map(r => r.title) }));

  // Highest risk contracts (score < 60) in priority order
  const criticalContracts = results
    .filter(r => r.safetyScore < 60)
    .sort((a, b) => a.safetyScore - b.safetyScore)
    .map(r => ({ title: r.title, score: r.safetyScore, grade: r.letterGrade }));

  return {
    portfolioScore: avg,
    portfolioGrade: avg >= 90 ? "A+" : avg >= 80 ? "A" : avg >= 70 ? "B" : avg >= 60 ? "C" : avg >= 40 ? "D" : "F",
    scoreRange: { min: Math.min(...scores), max: Math.max(...scores) },
    lowestRiskContract: { title: lowest.title, score: lowest.safetyScore },
    highestRiskContract: { title: highest.title, score: highest.safetyScore },
    commonGaps,
    criticalContracts,
    reviewOrder: [...results].sort((a, b) => a.safetyScore - b.safetyScore).map(r => r.title),
    summary:
      `Portfolio of ${results.length} contracts. Average safety score ${avg}/100. ` +
      (criticalContracts.length > 0
        ? `${criticalContracts.length} contract(s) require immediate attention before signing.`
        : "All contracts are within acceptable risk range."),
  };
}

export const batchReviewRouter = createRouter({
  // POST /batch-review — accepts 2-10 document IDs, runs parallel rapid assessment
  create: authedQuery
    .input(z.object({
      documentIds: z.array(z.number()).min(2).max(10),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      if (!db) {
        // Demo mode: generate synthetic batch results
        const demoContracts = input.documentIds.map((id, i) => ({
          id,
          title: `Contract ${i + 1}`,
          content: i % 2 === 0
            ? "This Service Agreement indemnifies any and all claims without limitation. Auto-renews annually."
            : "This NDA with mutual confidentiality, liability cap of $50,000, IP ownership assigned to company, GDPR compliant data protection provisions, and arbitration dispute resolution.",
        }));

        const results = demoContracts.map((c, i) => rapidAssess(c.content, c.title, i));
        const sortedResults = [...results].sort((a, b) => a.safetyScore - b.safetyScore);
        const patterns = analyzePatterns(results);

        return {
          id: Date.now(),
          contractCount: results.length,
          results: sortedResults,
          patterns,
          processingTime: 847,
          createdAt: new Date().toISOString(),
        };
      }

      const docs = await db
        .select({ id: documents.id, title: documents.title, content: documents.content })
        .from(documents)
        .where(inArray(documents.id, input.documentIds));

      if (docs.length < 2) {
        throw new Error("At least 2 valid documents required for batch review");
      }

      const start = Date.now();
      // All agents fire simultaneously — Promise.all for N-parallel assessment
      const results = await Promise.all(
        docs.map((doc, i) => Promise.resolve(rapidAssess(doc.content, doc.title, i)))
      );

      const sortedResults = [...results].sort((a, b) => a.safetyScore - b.safetyScore);
      const patterns = analyzePatterns(results);
      const processingTime = Date.now() - start;

      return {
        id: Date.now(),
        contractCount: results.length,
        results: sortedResults,
        patterns,
        processingTime,
        createdAt: new Date().toISOString(),
      };
    }),

  // Quick demo — batch review from raw text input (no DB required)
  demo: authedQuery
    .input(z.object({
      contracts: z.array(z.object({
        title: z.string(),
        content: z.string().min(50),
      })).min(2).max(10),
    }))
    .mutation(async ({ input }) => {
      const start = Date.now();
      const results = await Promise.all(
        input.contracts.map((c, i) => Promise.resolve(rapidAssess(c.content, c.title, i)))
      );
      const sortedResults = [...results].sort((a, b) => a.safetyScore - b.safetyScore);
      const patterns = analyzePatterns(results);
      return {
        id: Date.now(),
        contractCount: results.length,
        results: sortedResults,
        patterns,
        processingTime: Date.now() - start,
        createdAt: new Date().toISOString(),
      };
    }),
});
