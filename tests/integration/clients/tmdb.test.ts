import { describe, it, expect } from 'vitest';
import {
    fetchMovieDetails,
    fetchMoviesByQuery,
    fetchPopularMovies,
    fetchMoviesByGenre,
    fetchGenres,
} from '@clients/tmdb.js';

// Fight Club — a stable, well-known TMDB entry
const FIGHT_CLUB_ID = 550;

describe('TMDB client (integration)', () => {
    describe('fetchMovieDetails', () => {
        it('returns movie details for a known id', async () => {
            const result = await fetchMovieDetails(FIGHT_CLUB_ID);

            expect(result).toMatchObject({
                id: FIGHT_CLUB_ID,
                title: 'Fight Club',
            });
        });

        it('returns null for a non-existent movie id', async () => {
            const result = await fetchMovieDetails(0);

            expect(result).toBeNull();
        });
    });

    describe('fetchPopularMovies', () => {
        it('returns a paginated list of popular movies', async () => {
            const result = await fetchPopularMovies(1);

            expect(result).toMatchObject({
                page: 1,
                results: expect.any(Array),
                total_pages: expect.any(Number),
                total_results: expect.any(Number),
            });
            expect(result.results.length).toBeGreaterThan(0);
        });
    });

    describe('fetchMoviesByQuery', () => {
        it('returns movies matching a discover query', async () => {
            const result = await fetchMoviesByQuery({
                include_adult: 'false',
                include_video: 'false',
                language: 'en-US',
                page: '1',
                sort_by: 'popularity.desc',
            });

            expect(result).toMatchObject({
                page: 1,
                results: expect.any(Array),
            });
            expect(result.results.length).toBeGreaterThan(0);
        });
    });

    describe('fetchMoviesByGenre', () => {
        it('returns movies for the action genre', async () => {
            const result = await fetchMoviesByGenre('28', 1);

            expect(result).toMatchObject({
                page: 1,
                results: expect.any(Array),
            });
            expect(result.results.length).toBeGreaterThan(0);
        });
    });

    describe('fetchGenres', () => {
        it('returns the list of movie genres', async () => {
            const result = await fetchGenres();

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            expect(result[0]).toMatchObject({
                id: expect.any(Number),
                name: expect.any(String),
            });
        });

        it('includes expected genres like Action and Drama', async () => {
            const result = await fetchGenres();
            const names = result.map((g: { id: number; name: string }) => g.name);

            expect(names).toContain('Action');
            expect(names).toContain('Drama');
        });
    });
});
