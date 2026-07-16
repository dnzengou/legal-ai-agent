import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware.js";
import { getDb } from "../queries/connection.js";
import { aiEngines } from "../../db/schema.js";

export const aiEngineRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(aiEngines).orderBy(desc(aiEngines.createdAt));
  }),

  getDefault: publicQuery.query(async () => {
    const db = getDb();
    const [row] = await db.select().from(aiEngines).where(eq(aiEngines.isDefault, true)).limit(1);
    return row ?? null;
  }),

  create: publicQuery
    .input(z.object({
      name: z.string().min(1),
      provider: z.enum(["deepseek", "kimi", "openai", "anthropic", "gemini", "custom"]),
      model: z.string().min(1),
      baseUrl: z.string().optional(),
      temperature: z.string().optional(),
      maxTokens: z.number().optional(),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      if (input.isDefault) {
        await db.update(aiEngines).set({ isDefault: false }).where(eq(aiEngines.isDefault, true));
      }
      const [result] = await db.insert(aiEngines).values({
        name: input.name,
        provider: input.provider,
        model: input.model,
        baseUrl: input.baseUrl ?? null,
        temperature: input.temperature ?? "0.7",
        maxTokens: input.maxTokens ?? 4096,
        isDefault: input.isDefault ?? false,
        isActive: true,
      });
      return { id: Number(result.insertId) };
    }),

  update: publicQuery
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      model: z.string().optional(),
      baseUrl: z.string().optional(),
      temperature: z.string().optional(),
      maxTokens: z.number().optional(),
      isDefault: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...updates } = input;
      if (updates.isDefault) {
        await db.update(aiEngines).set({ isDefault: false }).where(eq(aiEngines.isDefault, true));
      }
      await db.update(aiEngines).set(updates).where(eq(aiEngines.id, id));
      return { success: true };
    }),

  delete: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.delete(aiEngines).where(eq(aiEngines.id, input.id));
    return { success: true };
  }),
});
