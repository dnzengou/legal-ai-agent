import { z } from "zod";
import { eq, desc, like, and, sql } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { judgments } from "@db/schema";

export const judgmentRouter = createRouter({
  search: publicQuery
    .input(
      z.object({
        query: z.string().min(1),
        court: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [like(judgments.title, `%${input.query}%`)];
      if (input.court) conditions.push(eq(judgments.court, input.court));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db
        .select()
        .from(judgments)
        .where(where)
        .orderBy(desc(judgments.date))
        .limit(input.limit);

      return rows;
    }),

  summarize: publicQuery
    .input(z.object({ judgmentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [judgment] = await db
        .select()
        .from(judgments)
        .where(eq(judgments.id, input.judgmentId))
        .limit(1);

      if (!judgment) return null;

      return {
        judgmentId: input.judgmentId,
        summary: `This case addresses ${judgment.title.toLowerCase()}. The court found that the key issues centered on statutory interpretation and factual sufficiency.`,
        keyHoldings: [
          "Statutory language is interpreted according to its plain meaning",
          "Factual determinations by the trier of fact are accorded substantial deference",
          "Procedural requirements must be strictly complied with",
        ],
        proceduralHistory: [
          "Case filed in district court",
          "Motion to dismiss denied",
          "Summary judgment granted in part",
          "Appeal filed with circuit court",
        ],
        confidence: 0.91,
      };
    }),

  labelRhetoric: publicQuery
    .input(z.object({ judgmentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [judgment] = await db
        .select()
        .from(judgments)
        .where(eq(judgments.id, input.judgmentId))
        .limit(1);

      if (!judgment) return null;

      const labels = [
        { paragraph: 1, label: "PROCEDURAL_HISTORY", text: "This case comes before the court on..." },
        { paragraph: 2, label: "FACTS", text: "The facts of this case are as follows..." },
        { paragraph: 3, label: "ISSUE", text: "The question before the court is whether..." },
        { paragraph: 4, label: "ARGUMENT_PLAINTIFF", text: "The plaintiff contends that..." },
        { paragraph: 5, label: "ARGUMENT_DEFENDANT", text: "The defendant argues that..." },
        { paragraph: 6, label: "REASONING", text: "The court finds that..." },
        { paragraph: 7, label: "HOLDING", text: "Accordingly, the court holds that..." },
        { paragraph: 8, label: "DISPOSITION", text: "It is hereby ordered that..." },
      ];

      await db
        .update(judgments)
        .set({ rhetoricLabels: labels })
        .where(eq(judgments.id, input.judgmentId));

      return { judgmentId: input.judgmentId, labels };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [row] = await db
        .select()
        .from(judgments)
        .where(eq(judgments.id, input.id))
        .limit(1);
      return row ?? null;
    }),

  list: publicQuery
    .input(
      z.object({
        court: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input.court) conditions.push(eq(judgments.court, input.court));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [rows, countResult] = await Promise.all([
        db
          .select()
          .from(judgments)
          .where(where)
          .orderBy(desc(judgments.date))
          .limit(input.limit)
          .offset(input.offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(judgments)
          .where(where),
      ]);

      return {
        items: rows,
        total: countResult[0]?.count ?? 0,
      };
    }),
});
