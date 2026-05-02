import * as z from 'zod';

export const movieRecommendationSchema = z.object({
    page: z.string().regex(/^\d+$/).default('1'),
});

export type RecommendationQuery = z.infer<typeof movieRecommendationSchema>;
