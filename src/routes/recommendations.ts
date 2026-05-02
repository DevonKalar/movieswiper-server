import { Router } from 'express';
import type { Request, Response } from 'express';
import { validateReqQuery } from '../middleware/validate.js';
import { movieRecommendationSchema } from '@/models/recommendations.js';
import type { RecommendationQuery } from '@/models/recommendations.js';
import type { RecommendationsResponse } from '@/types/recommendations.js';
import { optionalUser } from '@middleware/auth.js';
import { fetchUserRecommendations, fetchGuestRecommendations } from '@/services/recommendations.js';

const recommendationsRouter = Router();

recommendationsRouter.get(
    '/',
    optionalUser,
    validateReqQuery(movieRecommendationSchema),
    async (req: Request, res: Response<RecommendationsResponse>) => {
        const { page } = req.validatedQuery as RecommendationQuery;
        const pageNumber = parseInt(page, 10);
        const userId = req.user?.id;
        const response = userId
            ? await fetchUserRecommendations(userId, pageNumber)
            : await fetchGuestRecommendations(pageNumber);
        res.json(response);
    },
);

export default recommendationsRouter;
