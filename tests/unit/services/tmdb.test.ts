import { describe, it, expect } from 'vitest';
import { server } from '@tests/mocks/server.js';
import { http, HttpResponse } from 'msw';
import {
    fetchMovieDetails,
    fetchPopularMovies,
    fetchGenres,
    fetchMoviesByQuery,
} from '@clients/tmdb.js';
import { setupMSW } from '@tests/utils/setupMSW.js';

describe('tmdb client', () => {
    setupMSW();
    describe('fetchMovieDetails', () => {
        it('should fetch movie details for a valid movie ID', async () => {
            // Arrange
            const movieId = 550;
            const movieData = {
                id: movieId,
                title: 'Fight Club',
                overview: 'A ticking-time-bomb insomniac...',
                release_date: '1999-10-15',
            };

            // Act
            const result = await fetchMovieDetails(movieId);

            // Assert
            expect(result).toEqual(movieData);
        });
    });

    describe('fetchPopularMovies', () => {
        it('should return popular movies', async () => {
            // Arrange
            const popularMoviesData = {
                page: 1,
                results: [{ id: 1, title: 'Popular Movie' }],
                total_pages: 1,
                total_results: 1,
            };

            server.use(
                http.get('https://api.themoviedb.org/3/movie/popular', () => {
                    return HttpResponse.json(popularMoviesData);
                }),
            );

            // Act
            const result = await fetchPopularMovies();

            // Assert
            expect(result).toEqual(popularMoviesData);
        });
    });

    describe('fetchGenres', () => {
        it('Should fetch genres with ids and names', async () => {
            // Arrange
            const genreData = {
                genres: [
                    { id: 28, name: 'Action' },
                    { id: 12, name: 'Adventure' },
                ],
            };

            server.use(
                http.get('https://api.themoviedb.org/3/genre/movie/list', () => {
                    return HttpResponse.json(genreData);
                }),
            );

            // Act
            const response = await fetchGenres();

            // Assert
            expect(response).toEqual(genreData.genres);
        });
    });

    describe('fetchMoviesByQuery', () => {
        it('should fetch movies by query parameters', async () => {
            // Arrange
            const query = {
                include_adult: 'false',
                include_video: 'false',
                language: 'en-US',
                page: '1',
                sort_by: 'popularity.desc',
            } as const;

            const moviesByQueryData = {
                page: 1,
                results: [{ id: 2, title: 'Queried Movie' }],
                total_pages: 1,
                total_results: 1,
            };

            server.use(
                http.get('https://api.themoviedb.org/3/discover/movie', () => {
                    return HttpResponse.json(moviesByQueryData);
                }),
            );

            // Act
            const result = await fetchMoviesByQuery(query);

            // Assert
            expect(result).toEqual(moviesByQueryData);
        });
    });
});
