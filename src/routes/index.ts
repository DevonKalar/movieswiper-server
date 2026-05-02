import { Router } from 'express';
// Routers
import authRouter from './auth.js';
import openaiRouter from './openai.js';
import watchlistRouter from './watchlist.js';
import recommendationsRouter from './recommendations.js';
import reactionsRouter from './reactions.js';
import viewsRouter from './views.js';
import feedRouter from './feed.js';
// Middleware
import { requireUser } from '@middleware/auth.js';

const appRouter = Router();

appRouter.use('/auth', authRouter);
appRouter.use('/openai', openaiRouter);
appRouter.use('/watchlist', requireUser, watchlistRouter);
appRouter.use('/recommendations', recommendationsRouter);
appRouter.use('/reactions', requireUser, reactionsRouter);
appRouter.use('/views', requireUser, viewsRouter);
appRouter.use('/feed', requireUser, feedRouter);

export default appRouter;