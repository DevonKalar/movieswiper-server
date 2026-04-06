import { Router } from "express";
// Routers
import authRouter from "./auth.js";
import openaiRouter from "./openai.js";
import watchlistRouter from "./watchlist.js";
import recommendationsRouter from "./recommendations.js";
// Middleware
import { requireUser } from "@middleware/auth.js";

const appRouter = Router();

appRouter.use("/auth", authRouter);
appRouter.use("/openai", openaiRouter);
appRouter.use("/watchlist", requireUser, watchlistRouter);
appRouter.use("/recommendations", recommendationsRouter);

export default appRouter;
