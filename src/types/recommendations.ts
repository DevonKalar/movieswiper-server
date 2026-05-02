import type { Movie } from './movie.js';

// Response types
export type RecommendationsResponse = {
    results: Movie[];
    nextPage: number | null;
};

// Error responses
export type RecommendationsErrorResponse = {
    error: string;
};
