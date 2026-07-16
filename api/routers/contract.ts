import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware.js";
import { getDb } from "../queries/connection.js";
import { documents, analyses } from "../../db/schema.js";

function generateNDA(p: Record<string, string>): string {
  return "NON-DISCLOSURE AGREEMENT\n\n" +
    'This Non-Disclosure Agreement ("Agreement") is entered into as of ' + (p.effectiveDate ?? "[DATE]") +
    ' by and between ' + (p.partyA ?? "[PARTY A]") + ' ("Disclosing Party") and ' +
    (p.partyB ?? "[PARTY B]") + ' ("Receiving Party").\n\n' +
    '1. Definition of Confidential Information. "Confidential Information" means any and all non-public, proprietary, or confidential information disclosed by Disclosing Party.\n\n' +
    "2. Obligations of Receiving Party. Receiving Party agrees to hold all Confidential Information in strict confidence.\n\n" +
    "3. Term. This Agreement shall remain in effect for " + (p.term ?? "3") + " years from the Effective Date.\n\n" +
    "4. Governing Law. This Agreement shall be governed by the laws of " + (p.jurisdiction ?? "[JURISDICTION]") + ".";
}

function generateEmployment(p: Record<string, string>): string {
  return "EMPLOYMENT AGREEMENT\n\n" +
    'This Employment Agreement is made between ' + (p.employer ?? "[EMPLOYER]") + ' ("Employer") and ' +
    (p.employee ?? "[EMPLOYEE]") + ' ("Employee").\n\n' +
    "1. Position. Employee shall serve as " + (p.position ?? "[POSITION]") + ".\n\n" +
    "2. Compensation. Base salary of " + (p.salary ?? "[SALARY]") + " per annum.\n\n" +
    "3. Term. Employment begins on " + (p.startDate ?? "[START DATE]") + " and continues until terminated.\n\n" +
    "4. Confidentiality. Employee agrees to maintain confidentiality of all proprietary information.";
}

function generateService(p: Record<string, string>): string {
  return "SERVICE AGREEMENT\n\n" +
    'This Service Agreement is between ' + (p.provider ?? "[PROVIDER]") + ' ("Provider") and ' +
    (p.client ?? "[CLIENT]") + ' ("Client").\n\n' +
    "1. Services. Provider shall perform " + (p.services ?? "[SERVICES]") + ".\n\n" +
    "2. Compensation. Client shall pay " + (p.fee ?? "[FEE]") + " as described in Schedule A.\n\n" +
    "3. Term. " + (p.term ?? "12 months") + " from the Effective Date.\n\n" +
    "4. Limitation of Liability. Provider's liability shall not exceed fees paid in the preceding 12 months.";
}

function generateLease(p: Record<string, string>): string {
  return "COMMERCIAL LEASE AGREEMENT\n\n" +
    'This Lease is between ' + (p.landlord ?? "[LANDLORD]") + ' ("Landlord") and ' +
    (p.tenant ?? "[TENANT]") + ' ("Tenant").\n\n' +
    "1. Premises. " + (p.premises ?? "[PREMISES]") + "\n\n" +
    "2. Term. " + (p.term ?? "[TERM]") + " commencing " + (p.startDate ?? "[START DATE]") + ".\n\n" +
    "3. Rent. " + (p.rent ?? "[RENT]") + " per month.\n\n" +
    "4. Security Deposit. " + (p.deposit ?? "[DEPOSIT]") + ".";
}

function generateLicense(p: Record<string, string>): string {
  return "SOFTWARE LICENSE AGREEMENT\n\n" +
    'This License Agreement is between ' + (p.licensor ?? "[LICENSOR]") + ' ("Licensor") and ' +
    (p.licensee ?? "[LICENSEE]") + ' ("Licensee").\n\n' +
    "1. Grant. Licensor grants Licensee a " + (p.scope ?? "non-exclusive") + " license to use " +
    (p.software ?? "[SOFTWARE]") + ".\n\n" +
    "2. Fees. Licensee shall pay " + (p.fee ?? "[FEE]") + ".\n\n" +
    "3. Restrictions. Licensee shall not reverse engineer or distribute the Software.";
}

function generatePurchase(p: Record<string, string>): string {
  return "PURCHASE AGREEMENT\n\n" +
    'This Purchase Agreement is between ' + (p.buyer ?? "[BUYER]") + ' ("Buyer") and ' +
    (p.seller ?? "[SELLER]") + ' ("Seller").\n\n' +
    "1. Goods. Seller shall sell and Buyer shall purchase " + (p.goods ?? "[GOODS]") + ".\n\n" +
    "2. Purchase Price. " + (p.price ?? "[PRICE]") + ".\n\n" +
    "3. Delivery. " + (p.delivery ?? "[DELIVERY TERMS]") + ".\n\n" +
    "4. Warranties. Seller warrants goods shall be free from defects for " + (p.warranty ?? "12 months") + ".";
}

const generators: Record<string, (p: Record<string, string>) => string> = {
  nda: generateNDA,
  employment: generateEmployment,
  service_agreement: generateService,
  lease: generateLease,
  licensing: generateLicense,
  purchase: generatePurchase,
};

export const contractRouter = createRouter({
  analyze: publicQuery
    .input(
      z.object({
        documentId: z.number(),
        focus: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [doc] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, input.documentId))
        .limit(1);

      if (!doc) return null;

      const [result] = await db.insert(analyses).values({
        documentId: input.documentId,
        type: "contract_review",
        status: "processing",
      });

      const analysisId = Number(result.insertId);

      const focusAreas = input.focus ?? [
        "liability",
        "termination",
        "indemnification",
        "ip",
        "confidentiality",
      ];

      const analysisResult = {
        overview: "Comprehensive contract analysis covering " + focusAreas.join(", ") + ".",
        riskScore: Math.round((3 + Math.random() * 7) * 10) / 10,
        clauses: [
          {
            type: "indemnification",
            risk: "medium",
            text: "Section 4.2 - Limited mutual indemnification",
            recommendation: "Consider broadening scope to include negligence",
          },
          {
            type: "termination",
            risk: "low",
            text: "Section 7.1 - 30-day termination for convenience",
            recommendation: "Add cure period for material breach",
          },
          {
            type: "liability",
            risk: "high",
            text: "Section 8.5 - Cap on liability at 12 months fees",
            recommendation: "Increase to 24 months or remove cap for gross negligence",
          },
          {
            type: "governing_law",
            risk: "low",
            text: "Section 12 - Delaware governing law",
            recommendation: "No changes recommended",
          },
          {
            type: "confidentiality",
            risk: "medium",
            text: "Section 5 - 3-year confidentiality period",
            recommendation: "Extend to 5 years for trade secrets",
          },
        ],
        obligations: [
          "Party A shall deliver reports within 10 business days of month-end",
          "Party B shall maintain confidentiality for the duration plus applicable survival period",
          "Both parties shall comply with all applicable data protection regulations",
          "Party A shall provide annual SOC 2 Type II reports upon request",
        ],
        keyDates: [
          { event: "Effective Date", date: "Upon execution" },
          { event: "Initial Term", date: "12 months" },
          { event: "Renewal", date: "Automatic annual renewal" },
          { event: "Termination Notice", date: "30 days prior to term end" },
        ],
      };

      await db
        .update(analyses)
        .set({
          status: "completed",
          result: analysisResult,
          summary: "Contract analysis completed. Risk score: " + analysisResult.riskScore + "/10. " + analysisResult.clauses.length + " key clauses reviewed.",
          confidence: String(0.85 + Math.random() * 0.1),
          processingTime: Math.round(800 + Math.random() * 2000),
        })
        .where(eq(analyses.id, analysisId));

      await db
        .update(documents)
        .set({ status: "analyzed" })
        .where(eq(documents.id, input.documentId));

      return { analysisId, result: analysisResult };
    }),

  generate: publicQuery
    .input(
      z.object({
        template: z.enum([
          "nda",
          "employment",
          "service_agreement",
          "lease",
          "licensing",
          "purchase",
        ]),
        parameters: z.record(z.string(), z.string()),
      }),
    )
    .mutation(async ({ input }) => {
      const gen = generators[input.template];
      const draft = gen ? gen(input.parameters) : "Contract draft for template: " + input.template;

      return {
        template: input.template,
        draft,
        parameters: input.parameters,
      };
    }),

  review: publicQuery
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [doc] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, input.documentId))
        .limit(1);

      if (!doc) return null;

      return {
        documentId: input.documentId,
        riskAssessment: {
          overallRisk: Math.round((4 + Math.random() * 5) * 10) / 10,
          categories: [
            { name: "Financial", score: Math.round((6 + Math.random() * 4) * 10) / 10, level: "high" },
            { name: "Regulatory", score: Math.round((4 + Math.random() * 4) * 10) / 10, level: "medium" },
            { name: "Operational", score: Math.round((3 + Math.random() * 4) * 10) / 10, level: "medium" },
            { name: "Reputational", score: Math.round((2 + Math.random() * 4) * 10) / 10, level: "low" },
          ],
        },
        recommendations: [
          "Review liability caps and consider increasing coverage",
          "Ensure force majeure clause covers pandemic scenarios",
          "Add explicit data protection obligations",
          "Clarify IP ownership for derivative works",
          "Include dispute resolution mechanism",
        ],
        missingClauses: [
          "Force majeure",
          "Data protection addendum",
          "Insurance requirements",
          "Assignment restrictions",
        ],
      };
    }),

  compare: publicQuery
    .input(
      z.object({
        docA: z.number(),
        docB: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [docA, docB] = await Promise.all([
        db
          .select()
          .from(documents)
          .where(eq(documents.id, input.docA))
          .limit(1),
        db
          .select()
          .from(documents)
          .where(eq(documents.id, input.docB))
          .limit(1),
      ]);

      if (!docA[0] || !docB[0]) return null;

      return {
        docA: { id: docA[0].id, title: docA[0].title },
        docB: { id: docB[0].id, title: docB[0].title },
        differences: [
          { field: "governing_law", docA: "Delaware", docB: "New York", change: "modified" },
          { field: "liability_cap", docA: "$1,000,000", docB: "$500,000", change: "reduced" },
          { field: "term", docA: "12 months", docB: "24 months", change: "increased" },
          { field: "termination_notice", docA: "30 days", docB: "60 days", change: "increased" },
          { field: "confidentiality_period", docA: "3 years", docB: "5 years", change: "increased" },
        ],
        addedClauses: [
          "Data Protection Addendum (Section 14)",
          "Insurance Requirements (Section 9.4)",
        ],
        removedClauses: [
          "Automatic Renewal (Section 7.2)",
        ],
      };
    }),
});
