import type { Movies } from '@/generated/prisma/client.js';

export type FeedMovie = Movies & { score: number };

export interface FeedResponse {
    movies: FeedMovie[];
}
