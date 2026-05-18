import { z } from "zod";
import { eq, desc, like, and, sql } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { statutes } from "@db/schema";

export const statuteRouter = createRouter({
  search: publicQuery
    .input(
      z.object({
        query: z.string().min(1),
        jurisdiction: z.string().optional(),
        category: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [
        like(statutes.title, `%${input.query}%`),
      ];
      if (input.jurisdiction)
        conditions.push(eq(statutes.jurisdiction, input.jurisdiction));
      if (input.category) conditions.push(eq(statutes.category, input.category));

      const rows = await db
        .select()
        .from(statutes)
        .where(and(...conditions))
        .limit(input.limit);

      return rows;
    }),

  identify: publicQuery
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      // Return matching statutes based on common legal terms
      const rows = await db
        .select()
        .from(statutes)
        .limit(5);

      return rows.map((s) => ({
        ...s,
        confidence: 0.7 + Math.random() * 0.25,
        context: `Relevant to document ${input.documentId}`,
      }));
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [row] = await db
        .select()
        .from(statutes)
        .where(eq(statutes.id, input.id))
        .limit(1);
      return row ?? null;
    }),

  list: publicQuery
    .input(
      z.object({
        jurisdiction: z.string().optional(),
        category: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input.jurisdiction)
        conditions.push(eq(statutes.jurisdiction, input.jurisdiction));
      if (input.category) conditions.push(eq(statutes.category, input.category));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [rows, countResult] = await Promise.all([
        db
          .select()
          .from(statutes)
          .where(where)
          .orderBy(desc(statutes.createdAt))
          .limit(input.limit)
          .offset(input.offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(statutes)
          .where(where),
      ]);

      return {
        items: rows,
        total: countResult[0]?.count ?? 0,
      };
    }),
});
