import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { reports } from "@db/schema";

export const reportRouter = createRouter({
  create: publicQuery
    .input(z.object({
      userId: z.number(),
      title: z.string().min(1),
      type: z.enum(["contract_review", "risk_assessment", "compliance_audit", "ethical_review", "negotiation_strategy"]),
      entityId: z.number(),
      entityType: z.enum(["contractReview", "analysis", "document"]),
      content: z.record(z.string(), z.any()),
      safetyScore: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(reports).values([{
        userId: input.userId,
        title: input.title,
        type: input.type,
        entityId: input.entityId,
        entityType: input.entityType,
        content: input.content,
        safetyScore: input.safetyScore,
      }] as const);
      return { id: Number(result.insertId) };
    }),

  list: publicQuery
    .input(z.object({ userId: z.number().optional(), limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = input.userId ? [eq(reports.userId, input.userId)] : [];
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const [rows, countResult] = await Promise.all([
        db.select().from(reports).where(where).orderBy(desc(reports.createdAt)).limit(input.limit).offset(input.offset),
        db.select({ count: sql<number>`count(*)` }).from(reports).where(where),
      ]);
      return { items: rows, total: countResult[0]?.count ?? 0 };
    }),

  getById: publicQuery.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = getDb();
    const [row] = await db.select().from(reports).where(eq(reports.id, input.id)).limit(1);
    return row ?? null;
  }),

  delete: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.delete(reports).where(eq(reports.id, input.id));
    return { success: true };
  }),
});
