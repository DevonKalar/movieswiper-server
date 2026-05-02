import * as z from 'zod';

const movieSchema = z.object({
    id: z.number(),
    title: z.string(),
    description: z.string(),
    releaseDate: z.string(),
    posterUrl: z.string(),
    genres: z.array(z.string()),
    ratings: z.number(),
});

export const addToWatchlistSchema = z.object({
    movies: z.array(movieSchema),
});

export const removeFromWatchlistSchema = z.object({
    id: z.string().min(1),
});

export type AddToWatchlistInput = z.infer<typeof addToWatchlistSchema>;
export type RemoveFromWatchlistParams = z.infer<typeof removeFromWatchlistSchema>;
