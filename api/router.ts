import { authRouter } from "./auth-router.js";
import { createRouter, publicQuery } from "./middleware.js";
import { documentRouter } from "./routers/document.js";
import { analysisRouter } from "./routers/analysis.js";
import { precedentRouter } from "./routers/precedent.js";
import { statuteRouter } from "./routers/statute.js";
import { judgmentRouter } from "./routers/judgment.js";
import { contractRouter } from "./routers/contract.js";
import { analyticsRouter } from "./routers/analytics.js";
import { ethicalRouter } from "./routers/ethical.js";
import { contractReviewRouter } from "./routers/contract-review.js";
import { reportRouter } from "./routers/report.js";
import { aiEngineRouter } from "./routers/ai-engine.js";
import { batchReviewRouter } from "./routers/batch-review.js";
import { generateRouter } from "./routers/generate.js";
import { chatRouter } from "./routers/chat.js";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  document: documentRouter,
  analysis: analysisRouter,
  precedent: precedentRouter,
  statute: statuteRouter,
  judgment: judgmentRouter,
  contract: contractRouter,
  analytics: analyticsRouter,
  ethical: ethicalRouter,
  contractReview: contractReviewRouter,
  report: reportRouter,
  aiEngine: aiEngineRouter,
  batchReview: batchReviewRouter,
  generate: generateRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
