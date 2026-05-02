// Response types
export type TMDBGenre = {
    id: number;
    name: string;
};

export type TMDBMovieDetails = {
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    runtime: number;
    genres: TMDBGenre[];
    status: string;
};

export type TMDBMoviesResponse = {
    page: number;
    results: unknown[];
    total_pages: number;
    total_results: number;
};

export type TMDBGenresResponse = {
    genres: TMDBGenre[];
};

// Error responses
export type TMDBErrorResponse = {
    error: string;
};
