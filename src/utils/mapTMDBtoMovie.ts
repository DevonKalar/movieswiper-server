import { type TMDBMovie, type Movie } from '@/types/movie.js';
import { mapIdsToGenres } from '@utils/genreMapping.js';

export function apiMovieToMovie(movie: TMDBMovie): Movie {
    return {
        id: movie.id,
        title: movie.title,
        posterUrl: movie.poster_path ? 'https://image.tmdb.org/t/p/w500' + movie.poster_path : null,
        genres: mapIdsToGenres(movie.genre_ids || []),
        description: movie.overview || '',
        ratings: movie.vote_average || 0,
        releaseDate: movie.release_date || '',
    };
}

export function apiMoviesToMovies(movies: TMDBMovie[]): Movie[] {
    if (!movies || !Array.isArray(movies)) {
        return [];
    }
    return movies.map(apiMovieToMovie);
}
