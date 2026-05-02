import { tmdbAxios } from '@/lib/tmdbAxios.js';
import { type MovieQuery } from '@models/tmdb.js';

export async function fetchMovieDetails(movieId: number) {
    try {
        const { data } = await tmdbAxios.get(`movie/${movieId}`, {
            params: { language: 'en-US' },
        });
        return data;
    } catch (error) {
        console.error('Fetch movie details failed:', error);
        return null;
    }
}

export async function fetchMoviesByQuery(params: MovieQuery) {
    try {
        const { data } = await tmdbAxios.get('discover/movie', { params });
        return data;
    } catch (error) {
        console.error('Fetch movies failed:', error);
        return [];
    }
}

export async function fetchPopularMovies(page: number = 1) {
    try {
        const { data } = await tmdbAxios.get('movie/popular', {
            params: { language: 'en-US', page },
        });
        return data;
    } catch (error) {
        console.error('Fetch popular movies failed:', error);
        return [];
    }
}

export async function fetchMoviesByGenre(genreId: string, page: number = 1) {
    try {
        const { data } = await tmdbAxios.get('discover/movie', {
            params: { with_genres: genreId, language: 'en-US', page },
        });
        return data;
    } catch (error) {
        console.error('Fetch movies by genre failed:', error);
        return [];
    }
}

export async function fetchGenres() {
    try {
        const { data } = await tmdbAxios.get('genre/movie/list', {
            params: { language: 'en-US' },
        });
        return data.genres;
    } catch (error) {
        console.error('Fetch genres failed:', error);
        return [];
    }
}
