import { getDb } from "../api/queries/connection.js";
import { precedents, statutes, judgments } from "./schema.js";

async function seed() {
  const db = getDb();
  console.log("Seeding database with legal data...");

  // Seed precedents
  const precedentData = [
    {
      title: "Landmark Decision on Digital Privacy Rights in Contract Law",
      citation: "Smith v. TechCorp, 563 U.S. 419 (2024)",
      court: "Supreme Court of the United States",
      jurisdiction: "Federal",
      date: new Date("2024-03-15"),
      summary: "The Supreme Court held that digital privacy clauses in service agreements must be explicitly opt-in rather than buried in terms of service. This landmark decision reshaped how technology companies structure their user agreements.",
      fullText: "The Supreme Court of the United States, in a 6-3 decision, ruled that...",
      tags: ["privacy", "contracts", "digital rights", "technology"],
      relevanceScore: "9.5",
    },
    {
      title: "Establishing Precedent for AI-Generated Content Liability",
      citation: "Andersen v. Stability AI, 891 F.3d 112 (9th Cir. 2023)",
      court: "U.S. Court of Appeals for the Ninth Circuit",
      jurisdiction: "Federal",
      date: new Date("2023-11-08"),
      summary: "The Ninth Circuit established that AI-generated content may be subject to traditional copyright infringement analysis, creating a framework for evaluating machine-created works.",
      fullText: "The Court of Appeals for the Ninth Circuit considered whether...",
      tags: ["AI", "copyright", "technology", "intellectual property"],
      relevanceScore: "9.2",
    },
    {
      title: "Clarifying Force Majeure in Pandemic-Era Commercial Contracts",
      citation: "In re Hotel Group Litigation, 456 F. Supp. 3d 78 (S.D.N.Y. 2022)",
      court: "U.S. District Court for the Southern District of New York",
      jurisdiction: "Federal",
      date: new Date("2022-07-22"),
      summary: "This decision clarified that pandemic-related disruptions may qualify as force majeure events depending on specific contract language and jurisdictional precedent.",
      fullText: "The District Court for the Southern District of New York held that...",
      tags: ["force majeure", "pandemic", "commercial law", "contracts"],
      relevanceScore: "8.8",
    },
    {
      title: "Duty of Care in Automated Decision-Making Systems",
      citation: "Doe v. Algorithmic Services Inc., 234 F.3d 567 (D.C. Cir. 2024)",
      court: "U.S. Court of Appeals for the D.C. Circuit",
      jurisdiction: "Federal",
      date: new Date("2024-01-30"),
      summary: "The D.C. Circuit held that companies deploying automated decision-making systems owe a duty of care to affected individuals, establishing tort liability for algorithmic harm.",
      fullText: "The Court of Appeals for the D.C. Circuit addressed the novel question of...",
      tags: ["AI", "tort", "automation", "duty of care"],
      relevanceScore: "8.5",
    },
    {
      title: "Securities Fraud Liability for Misleading ESG Disclosures",
      citation: "SEC v. GreenEnergy Corp., 789 F.3d 234 (2d Cir. 2023)",
      court: "U.S. Court of Appeals for the Second Circuit",
      jurisdiction: "Federal",
      date: new Date("2023-09-14"),
      summary: "The Second Circuit upheld SEC findings that materially misleading ESG disclosures can constitute securities fraud, setting an important precedent for corporate sustainability reporting.",
      fullText: "The Court of Appeals for the Second Circuit reviewed the SEC's determination that...",
      tags: ["securities", "ESG", "fraud", "corporate law"],
      relevanceScore: "8.1",
    },
    {
      title: "Jurisdiction in Cross-Border Data Breach Cases",
      citation: "EU Citizens v. CloudSys LLC, 678 F.3d 890 (7th Cir. 2023)",
      court: "U.S. Court of Appeals for the Seventh Circuit",
      jurisdiction: "Federal",
      date: new Date("2023-05-18"),
      summary: "The Seventh Circuit ruled that U.S. courts may exercise jurisdiction over foreign data subjects in cross-border breach cases when sufficient minimum contacts exist.",
      fullText: "The Court of Appeals for the Seventh Circuit analyzed the personal jurisdiction...",
      tags: ["data breach", "jurisdiction", "privacy", "international"],
      relevanceScore: "7.9",
    },
  ];

  for (const p of precedentData) {
    await db.insert(precedents).values(p);
  }
  console.log(`Seeded ${precedentData.length} precedents`);

  // Seed statutes
  const statuteData = [
    {
      title: "Computer Fraud and Abuse Act",
      code: "18 U.S.C. § 1030",
      jurisdiction: "Federal",
      section: "§ 1030",
      description: "Prohibits unauthorized access to protected computers and defines penalties for various forms of computer-related fraud and abuse.",
      fullText: "(a) Whoever— (1) having knowingly accessed a computer without authorization or exceeding authorized access...",
      category: "Cybercrime",
      effectiveDate: new Date("1986-10-12"),
    },
    {
      title: "Digital Millennium Copyright Act",
      code: "17 U.S.C. § 1201",
      jurisdiction: "Federal",
      section: "§ 1201",
      description: "Criminalizes production and dissemination of technology that circumvents copyright protection measures.",
      fullText: "(a) Violations Regarding Circumvention of Technological Measures.— (1)(A) No person shall circumvent a technological measure...",
      category: "Copyright",
      effectiveDate: new Date("1998-10-28"),
    },
    {
      title: "California Consumer Privacy Act",
      code: "Cal. Civ. Code § 1798.100",
      jurisdiction: "California",
      section: "§ 1798.100",
      description: "Grants California consumers rights to know about, delete, and opt-out of the sale of their personal information.",
      fullText: "(a) A consumer shall have the right to request that a business that collects a consumer's personal information...",
      category: "Privacy",
      effectiveDate: new Date("2020-01-01"),
    },
    {
      title: "General Data Protection Regulation (US Reference)",
      code: "Regulation (EU) 2016/679",
      jurisdiction: "International",
      section: "Art. 1-99",
      description: "Comprehensive EU data protection regulation that affects US companies processing EU citizen data.",
      fullText: "Article 1 - Subject-matter and objectives...",
      category: "Privacy",
      effectiveDate: new Date("2018-05-25"),
    },
    {
      title: "Uniform Commercial Code Article 2",
      code: "UCC § 2-101",
      jurisdiction: "Multi-State",
      section: "§ 2-101",
      description: "Governs contracts for the sale of goods in the United States, providing default rules and remedies.",
      fullText: "This Article shall be known and may be cited as Uniform Commercial Code—Sales...",
      category: "Commercial",
      effectiveDate: new Date("1952-01-01"),
    },
    {
      title: "Electronic Signatures in Global and National Commerce Act",
      code: "15 U.S.C. § 7001",
      jurisdiction: "Federal",
      section: "§ 7001",
      description: "Grants legal validity to electronic signatures and records in interstate and foreign commerce.",
      fullText: "(a) In General.— Notwithstanding any statute, regulation, or other rule of law...",
      category: "Technology",
      effectiveDate: new Date("2000-06-30"),
    },
  ];

  for (const s of statuteData) {
    await db.insert(statutes).values(s);
  }
  console.log(`Seeded ${statuteData.length} statutes`);

  // Seed judgments
  const judgmentData = [
    {
      title: "Contractual Interpretation of Ambiguous Force Majeure Clauses",
      caseNumber: "2024-CV-00452",
      court: "U.S. District Court for the Southern District of New York",
      date: new Date("2024-06-20"),
      parties: { plaintiff: "Global Shipping Corp.", defendant: "Port Authority of NY/NJ" },
      summary: "The court interpreted an ambiguous force majeure clause in a maritime shipping contract, finding that supply chain disruptions alone did not trigger the clause absent explicit pandemic language.",
      fullText: "This matter comes before the Court on Defendant's motion for summary judgment...",
      holding: "Supply chain disruptions, without explicit pandemic language in the force majeure clause, do not excuse contractual performance. Courts must apply the plain meaning rule to unambiguous contract language.",
    },
    {
      title: "Liability of AI Systems Under Product Liability Doctrine",
      caseNumber: "2023-CV-01892",
      court: "California Superior Court, San Francisco County",
      date: new Date("2024-02-14"),
      parties: { plaintiff: "Jane Doe", defendant: "Autonomous Vehicle Systems Inc." },
      summary: "A landmark ruling on AI product liability, finding that autonomous vehicle manufacturers can be held strictly liable for algorithmic decision-making failures under traditional product liability theory.",
      fullText: "Plaintiff Jane Doe brings this action against Defendant Autonomous Vehicle Systems Inc. for injuries sustained...",
      holding: "Autonomous vehicle manufacturers may be held strictly liable under product liability doctrine for algorithmic failures that result in harm, regardless of whether traditional manufacturing defects are present.",
    },
    {
      title: "Trade Secret Misappropriation via LLM Training Data",
      caseNumber: "2024-CV-00781",
      court: "U.S. District Court for the Northern District of California",
      date: new Date("2024-09-05"),
      parties: { plaintiff: "ConfidentialTech Inc.", defendant: "OpenAI LP" },
      summary: "Novel case addressing whether training large language models on proprietary source code constitutes trade secret misappropriation under the Defend Trade Secrets Act.",
      fullText: "Plaintiff ConfidentialTech Inc. alleges that Defendant OpenAI LP misappropriated its proprietary source code...",
      holding: "Training AI models on publicly available code may constitute trade secret misappropriation if the code was obtained through unauthorized means or in breach of confidentiality obligations.",
    },
    {
      title: "Constitutional Challenges to Algorithmic Sentencing Tools",
      caseNumber: "2023-CV-01567",
      court: "U.S. District Court for the Eastern District of Wisconsin",
      date: new Date("2024-04-22"),
      parties: { plaintiff: "State ex rel. Williams", defendant: "Wisconsin Department of Corrections" },
      summary: "Court addressed constitutional challenges to the use of COMPAS risk assessment tools in sentencing, finding that due process requires transparency in algorithmic decision-making.",
      fullText: "Petitioner Williams challenges the use of the COMPAS risk assessment tool in his sentencing hearing...",
      holding: "The use of proprietary risk assessment tools in criminal sentencing does not violate due process provided defendants have access to the factors considered and opportunity to challenge the results.",
    },
  ];

  for (const j of judgmentData) {
    await db.insert(judgments).values(j);
  }
  console.log(`Seeded ${judgmentData.length} judgments`);

  console.log("Seeding complete!");
}

seed().catch(console.error);
