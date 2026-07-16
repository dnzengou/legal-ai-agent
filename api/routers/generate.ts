import { z } from "zod";
import { createRouter, authedQuery } from "../middleware.js";

// ── Document type schemas ─────────────────────────────────────────

const NdaInput = z.object({
  type: z.literal("nda"),
  disclosingParty: z.string().min(1),
  receivingParty: z.string().min(1),
  ndaType: z.enum(["mutual", "one-way", "employee", "vendor"]).default("mutual"),
  purpose: z.string().min(10),
  duration: z.string().default("3 years"),
  jurisdiction: z.string().default("State of Delaware"),
  effectiveDate: z.string().optional(),
});

const TermsInput = z.object({
  type: z.literal("terms"),
  companyName: z.string().min(1),
  serviceName: z.string().min(1),
  websiteUrl: z.string().url().optional(),
  jurisdiction: z.string().default("State of Delaware"),
  gdprCompliant: z.boolean().default(true),
  ccpaCompliant: z.boolean().default(true),
  effectiveDate: z.string().optional(),
});

const PrivacyInput = z.object({
  type: z.literal("privacy"),
  companyName: z.string().min(1),
  websiteUrl: z.string().url().optional(),
  dataTypes: z.array(z.string()).default(["name", "email", "usage data"]),
  hasAnalytics: z.boolean().default(true),
  hasCookies: z.boolean().default(true),
  sellsData: z.boolean().default(false),
  jurisdiction: z.string().default("State of Delaware"),
  effectiveDate: z.string().optional(),
});

const AgreementInput = z.object({
  type: z.literal("agreement"),
  agreementType: z.enum(["msa", "sow", "freelancer", "partnership"]).default("msa"),
  clientName: z.string().min(1),
  vendorName: z.string().min(1),
  services: z.string().min(10),
  paymentTerms: z.string().default("Net-30"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  value: z.string().optional(),
  jurisdiction: z.string().default("State of Delaware"),
});

const GenerateInput = z.discriminatedUnion("type", [NdaInput, TermsInput, PrivacyInput, AgreementInput]);

// ── NDA Generator ─────────────────────────────────────────────────
function generateNda(input: z.infer<typeof NdaInput>): string {
  const date = input.effectiveDate ?? new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const isMutual = input.ndaType === "mutual";
  const discloser = input.ndaType === "one-way" ? input.disclosingParty : "each Party";
  const receiver = input.ndaType === "one-way" ? input.receivingParty : "the other Party";

  return `# NON-DISCLOSURE AGREEMENT
**Type:** ${input.ndaType.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())} NDA
**Effective Date:** ${date}

---

## PARTIES

This Non-Disclosure Agreement ("Agreement") is entered into as of ${date} by and between:

- **Disclosing Party:** ${input.disclosingParty}${isMutual ? " (also acting as Receiving Party)" : ""}
- **Receiving Party:** ${input.receivingParty}${isMutual ? " (also acting as Disclosing Party)" : ""}

Collectively referred to as the "Parties."

---

## 1. PURPOSE
<!-- Plain English: Why you're sharing confidential information -->
The Parties wish to explore a business relationship regarding: **${input.purpose}**

In connection with this purpose, ${discloser} may disclose Confidential Information to ${receiver}.

---

## 2. DEFINITION OF CONFIDENTIAL INFORMATION
<!-- Plain English: What counts as secret -->
"Confidential Information" means any non-public information disclosed by ${discloser} to ${receiver}, either directly or indirectly, in writing, orally, or by inspection, including but not limited to:

- Technical data, trade secrets, know-how, and research
- Business plans, strategies, forecasts, and customer lists
- Financial information and pricing structures
- Software, inventions, processes, and formulas
- Any information marked or identified as "Confidential" or "Proprietary"

**Exclusions:** Confidential Information does not include information that:
1. Is or becomes publicly known through no breach of this Agreement
2. Was rightfully known before disclosure without restriction
3. Is independently developed without use of Confidential Information
4. Is required to be disclosed by law or court order (with prompt notice to Disclosing Party)

---

## 3. OBLIGATIONS OF RECEIVING PARTY
<!-- Plain English: What you must do to protect the secrets -->
The Receiving Party agrees to:

1. **Hold in Confidence:** Maintain Confidential Information in strict confidence with at least the same degree of care used to protect its own confidential information (but no less than reasonable care)
2. **Limit Disclosure:** Disclose only to employees, contractors, and advisors who (a) need to know for the stated purpose and (b) are bound by confidentiality obligations at least as protective as this Agreement
3. **No Unauthorized Use:** Not use Confidential Information for any purpose other than the stated purpose
4. **No Reverse Engineering:** Not reverse engineer, disassemble, or decompile any disclosed materials
5. **Notify Breach:** Immediately notify the Disclosing Party of any unauthorized disclosure or breach

---

## 4. TERM
<!-- Plain English: How long this lasts -->
This Agreement is effective as of the Effective Date and continues for **${input.duration}**, unless earlier terminated by either Party with 30 days written notice.

**Survival:** Confidentiality obligations survive termination for **${input.duration}** after the end of the Agreement.

---

## 5. RETURN OR DESTRUCTION OF INFORMATION
<!-- Plain English: Give it back or destroy it when done -->
Upon written request or termination of this Agreement, the Receiving Party shall promptly:

- Return all tangible Confidential Information to the Disclosing Party, or
- Certify in writing that all Confidential Information has been destroyed

Electronic copies in routine backup systems may be retained subject to ongoing confidentiality obligations.

---

## 6. NO LICENSE
<!-- Plain English: Sharing info does not give you any rights to use it commercially -->
Nothing in this Agreement grants the Receiving Party any license, right, title, or interest in or to the Confidential Information or any intellectual property of the Disclosing Party.

---

## 7. NO WARRANTY
The Disclosing Party makes no representations or warranties regarding the accuracy or completeness of Confidential Information.

---

## 8. INJUNCTIVE RELIEF
<!-- Plain English: If you breach this, we can go to court immediately without waiting for arbitration -->
The Parties acknowledge that breach of this Agreement would cause irreparable harm for which monetary damages would be inadequate, and either Party may seek injunctive or other equitable relief without bond or other security.

---

## 9. GOVERNING LAW AND DISPUTE RESOLUTION
<!-- Plain English: Which state's law applies and how disputes are handled -->
This Agreement is governed by the laws of the **${input.jurisdiction}**, without regard to conflict of law principles. Any dispute shall be resolved by binding arbitration administered by the American Arbitration Association under its Commercial Arbitration Rules.

---

## 10. GENERAL
- **Entire Agreement:** This Agreement constitutes the entire agreement regarding its subject matter and supersedes all prior discussions
- **Amendment:** Modifications must be in writing signed by both Parties
- **Severability:** If any provision is unenforceable, it shall be modified to the minimum extent necessary to make it enforceable, and the remaining provisions continue in full force
- **Assignment:** Neither Party may assign this Agreement without prior written consent of the other Party

---

## SIGNATURES

By signing below, each Party agrees to be bound by the terms of this Agreement.

| **${input.disclosingParty}** | **${input.receivingParty}** |
|---|---|
| Signature: _________________________ | Signature: _________________________ |
| Name: ______________________________ | Name: ______________________________ |
| Title: ______________________________ | Title: ______________________________ |
| Date: _______________________________ | Date: _______________________________ |

---
*Generated by Nexus Legal AI — Not a substitute for legal counsel. Have this reviewed by a qualified attorney before signing.*
`;
}

// ── Terms of Service Generator ────────────────────────────────────
function generateTerms(input: z.infer<typeof TermsInput>): string {
  const date = input.effectiveDate ?? new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const url = input.websiteUrl ?? `www.${input.companyName.toLowerCase().replace(/\s/g, "")}.com`;

  return `# TERMS OF SERVICE
**${input.companyName} — ${input.serviceName}**
**Effective Date:** ${date}
**Jurisdiction:** ${input.jurisdiction}

${input.gdprCompliant ? "✓ GDPR Compliant  " : ""}${input.ccpaCompliant ? "✓ CCPA Compliant" : ""}

---

## 1. ACCEPTANCE OF TERMS
By accessing or using ${input.serviceName} ("Service") provided by ${input.companyName} ("Company," "we," "us"), you ("User") agree to be bound by these Terms of Service. If you do not agree, do not use the Service.

---

## 2. DESCRIPTION OF SERVICE
${input.companyName} provides ${input.serviceName} at ${url}. We reserve the right to modify, suspend, or discontinue the Service with reasonable notice.

---

## 3. ELIGIBILITY
You must be at least 18 years old (or the age of majority in your jurisdiction) to use the Service. By using the Service, you represent that you meet this requirement.

---

## 4. USER ACCOUNTS
- You are responsible for maintaining the confidentiality of your account credentials
- You are liable for all activity under your account
- Notify us immediately of any unauthorized access at legal@${url}
- We may terminate accounts that violate these Terms

---

## 5. ACCEPTABLE USE
You agree NOT to:
- Violate any applicable law or regulation
- Infringe intellectual property rights of any party
- Transmit malware, spam, or harmful code
- Attempt unauthorized access to our systems
- Scrape, mine, or harvest data without permission
- Use the Service for illegal activities

---

## 6. INTELLECTUAL PROPERTY
All content, trademarks, and software comprising the Service are owned by or licensed to ${input.companyName}. You receive a limited, non-exclusive, revocable license to use the Service for its intended purpose. You retain ownership of content you submit, but grant us a license to host, display, and process it to provide the Service.

---

## 7. PAYMENT TERMS
Where applicable, fees are charged as described on our pricing page. Payments are non-refundable except as required by law${input.ccpaCompliant ? " or as specified in our Refund Policy" : ""}. We may change fees with 30 days advance notice.

---

## 8. PRIVACY
Your use of the Service is governed by our Privacy Policy, incorporated herein by reference.${input.gdprCompliant ? " We comply with the EU General Data Protection Regulation (GDPR)." : ""}${input.ccpaCompliant ? " California residents have rights under the California Consumer Privacy Act (CCPA)." : ""}

---

## 9. DISCLAIMERS
THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE OR UNINTERRUPTED.

---

## 10. LIMITATION OF LIABILITY
TO THE MAXIMUM EXTENT PERMITTED BY LAW, ${input.companyName.toUpperCase()} SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.

---

## 11. INDEMNIFICATION
You agree to indemnify and hold harmless ${input.companyName} from any claims arising from your use of the Service, violation of these Terms, or infringement of any rights of a third party.

---

## 12. TERMINATION
We may suspend or terminate your access for violation of these Terms or for any reason with reasonable notice. Upon termination, your right to use the Service ceases immediately.

---

## 13. GOVERNING LAW
These Terms are governed by the laws of the ${input.jurisdiction}. Disputes shall be resolved by binding arbitration under AAA Commercial Rules, except for injunctive relief which may be sought in courts of competent jurisdiction.

---

## 14. CHANGES TO TERMS
We may update these Terms with 30 days notice. Continued use after notice constitutes acceptance of the updated Terms.

---

## 15. CONTACT
${input.companyName} — ${url}
Legal inquiries: legal@${url}

---
*Generated by Nexus Legal AI — Review with qualified legal counsel before publishing.*
`;
}

// ── Privacy Policy Generator ──────────────────────────────────────
function generatePrivacy(input: z.infer<typeof PrivacyInput>): string {
  const date = input.effectiveDate ?? new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const url = input.websiteUrl ?? `www.${input.companyName.toLowerCase().replace(/\s/g, "")}.com`;

  return `# PRIVACY POLICY
**${input.companyName}**
**Effective Date:** ${date}
**Last Updated:** ${date}

---

## 1. INTRODUCTION
${input.companyName} ("we," "us," "our") operates ${url}. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.

---

## 2. INFORMATION WE COLLECT
We collect the following categories of personal information:

**Directly from you:**
${input.dataTypes.map(d => `- ${d.charAt(0).toUpperCase() + d.slice(1)}`).join("\n")}

${input.hasAnalytics ? `**Automatically (Usage Data):**
- IP address, browser type, operating system
- Pages visited, time spent, referring URL
- Device identifiers
` : ""}
${input.hasCookies ? `**Cookies and Tracking Technologies:**
- Session cookies (required for functionality)
- Analytics cookies (with consent)
- Preference cookies
You may disable cookies via browser settings; some features may not function properly.
` : ""}

---

## 3. HOW WE USE YOUR INFORMATION
We use your information to:
- Provide, maintain, and improve our services
- Process transactions and send related information
- Send administrative communications
- Respond to comments and questions
- Monitor and analyze usage patterns
- Detect and prevent fraud${input.hasAnalytics ? "\n- Generate anonymized analytics reports" : ""}

**Legal Basis (GDPR):** We process data based on contract performance, legitimate interests, legal obligations, or your consent.

---

## 4. SHARING YOUR INFORMATION
We do not ${input.sellsData ? "" : "sell or "}rent personal information to third parties.

We may share information with:
- **Service Providers:** Who assist in our operations (hosting, analytics, payment processing) under confidentiality agreements
- **Legal Requirements:** When required by law or valid legal process
- **Business Transfers:** In connection with merger, acquisition, or asset sale
- **With Consent:** When you have given explicit consent

${input.sellsData ? "We may share or sell aggregated, de-identified data to third parties for business purposes. See **Your Rights** below to opt out.\n" : ""}

---

## 5. DATA RETENTION
We retain personal data for as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce agreements. You may request deletion as described in Your Rights below.

---

## 6. SECURITY
We implement technical and organizational measures including encryption in transit (TLS), access controls, and regular security assessments. No method of transmission is 100% secure; we cannot guarantee absolute security.

---

## 7. YOUR RIGHTS
**All Users:**
- Access and correction of your data
- Deletion of your account and associated data
- Objection to certain processing

${true ? `**GDPR Rights (EU/UK Residents):**
- Right to access (Art. 15)
- Right to rectification (Art. 16)
- Right to erasure / "right to be forgotten" (Art. 17)
- Right to restriction of processing (Art. 18)
- Right to data portability (Art. 20)
- Right to object (Art. 21)
- Right to lodge a complaint with a supervisory authority
` : ""}
**CCPA Rights (California Residents):**
- Know what personal information we collect, use, and share
- Delete your personal information
- Opt-out of the sale of personal information
- Non-discrimination for exercising your rights

To exercise your rights, contact us at privacy@${url}.

---

## 8. CHILDREN'S PRIVACY
We do not knowingly collect information from children under 13 (or under 16 in the EU). If we learn we have collected such data, we will delete it promptly.

---

## 9. CHANGES TO THIS POLICY
We will notify you of material changes by updating this page and, where required, by email. Check this page periodically for updates.

---

## 10. CONTACT US
**Privacy Officer**
${input.companyName}
${url}
Email: privacy@${url}

---
*Generated by Nexus Legal AI — Review with a privacy attorney before publishing.*
`;
}

// ── Service Agreement Generator ───────────────────────────────────
function generateAgreement(input: z.infer<typeof AgreementInput>): string {
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const typeLabel =
    input.agreementType === "msa" ? "Master Service Agreement" :
    input.agreementType === "sow" ? "Statement of Work" :
    input.agreementType === "freelancer" ? "Freelancer Agreement" :
    "Partnership Agreement";

  return `# ${typeLabel.toUpperCase()}
**Effective Date:** ${input.startDate ?? date}
**Client:** ${input.clientName}
**Vendor/Service Provider:** ${input.vendorName}${input.value ? `  \n**Contract Value:** ${input.value}` : ""}

---

## 1. SERVICES
<!-- Plain English: What work is being done -->
${input.vendorName} ("Vendor") agrees to provide the following services to ${input.clientName} ("Client"):

${input.services}

**Deliverables** and acceptance criteria shall be specified in mutually agreed Statements of Work, which are incorporated by reference.

---

## 2. TERM
- **Start Date:** ${input.startDate ?? "Upon execution"}
- **End Date:** ${input.endDate ?? "Upon completion of services or termination"}

---

## 3. PAYMENT TERMS
<!-- Plain English: When and how you get paid -->
- **Payment Schedule:** ${input.paymentTerms} from invoice date
- **Invoice Frequency:** Monthly (unless otherwise specified in SOW)
- **Late Payment:** Invoices unpaid after 15 days of due date accrue interest at 1.5% per month (18% APR), or the maximum rate permitted by law, whichever is less
- **Disputed Invoices:** Client must notify Vendor in writing within 10 business days of receipt; undisputed amounts remain due

---

## 4. INTELLECTUAL PROPERTY
<!-- Plain English: Who owns the work product -->
${input.agreementType === "freelancer"
  ? `All work product created by Vendor specifically for Client under this Agreement shall be considered **work made for hire** and shall be owned by Client upon full payment. Vendor retains ownership of pre-existing tools, frameworks, and methodologies.`
  : `Each party retains ownership of its pre-existing intellectual property. Work product created specifically under this Agreement is owned by Client upon full payment, unless otherwise specified in the applicable SOW.`}

---

## 5. CONFIDENTIALITY
Both parties agree to hold the other's Confidential Information in confidence and not disclose it to third parties without prior written consent, except as required by law. This obligation survives termination for 3 years.

---

## 6. LIABILITY AND INDEMNIFICATION
- **Liability Cap:** Each party's total liability is capped at the greater of (a) fees paid/payable in the 3 months preceding the claim, or (b) $50,000
- **Exclusions:** Neither party is liable for indirect, incidental, special, or consequential damages
- **Indemnification:** Each party indemnifies the other against third-party claims arising from its own gross negligence or willful misconduct

---

## 7. INDEPENDENT CONTRACTOR
<!-- Plain English: Vendor is not your employee -->
Vendor is an independent contractor, not an employee, agent, or partner of Client. Vendor is responsible for its own taxes, insurance, and benefits. Nothing in this Agreement creates an employment relationship.

---

## 8. TERMINATION
- **For Convenience:** Either party may terminate with 30 days written notice
- **For Cause:** Either party may terminate immediately if the other materially breaches and fails to cure within 15 days of written notice
- **Effect:** Client pays for all work completed and accepted through the termination date

---

## 9. WARRANTIES
Vendor warrants that: (a) services will be performed in a professional manner; (b) Vendor has the right to perform the services; (c) work product will not infringe third-party rights.

---

## 10. DISPUTE RESOLUTION
Disputes shall first be subject to good-faith negotiation for 30 days, then binding arbitration under AAA Commercial Rules in ${input.jurisdiction}. Each party bears its own legal fees.

---

## 11. GOVERNING LAW
This Agreement is governed by the laws of the ${input.jurisdiction}, without regard to conflict of law principles.

---

## 12. GENERAL
- **Entire Agreement:** Supersedes all prior understandings regarding its subject matter
- **Amendment:** Must be in writing signed by both parties
- **Assignment:** Neither party may assign without the other's written consent
- **Force Majeure:** Neither party is liable for delays caused by circumstances beyond its reasonable control
- **Severability:** Invalid provisions severed without affecting remainder

---

## SIGNATURES

| **${input.clientName}** | **${input.vendorName}** |
|---|---|
| Signature: _________________________ | Signature: _________________________ |
| Name: ______________________________ | Name: ______________________________ |
| Title: ______________________________ | Title: ______________________________ |
| Date: _______________________________ | Date: _______________________________ |

---
*Generated by Nexus Legal AI — Review with qualified legal counsel before signing.*
`;
}

// ── Router ────────────────────────────────────────────────────────
export const generateRouter = createRouter({
  create: authedQuery
    .input(GenerateInput)
    .mutation(async ({ input }) => {
      const start = Date.now();
      let content = "";
      let title = "";
      let documentType = "";

      switch (input.type) {
        case "nda":
          content = generateNda(input);
          title = `NDA — ${input.disclosingParty} / ${input.receivingParty} (${input.ndaType})`;
          documentType = "nda";
          break;
        case "terms":
          content = generateTerms(input);
          title = `Terms of Service — ${input.companyName}`;
          documentType = "terms";
          break;
        case "privacy":
          content = generatePrivacy(input);
          title = `Privacy Policy — ${input.companyName}`;
          documentType = "privacy";
          break;
        case "agreement":
          content = generateAgreement(input);
          title = `${input.agreementType.toUpperCase()} — ${input.clientName} / ${input.vendorName}`;
          documentType = "contract";
          break;
      }

      const wordCount = content.split(/\s+/).length;

      return {
        title,
        content,
        documentType,
        wordCount,
        processingTime: Date.now() - start,
        createdAt: new Date().toISOString(),
        warnings: [
          "This document is AI-generated and for reference only.",
          "Have a qualified attorney review before signing or publishing.",
          "Laws vary by jurisdiction — confirm compliance with local counsel.",
        ],
      };
    }),
});
