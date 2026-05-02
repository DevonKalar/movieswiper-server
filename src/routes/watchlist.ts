import { Router } from 'express';
import type { Request, Response } from 'express';
import { validateReqBody, validateReqParams } from '@middleware/validate.js';
import { addToWatchlistSchema, removeFromWatchlistSchema } from '@models/watchlist.js';
import type { AddToWatchlistInput, RemoveFromWatchlistParams } from '@models/watchlist.js';
import type {
    WatchlistResponse,
    BulkAddToWatchlistResponse,
    RemoveFromWatchlistResponse,
} from '@/types/watchlist.js';
import {
    getWatchlist,
    addBulkMoviesToWatchlist,
    removeMovieFromWatchlist,
} from '@/services/watchlist.js';

const watchlistRouter = Router();

watchlistRouter.get('/', async (req: Request, res: Response<WatchlistResponse>) => {
    const userWatchlist = await getWatchlist(req.user!.id);
    res.json({ watchlist: userWatchlist });
});

watchlistRouter.post(
    '/',
    validateReqBody(addToWatchlistSchema),
    async (req: Request, res: Response<BulkAddToWatchlistResponse>) => {
        const { movies } = req.validatedBody as AddToWatchlistInput;
        const count = await addBulkMoviesToWatchlist(req.user!.id, movies);
        res.status(201).json({ message: `${count} movies added to watchlist` });
    },
);

watchlistRouter.delete(
    '/:id',
    validateReqParams(removeFromWatchlistSchema),
    async (req: Request, res: Response<RemoveFromWatchlistResponse>) => {
        const { id } = req.validatedParams as RemoveFromWatchlistParams;
        await removeMovieFromWatchlist(req.user!.id, parseInt(id));
        res.status(204).send({ message: 'Movie removed from watchlist' });
    },
);

export default watchlistRouter;
