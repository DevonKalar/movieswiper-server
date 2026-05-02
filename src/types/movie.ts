import type { Movies } from '@/generated/prisma/client.js';

export type Movie = Omit<Movies, 'tmdbId' | 'releaseDate' | 'createdAt' | 'updatedAt'> & {
    id: number;
    releaseDate: string;
};

export interface TMDBMovie {
    id: number;
    title: string;
    genre_ids: number[];
    poster_path: string | null;
    overview: string;
    vote_average: number;
    release_date: string;
}
