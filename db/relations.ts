import { relations } from "drizzle-orm";
import {
  users,
  documents,
  analyses,
  ethicalReviews,
  activityLog,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  activityLogs: many(activityLog),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
  analyses: many(analyses),
  ethicalReviews: many(ethicalReviews),
}));

export const analysesRelations = relations(analyses, ({ one }) => ({
  document: one(documents, {
    fields: [analyses.documentId],
    references: [documents.id],
  }),
}));

export const ethicalReviewsRelations = relations(ethicalReviews, ({ one }) => ({
  document: one(documents, {
    fields: [ethicalReviews.documentId],
    references: [documents.id],
  }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  user: one(users, {
    fields: [activityLog.userId],
    references: [users.id],
  }),
}));
