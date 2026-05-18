import { authRouter } from "./auth-router";
import { createRouter, publicQuery } from "./middleware";
import { documentRouter } from "./routers/document";
import { analysisRouter } from "./routers/analysis";
import { precedentRouter } from "./routers/precedent";
import { statuteRouter } from "./routers/statute";
import { judgmentRouter } from "./routers/judgment";
import { contractRouter } from "./routers/contract";
import { analyticsRouter } from "./routers/analytics";
import { ethicalRouter } from "./routers/ethical";
import { contractReviewRouter } from "./routers/contract-review";
import { reportRouter } from "./routers/report";
import { aiEngineRouter } from "./routers/ai-engine";
import { batchReviewRouter } from "./routers/batch-review";
import { generateRouter } from "./routers/generate";

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
});

export type AppRouter = typeof appRouter;
