import { Router } from 'express';
import type { Request, Response } from 'express';
import { getFeed } from '@services/feed.js';
import type { FeedResponse } from '@/types/feed.js';

const feedRouter = Router();

feedRouter.get('/', async (req: Request, res: Response<FeedResponse>) => {
    const movies = await getFeed(req.user!.id);
    res.json({ movies });
});

export default feedRouter;
