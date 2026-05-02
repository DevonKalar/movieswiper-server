import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiMovieToMovie, apiMoviesToMovies } from '@/utils/mapTMDBtoMovie.js';

describe('mapTMDBtoMovie Utils', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('apiMovieToMovie', () => {
        it('should map TMDB movie object to internal Movie object', () => {
            // Arragne
            const tmdbMovie = {
                id: 123,
                title: 'Sample Movie',
                poster_path: '/sample.jpg',
                genre_ids: [28, 12],
                overview: 'This is a sample movie.',
                vote_average: 7.5,
                release_date: '2023-01-01',
            };

            const expectedMovie = {
                id: 123,
                title: 'Sample Movie',
                posterUrl: 'https://image.tmdb.org/t/p/w500/sample.jpg',
                genres: ['Action', 'Adventure'],
                description: 'This is a sample movie.',
                ratings: 7.5,
                releaseDate: '2023-01-01',
            };

            // Act
            const result = apiMovieToMovie(tmdbMovie);

            // Assert
            expect(result).toEqual(expectedMovie);
        });
        it('should handle malformed TMDB movie object gracefully', () => {
            // Arrange
            const malformedTmdbMovie = {
                id: 456,
                title: 'Malformed Movie',
            };
            // Act
            const result = apiMovieToMovie(malformedTmdbMovie as any);

            // Assert
            expect(result).toEqual({
                id: 456,
                title: 'Malformed Movie',
                posterUrl: null,
                genres: [],
                description: '',
                ratings: 0,
                releaseDate: '',
            });
        });
    });

    describe('apiMoviesToMovies', () => {
        it('should map array of TMDB movie objects to array of internal Movie objects', () => {
            // Arrange
            const tmdbMovies = [
                {
                    id: 123,
                    title: 'Sample Movie 1',
                    poster_path: '/sample1.jpg',
                    genre_ids: [28],
                    overview: 'This is sample movie 1.',
                    vote_average: 8.0,
                    release_date: '2023-01-01',
                },
                {
                    id: 456,
                    title: 'Sample Movie 2',
                    poster_path: '/sample2.jpg',
                    genre_ids: [12],
                    overview: 'This is sample movie 2.',
                    vote_average: 6.5,
                    release_date: '2023-02-01',
                },
            ];

            const expectedMovies = [
                {
                    id: 123,
                    title: 'Sample Movie 1',
                    posterUrl: 'https://image.tmdb.org/t/p/w500/sample1.jpg',
                    genres: ['Action'],
                    description: 'This is sample movie 1.',
                    ratings: 8.0,
                    releaseDate: '2023-01-01',
                },
                {
                    id: 456,
                    title: 'Sample Movie 2',
                    posterUrl: 'https://image.tmdb.org/t/p/w500/sample2.jpg',
                    genres: ['Adventure'],
                    description: 'This is sample movie 2.',
                    ratings: 6.5,
                    releaseDate: '2023-02-01',
                },
            ];

            // Act
            const result = apiMoviesToMovies(tmdbMovies);
            // Assert
            expect(result).toEqual(expectedMovies);
        });
    });
});
