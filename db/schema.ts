import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  decimal,
  int,
  json,
  date,
  boolean,
} from "drizzle-orm/mysql-core";

// ── Users ─────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── AI Engines ────────────────────────────────────────────────────
export const aiEngines = mysqlTable("aiEngines", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  provider: mysqlEnum("provider", ["deepseek", "kimi", "openai", "anthropic", "gemini", "custom"]).notNull(),
  model: varchar("model", { length: 255 }).notNull(),
  apiKey: varchar("apiKey", { length: 500 }),
  baseUrl: varchar("baseUrl", { length: 500 }),
  temperature: decimal("temperature", { precision: 3, scale: 2 }).default("0.7"),
  maxTokens: int("maxTokens").default(4096),
  isDefault: boolean("isDefault").default(false),
  isActive: boolean("isActive").default(true),
  userId: bigint("userId", { mode: "number", unsigned: true }).references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiEngine = typeof aiEngines.$inferSelect;

// ── Documents ─────────────────────────────────────────────────────
export const documents = mysqlTable("documents", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: mysqlEnum("type", ["contract", "judgment", "statute", "brief", "pleading", "nda", "terms", "privacy", "other"]).notNull(),
  status: mysqlEnum("status", ["uploaded", "processing", "analyzed", "failed"]).default("uploaded").notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }),
  fileSize: int("fileSize"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Document = typeof documents.$inferSelect;

// ── Contract Reviews (Flagship 5-Agent Pipeline) ────────────────
export const contractReviews = mysqlTable("contractReviews", {
  id: serial("id").primaryKey(),
  documentId: bigint("documentId", { mode: "number", unsigned: true }).notNull().references(() => documents.id),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull().references(() => users.id),
  safetyScore: int("safetyScore"),
  letterGrade: varchar("letterGrade", { length: 5 }),
  highRiskCount: int("highRiskCount").default(0),
  mediumRiskCount: int("mediumRiskCount").default(0),
  lowRiskCount: int("lowRiskCount").default(0),
  // 5 Agent Results
  clauseAnalysis: json("clauseAnalysis"),
  riskAssessment: json("riskAssessment"),
  complianceFlags: json("complianceFlags"),
  obligationsMap: json("obligationsMap"),
  recommendations: json("recommendations"),
  // Derived outputs
  plainEnglish: json("plainEnglish"),
  negotiationStrategy: json("negotiationStrategy"),
  missingProtections: json("missingProtections"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  processingTime: int("processingTime"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContractReview = typeof contractReviews.$inferSelect;

// ── Analyses ──────────────────────────────────────────────────────
export const analyses = mysqlTable("analyses", {
  id: serial("id").primaryKey(),
  documentId: bigint("documentId", { mode: "number", unsigned: true }).notNull().references(() => documents.id),
  type: mysqlEnum("type", [
    "contract_review", "judgment_summary", "statute_identification",
    "risk_assessment", "precedent_search", "compliance_check",
    "sentiment_analysis", "ethical_review", "plain_english",
    "negotiate", "missing_protection", "freelancer_review",
    "terms_generator", "privacy_generator",
  ]).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  result: json("result"),
  summary: text("summary"),
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  processingTime: int("processingTime"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Analysis = typeof analyses.$inferSelect;

// ── Precedents ────────────────────────────────────────────────────
export const precedents = mysqlTable("precedents", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  citation: varchar("citation", { length: 255 }).notNull().unique(),
  court: varchar("court", { length: 255 }).notNull(),
  jurisdiction: varchar("jurisdiction", { length: 255 }).notNull(),
  date: date("date").notNull(),
  summary: text("summary").notNull(),
  fullText: text("fullText").notNull(),
  tags: json("tags"),
  relevanceScore: decimal("relevanceScore", { precision: 5, scale: 4 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ── Statutes ──────────────────────────────────────────────────────
export const statutes = mysqlTable("statutes", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  code: varchar("code", { length: 255 }).notNull().unique(),
  jurisdiction: varchar("jurisdiction", { length: 255 }).notNull(),
  section: varchar("section", { length: 255 }).notNull(),
  description: text("description").notNull(),
  fullText: text("fullText").notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  effectiveDate: date("effectiveDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ── Judgments ─────────────────────────────────────────────────────
export const judgments = mysqlTable("judgments", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  caseNumber: varchar("caseNumber", { length: 255 }).notNull().unique(),
  court: varchar("court", { length: 255 }).notNull(),
  date: date("date").notNull(),
  parties: json("parties").notNull(),
  summary: text("summary").notNull(),
  fullText: text("fullText").notNull(),
  holding: text("holding").notNull(),
  rhetoricLabels: json("rhetoricLabels"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ── Ethical Reviews ───────────────────────────────────────────────
export const ethicalReviews = mysqlTable("ethicalReviews", {
  id: serial("id").primaryKey(),
  documentId: bigint("documentId", { mode: "number", unsigned: true }).notNull().references(() => documents.id),
  biasScore: decimal("biasScore", { precision: 5, scale: 4 }),
  fairnessScore: decimal("fairnessScore", { precision: 5, scale: 4 }),
  transparencyScore: decimal("transparencyScore", { precision: 5, scale: 4 }),
  privacyScore: decimal("privacyScore", { precision: 5, scale: 4 }),
  concerns: json("concerns"),
  recommendations: json("recommendations"),
  overallAssessment: text("overallAssessment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ── Reports ───────────────────────────────────────────────────────
export const reports = mysqlTable("reports", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["contract_review", "risk_assessment", "compliance_audit", "ethical_review", "negotiation_strategy"]).notNull(),
  entityId: bigint("entityId", { mode: "number", unsigned: true }).notNull(),
  entityType: mysqlEnum("entityType", ["contractReview", "analysis", "document"]).notNull(),
  content: json("content").notNull(),
  safetyScore: int("safetyScore"),
  fileUrl: varchar("fileUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;

// ── Activity Log ──────────────────────────────────────────────────
export const activityLog = mysqlTable("activityLog", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull().references(() => users.id),
  action: mysqlEnum("action", ["upload", "analyze", "generate", "search", "export", "login", "share"]).notNull(),
  entityType: mysqlEnum("entityType", ["document", "analysis", "precedent", "statute", "judgment", "contract"]).notNull(),
  entityId: bigint("entityId", { mode: "number", unsigned: true }).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
