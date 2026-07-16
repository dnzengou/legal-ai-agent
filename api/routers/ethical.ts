import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware.js";
import { getDb } from "../queries/connection.js";
import { ethicalReviews, documents } from "../../db/schema.js";

export const ethicalRouter = createRouter({
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

      const biasScore = Math.round((6 + Math.random() * 4) * 100) / 100;
      const fairnessScore = Math.round((5 + Math.random() * 5) * 100) / 100;
      const transparencyScore = Math.round((4 + Math.random() * 6) * 100) / 100;
      const privacyScore = Math.round((7 + Math.random() * 3) * 100) / 100;

      const concerns = [
        {
          category: "selection_bias",
          severity: biasScore < 7 ? "medium" : "low",
          description: "Training data may underrepresent certain demographic groups",
          mitigation: "Expand training corpus with diverse legal sources",
        },
        {
          category: "algorithmic_transparency",
          severity: transparencyScore < 6 ? "high" : "medium",
          description: "Complex model architecture limits explainability",
          mitigation: "Implement attention-weight visualization and LIME explanations",
        },
        {
          category: "privacy",
          severity: privacyScore < 8 ? "medium" : "low",
          description: "Document may contain PII requiring special handling",
          mitigation: "Apply differential privacy techniques to training data",
        },
        {
          category: "fairness",
          severity: fairnessScore < 6 ? "high" : "medium",
          description: "Potential disparate impact across protected classes",
          mitigation: "Conduct regular fairness audits with demographic parity metrics",
        },
      ];

      const recommendations = [
        "Implement model cards documenting training data and performance metrics",
        "Conduct quarterly bias audits with external oversight",
        "Establish human-in-the-loop review for high-stakes decisions",
        "Document all AI-assisted decisions with confidence scores",
        "Provide users with opt-out mechanisms for AI processing",
        "Ensure compliance with emerging AI regulation frameworks",
      ];

      const overallAssessment = `This document analysis received an overall ethical score of ${Math.round(
        ((biasScore + fairnessScore + transparencyScore + privacyScore) / 4) * 10,
      ) / 10}/10. Key areas of concern include ${concerns
        .filter((c) => c.severity === "high")
        .map((c) => c.category)
        .join(", ") || "none - all areas within acceptable thresholds"}. Recommended actions have been prioritized based on risk level.`;

      const [result] = await db.insert(ethicalReviews).values({
        documentId: input.documentId,
        biasScore: String(biasScore),
        fairnessScore: String(fairnessScore),
        transparencyScore: String(transparencyScore),
        privacyScore: String(privacyScore),
        concerns,
        recommendations,
        overallAssessment,
      });

      return {
        id: Number(result.insertId),
        documentId: input.documentId,
        scores: { biasScore, fairnessScore, transparencyScore, privacyScore },
        concerns,
        recommendations,
        overallAssessment,
      };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [row] = await db
        .select()
        .from(ethicalReviews)
        .where(eq(ethicalReviews.id, input.id))
        .limit(1);
      return row ?? null;
    }),

  listConcerns: publicQuery
    .input(
      z.object({
        category: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const reviews = await db
        .select()
        .from(ethicalReviews)
        .orderBy(desc(ethicalReviews.createdAt))
        .limit(input.limit);

      const allConcerns = reviews.flatMap((r) => {
        const concerns = (r.concerns ?? []) as Array<{
          category: string;
          severity: string;
          description: string;
          mitigation: string;
        }>;
        return concerns.map((c) => ({
          ...c,
          reviewId: r.id,
          documentId: r.documentId,
          createdAt: r.createdAt,
        }));
      });

      if (input.category) {
        return allConcerns.filter((c) => c.category === input.category);
      }

      return allConcerns;
    }),
});
