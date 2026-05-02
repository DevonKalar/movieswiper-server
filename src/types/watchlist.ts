import type { Watchlist, Movies } from '@/generated/prisma/client.js';

// Domain types
export type WatchlistItemWithMovie = Watchlist & {
    movie: Movies;
};

// Response types
export type WatchlistResponse = {
    watchlist: WatchlistItemWithMovie[];
};

export type BulkAddToWatchlistResponse = {
    message: string;
};

export type RemoveFromWatchlistResponse = {
    message: string;
};

// Error responses
export type WatchlistErrorResponse = {
    message: string;
};
