import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { documents, analyses } from "@db/schema";

export const documentRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        type: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input.type) conditions.push(eq(documents.type, input.type as any));
      if (input.status)
        conditions.push(eq(documents.status, input.status as any));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [rows, countResult] = await Promise.all([
        db
          .select()
          .from(documents)
          .where(where)
          .orderBy(desc(documents.createdAt))
          .limit(input.limit)
          .offset(input.offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(documents)
          .where(where),
      ]);

      const rowsWithCount = await Promise.all(
        rows.map(async (doc) => {
          const analysisCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(analyses)
            .where(eq(analyses.documentId, doc.id));
          return { ...doc, analysisCount: analysisCount[0]?.count ?? 0 };
        }),
      );

      return {
        items: rowsWithCount,
        total: countResult[0]?.count ?? 0,
      };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [doc] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, input.id))
        .limit(1);
      if (!doc) return null;

      const docAnalyses = await db
        .select()
        .from(analyses)
        .where(eq(analyses.documentId, doc.id))
        .orderBy(desc(analyses.createdAt));

      return { ...doc, analyses: docAnalyses };
    }),

  create: publicQuery
    .input(
      z.object({
        userId: z.number(),
        title: z.string().min(1).max(255),
        content: z.string().min(1),
        type: z.enum([
          "contract",
          "judgment",
          "statute",
          "brief",
          "pleading",
          "other",
        ]),
        fileUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(documents).values({
        userId: input.userId,
        title: input.title,
        content: input.content,
        type: input.type,
        fileUrl: input.fileUrl ?? null,
        status: "uploaded",
      });
      return { id: Number(result.insertId), ...input };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        content: z.string().min(1).optional(),
        status: z
          .enum(["uploaded", "processing", "analyzed", "failed"])
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...updates } = input;
      await db
        .update(documents)
        .set(updates)
        .where(eq(documents.id, id));
      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(documents).where(eq(documents.id, input.id));
      return { success: true };
    }),
});
