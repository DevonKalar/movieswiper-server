import { http, HttpResponse } from 'msw';
import { server } from '@tests/mocks/server.js';
import { setupMSW } from '@tests/utils/setupMSW.js';
import {
    fetchMovieDetails,
    fetchMoviesByQuery,
    fetchPopularMovies,
    fetchMoviesByGenre,
    fetchGenres,
} from '@clients/tmdb.js';
import { expect, describe, it } from 'vitest';

const TMDB_BASE = 'https://api.themoviedb.org/3';

describe('fetchMovieDetails', () => {
    setupMSW();

    it('returns movie data for a valid id', async () => {
        const movie = {
            id: 550,
            title: 'Fight Club',
            overview: '...',
            release_date: '1999-10-15',
        };
        server.use(http.get(`${TMDB_BASE}/movie/550`, () => HttpResponse.json(movie)));

        const result = await fetchMovieDetails(550);

        expect(result).toEqual(movie);
    });

    it('returns null when the API responds with an error', async () => {
        server.use(
            http.get(`${TMDB_BASE}/movie/999`, () => new HttpResponse(null, { status: 404 })),
        );

        const result = await fetchMovieDetails(999);

        expect(result).toBeNull();
    });
});

describe('fetchPopularMovies', () => {
    setupMSW();

    it('returns the full response for the default page', async () => {
        const payload = {
            page: 1,
            results: [{ id: 1, title: 'Popular' }],
            total_pages: 5,
            total_results: 100,
        };
        server.use(http.get(`${TMDB_BASE}/movie/popular`, () => HttpResponse.json(payload)));

        const result = await fetchPopularMovies();

        expect(result).toEqual(payload);
    });

    it('passes the page param to the request', async () => {
        let capturedPage: string | null = null;
        server.use(
            http.get(`${TMDB_BASE}/movie/popular`, ({ request }) => {
                capturedPage = new URL(request.url).searchParams.get('page');
                return HttpResponse.json({
                    page: 3,
                    results: [],
                    total_pages: 5,
                    total_results: 100,
                });
            }),
        );

        await fetchPopularMovies(3);

        expect(capturedPage).toBe('3');
    });

    it('returns an empty array when the API responds with an error', async () => {
        server.use(
            http.get(`${TMDB_BASE}/movie/popular`, () => new HttpResponse(null, { status: 500 })),
        );

        const result = await fetchPopularMovies();

        expect(result).toEqual([]);
    });
});

describe('fetchMoviesByQuery', () => {
    setupMSW();

    it('returns movies matching the query', async () => {
        const payload = {
            page: 1,
            results: [{ id: 2, title: 'Action Movie' }],
            total_pages: 1,
            total_results: 1,
        };
        server.use(http.get(`${TMDB_BASE}/discover/movie`, () => HttpResponse.json(payload)));

        const query = {
            include_adult: 'false' as const,
            include_video: 'false' as const,
            language: 'en-US',
            page: '1',
            sort_by: 'popularity.desc',
        };

        const result = await fetchMoviesByQuery(query);

        expect(result).toEqual(payload);
    });

    it('forwards the with_genres param when provided', async () => {
        let capturedGenres: string | null = null;
        server.use(
            http.get(`${TMDB_BASE}/discover/movie`, ({ request }) => {
                capturedGenres = new URL(request.url).searchParams.get('with_genres');
                return HttpResponse.json({
                    page: 1,
                    results: [],
                    total_pages: 1,
                    total_results: 0,
                });
            }),
        );

        await fetchMoviesByQuery({
            include_adult: 'false',
            include_video: 'false',
            language: 'en-US',
            page: '1',
            sort_by: 'popularity.desc',
            with_genres: '28,12',
        });

        expect(capturedGenres).toBe('28,12');
    });

    it('returns an empty array when the API responds with an error', async () => {
        server.use(
            http.get(`${TMDB_BASE}/discover/movie`, () => new HttpResponse(null, { status: 500 })),
        );

        const result = await fetchMoviesByQuery({
            include_adult: 'false',
            include_video: 'false',
            language: 'en-US',
            page: '1',
            sort_by: 'popularity.desc',
        });

        expect(result).toEqual([]);
    });
});

describe('fetchMoviesByGenre', () => {
    setupMSW();

    it('returns movies for the given genre', async () => {
        const payload = {
            page: 1,
            results: [{ id: 3, title: 'Horror Movie' }],
            total_pages: 1,
            total_results: 1,
        };
        server.use(http.get(`${TMDB_BASE}/discover/movie`, () => HttpResponse.json(payload)));

        const result = await fetchMoviesByGenre('27');

        expect(result).toEqual(payload);
    });

    it('forwards genre id and page to the request', async () => {
        let capturedParams: Record<string, string> = {};
        server.use(
            http.get(`${TMDB_BASE}/discover/movie`, ({ request }) => {
                const url = new URL(request.url);
                capturedParams = Object.fromEntries(url.searchParams.entries());
                return HttpResponse.json({
                    page: 2,
                    results: [],
                    total_pages: 3,
                    total_results: 60,
                });
            }),
        );

        await fetchMoviesByGenre('27', 2);

        expect(capturedParams.with_genres).toBe('27');
        expect(capturedParams.page).toBe('2');
    });
});

describe('fetchGenres', () => {
    setupMSW();

    it('returns the genres array from the response', async () => {
        const genres = [
            { id: 28, name: 'Action' },
            { id: 27, name: 'Horror' },
        ];
        server.use(http.get(`${TMDB_BASE}/genre/movie/list`, () => HttpResponse.json({ genres })));

        const result = await fetchGenres();

        expect(result).toEqual(genres);
    });

    it('returns an empty array when the API responds with an error', async () => {
        server.use(
            http.get(
                `${TMDB_BASE}/genre/movie/list`,
                () => new HttpResponse(null, { status: 500 }),
            ),
        );

        const result = await fetchGenres();

        expect(result).toEqual([]);
    });
});
