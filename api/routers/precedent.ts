import { z } from "zod";
import { eq, desc, like, and, sql } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware.js";
import { getDb } from "../queries/connection.js";
import { precedents } from "../../db/schema.js";

export const precedentRouter = createRouter({
  search: publicQuery
    .input(
      z.object({
        query: z.string().min(1),
        jurisdiction: z.string().optional(),
        court: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [
        like(precedents.title, `%${input.query}%`),
      ];
      if (input.jurisdiction)
        conditions.push(eq(precedents.jurisdiction, input.jurisdiction));
      if (input.court) conditions.push(eq(precedents.court, input.court));

      const rows = await db
        .select()
        .from(precedents)
        .where(and(...conditions))
        .orderBy(desc(precedents.relevanceScore))
        .limit(input.limit);

      return rows.map((r) => ({
        ...r,
        relevanceScore: Number(r.relevanceScore),
      }));
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [row] = await db
        .select()
        .from(precedents)
        .where(eq(precedents.id, input.id))
        .limit(1);
      return row ?? null;
    }),

  list: publicQuery
    .input(
      z.object({
        jurisdiction: z.string().optional(),
        court: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input.jurisdiction)
        conditions.push(eq(precedents.jurisdiction, input.jurisdiction));
      if (input.court) conditions.push(eq(precedents.court, input.court));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [rows, countResult] = await Promise.all([
        db
          .select()
          .from(precedents)
          .where(where)
          .orderBy(desc(precedents.createdAt))
          .limit(input.limit)
          .offset(input.offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(precedents)
          .where(where),
      ]);

      return {
        items: rows,
        total: countResult[0]?.count ?? 0,
      };
    }),
});
