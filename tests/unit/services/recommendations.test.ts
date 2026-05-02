import { describe, it, expect, vi, beforeEach } from 'vitest';
import { server } from '@tests/mocks/server.js';
import { http, HttpResponse } from 'msw';
import { fetchGuestRecommendations, fetchUserRecommendations } from '@services/recommendations.js';
import { apiMoviesToMovies } from '@/utils/mapTMDBtoMovie.js';
import { setupMSW } from '@tests/utils/setupMSW.js';
import prisma from '@/lib/prisma.js';

vi.mock('@/lib/prisma.js', () => ({
    default: {
        watchlist: {
            findMany: vi.fn(),
        },
    },
}));

describe('recommendationsService', () => {
    setupMSW();

    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('fetchGuestRecommendations', () => {
        it('should fetch guest recommendations', async () => {
            // Arrange
            const page = 1;
            const tmdbMoviesData = {
                page: 1,
                results: [
                    {
                        id: 1,
                        title: 'Popular Movie 1',
                        genre_ids: [28],
                        poster_path: '/path1.jpg',
                        overview: 'Overview 1',
                        vote_average: 8.5,
                        release_date: '2023-01-01',
                    },
                    {
                        id: 2,
                        title: 'Popular Movie 2',
                        genre_ids: [12],
                        poster_path: '/path2.jpg',
                        overview: 'Overview 2',
                        vote_average: 7.0,
                        release_date: '2023-02-01',
                    },
                ],
                total_pages: 1,
                total_results: 2,
            };
            const expectedMovies = apiMoviesToMovies(tmdbMoviesData.results);
            server.use(
                http.get('https://api.themoviedb.org/3/movie/popular', () => {
                    return HttpResponse.json(tmdbMoviesData);
                }),
            );

            // Act
            const result = await fetchGuestRecommendations(page);
            // Assert
            expect(result).toEqual({
                results: expectedMovies,
                nextPage: null,
            });
        });
    });

    describe('fetchUserRecommendations', () => {
        it('should fetch user recommendations excluding watchlist movies', async () => {
            // Arrange
            const userId = 1;
            const startPage = 1;
            const tmdbMoviesData = {
                page: 1,
                results: [
                    {
                        id: 1,
                        title: 'Popular Movie 1',
                        genre_ids: [28],
                        poster_path: '/path1.jpg',
                        overview: 'Overview 1',
                        vote_average: 8.5,
                        release_date: '2023-01-01',
                    },
                    {
                        id: 2,
                        title: 'Watchlisted Movie',
                        genre_ids: [16],
                        poster_path: '/path2.jpg',
                        overview: 'Overview 2',
                        vote_average: 7.0,
                        release_date: '2023-02-01',
                    },
                    {
                        id: 3,
                        title: 'Popular Movie 3',
                        genre_ids: [12],
                        poster_path: '/path3.jpg',
                        overview: 'Overview 3',
                        vote_average: 7.5,
                        release_date: '2023-03-01',
                    },
                ],
                total_pages: 1,
                total_results: 3,
            };
            const expectedMovies = apiMoviesToMovies([
                {
                    id: 1,
                    title: 'Popular Movie 1',
                    genre_ids: [28],
                    poster_path: '/path1.jpg',
                    overview: 'Overview 1',
                    vote_average: 8.5,
                    release_date: '2023-01-01',
                },
                {
                    id: 3,
                    title: 'Popular Movie 3',
                    genre_ids: [12],
                    poster_path: '/path3.jpg',
                    overview: 'Overview 3',
                    vote_average: 7.5,
                    release_date: '2023-03-01',
                },
            ]);

            // Mock Prisma to return movie ID 2 as watchlisted
            vi.mocked(prisma.watchlist.findMany).mockResolvedValue([
                { id: 1, userId: 1, movieId: 2, createdAt: new Date() },
            ] as any);

            server.use(
                http.get('https://api.themoviedb.org/3/movie/popular', ({ request }) => {
                    const url = new URL(request.url);
                    const page = url.searchParams.get('page');
                    // Return data only for page 1, empty for other pages
                    if (page === '1' || !page) {
                        return HttpResponse.json(tmdbMoviesData);
                    }
                    return HttpResponse.json({
                        page: parseInt(page),
                        results: [],
                        total_pages: 1,
                        total_results: 0,
                    });
                }),
            );

            // Act
            const result = await fetchUserRecommendations(userId, startPage);

            // Assert
            expect(result).toEqual({
                results: expectedMovies,
                nextPage: null,
            });
        });

        it('should fetch additional pages when all movies on current page are in watchlist', async () => {
            // Arrange
            const userId = 1;
            const startPage = 1;
            const tmdbMoviesDataPage1 = {
                page: 1,
                results: [
                    {
                        id: 1,
                        title: 'Watchlisted Movie 1',
                        genre_ids: [28],
                        poster_path: '/path1.jpg',
                        overview: 'Overview 1',
                        vote_average: 8.5,
                        release_date: '2023-01-01',
                    },
                    {
                        id: 2,
                        title: 'Watchlisted Movie 2',
                        genre_ids: [16],
                        poster_path: '/path2.jpg',
                        overview: 'Overview 2',
                        vote_average: 7.0,
                        release_date: '2023-02-01',
                    },
                ],
                total_pages: 2,
                total_results: 4,
            };
            const tmdbMoviesDataPage2 = {
                page: 2,
                results: [
                    {
                        id: 3,
                        title: 'Popular Movie 3',
                        genre_ids: [12],
                        poster_path: '/path3.jpg',
                        overview: 'Overview 3',
                        vote_average: 7.5,
                        release_date: '2023-03-01',
                    },
                    {
                        id: 4,
                        title: 'Popular Movie 4',
                        genre_ids: [35],
                        poster_path: '/path4.jpg',
                        overview: 'Overview 4',
                        vote_average: 6.5,
                        release_date: '2023-04-01',
                    },
                ],
                total_pages: 2,
                total_results: 4,
            };
            const expectedMovies = apiMoviesToMovies([
                {
                    id: 3,
                    title: 'Popular Movie 3',
                    genre_ids: [12],
                    poster_path: '/path3.jpg',
                    overview: 'Overview 3',
                    vote_average: 7.5,
                    release_date: '2023-03-01',
                },
                {
                    id: 4,
                    title: 'Popular Movie 4',
                    genre_ids: [35],
                    poster_path: '/path4.jpg',
                    overview: 'Overview 4',
                    vote_average: 6.5,
                    release_date: '2023-04-01',
                },
            ]);

            // Mock Prisma to return movie IDs 1 and 2 as watchlisted
            vi.mocked(prisma.watchlist.findMany).mockResolvedValue([
                { id: 1, userId: 1, movieId: 1, createdAt: new Date() },
                { id: 2, userId: 1, movieId: 2, createdAt: new Date() },
            ] as any);

            server.use(
                http.get('https://api.themoviedb.org/3/movie/popular', ({ request }) => {
                    const url = new URL(request.url);
                    const page = url.searchParams.get('page');
                    if (page === '1') {
                        return HttpResponse.json(tmdbMoviesDataPage1);
                    } else if (page === '2') {
                        return HttpResponse.json(tmdbMoviesDataPage2);
                    }
                    return HttpResponse.json({
                        page: 1,
                        results: [],
                        total_pages: 1,
                        total_results: 0,
                    });
                }),
            );

            // Act
            const result = await fetchUserRecommendations(userId, startPage);

            // Assert
            expect(result).toEqual({
                results: expectedMovies,
                nextPage: null,
            });
        });
    });
});
