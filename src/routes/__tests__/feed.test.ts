import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import prisma from '@/lib/prisma.js';
import feedRouter from '@routes/feed.js';
import { requireUser } from '@middleware/auth.js';
import { errorHandler } from '@middleware/errorHandler.js';
import { getDaysAgoDate } from '@/utils/dates.js';

const app = express();
app.use(express.json());
app.use('/api/feed', requireUser, feedRouter);
app.use(errorHandler);

// Unique IDs for this test file
const MOVIE_IDS = {
    recent: 888881,
    recentWithLikes: 888882,
    recentWithRejects: 888883,
    old: 888884,
    viewedWithin1Day: 888885,
    viewedWithin3Days: 888886,
    viewedWithin7Days: 888887,
};

describe('Feed Routes', () => {
    let userId: string;
    let otherUserId: string;

    beforeAll(async () => {
        const user = await prisma.user.create({
            data: {
                email: 'feed-test@example.com',
                password: 'hashedpassword',
                firstName: 'Feed',
                lastName: 'User',
            },
        });
        userId = user.id;

        const twoDaysAgo = getDaysAgoDate(2);
        const sixDaysAgo = getDaysAgoDate(6);
        const eightDaysAgo = getDaysAgoDate(8);

        await prisma.movies.createMany({
            data: [
                {
                    id: MOVIE_IDS.recent,
                    title: 'Recent Movie',
                    description: 'No reactions',
                    releaseDate: new Date('2024-01-01'),
                    genres: ['Action'],
                    ratings: 7.0,
                },
                {
                    id: MOVIE_IDS.recentWithLikes,
                    title: 'Liked Movie',
                    description: 'Has likes',
                    releaseDate: new Date('2024-01-01'),
                    genres: ['Drama'],
                    ratings: 8.0,
                },
                {
                    id: MOVIE_IDS.recentWithRejects,
                    title: 'Rejected Movie',
                    description: 'Has rejects',
                    releaseDate: new Date('2024-01-01'),
                    genres: ['Comedy'],
                    ratings: 5.0,
                },
                {
                    id: MOVIE_IDS.old,
                    title: 'Old Movie',
                    description: 'Created 8 days ago — excluded from feed',
                    releaseDate: new Date('2023-01-01'),
                    genres: ['Thriller'],
                    ratings: 6.0,
                    createdAt: eightDaysAgo,
                },
                {
                    id: MOVIE_IDS.viewedWithin1Day,
                    title: 'Viewed 1 Day Ago',
                    description: 'Recent view penalty 0.1',
                    releaseDate: new Date('2024-01-01'),
                    genres: ['Action'],
                    ratings: 7.0,
                },
                {
                    id: MOVIE_IDS.viewedWithin3Days,
                    title: 'Viewed 3 Days Ago',
                    description: 'Mid view penalty 0.3',
                    releaseDate: new Date('2024-01-01'),
                    genres: ['Action'],
                    ratings: 7.0,
                },
                {
                    id: MOVIE_IDS.viewedWithin7Days,
                    title: 'Viewed 7 Days Ago',
                    description: 'Mild view penalty 0.6',
                    releaseDate: new Date('2024-01-01'),
                    genres: ['Action'],
                    ratings: 7.0,
                },
            ],
        });

        // Add reactions for scoring tests
        const otherUser = await prisma.user.create({
            data: {
                email: 'feed-other@example.com',
                password: 'hashedpassword',
                firstName: 'Other',
                lastName: 'User',
            },
        });
        otherUserId = otherUser.id;

        await prisma.movieReaction.createMany({
            data: [
                { userId, movieId: MOVIE_IDS.recentWithLikes, reaction: 'like' },
                {
                    userId: otherUser.id,
                    movieId: MOVIE_IDS.recentWithLikes,
                    reaction: 'like',
                },
                { userId, movieId: MOVIE_IDS.recentWithRejects, reaction: 'reject' },
                // liked movies used for view penalty tests (score = 10)
                { userId, movieId: MOVIE_IDS.viewedWithin1Day, reaction: 'like' },
                { userId, movieId: MOVIE_IDS.viewedWithin3Days, reaction: 'like' },
                { userId, movieId: MOVIE_IDS.viewedWithin7Days, reaction: 'like' },
            ],
        });

        // Add views at specific timestamps
        const twelveHoursAgo = getDaysAgoDate(0.5);
        await prisma.movieView.create({
            data: {
                userId,
                movieId: MOVIE_IDS.viewedWithin1Day,
                viewedAt: twelveHoursAgo,
            },
        });
        await prisma.movieView.create({
            data: {
                userId,
                movieId: MOVIE_IDS.viewedWithin3Days,
                viewedAt: twoDaysAgo,
            },
        });
        await prisma.movieView.create({
            data: {
                userId,
                movieId: MOVIE_IDS.viewedWithin7Days,
                viewedAt: sixDaysAgo,
            },
        });
    });

    afterAll(async () => {
        await prisma.movieView.deleteMany({
            where: { movieId: { in: Object.values(MOVIE_IDS) } },
        });
        await prisma.movieReaction.deleteMany({
            where: { movieId: { in: Object.values(MOVIE_IDS) } },
        });
        await prisma.movies.deleteMany({
            where: { id: { in: Object.values(MOVIE_IDS) } },
        });
        await prisma.user.deleteMany({
            where: { id: { in: [userId, otherUserId] } },
        });
        await prisma.$disconnect();
    });

    describe('GET /feed', () => {
        it('returns 200 with a movies array', async () => {
            const response = await request(app).get('/api/feed').set('X-User-ID', userId);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('movies');
            expect(Array.isArray(response.body.movies)).toBe(true);
        });

        it('excludes movies created more than 7 days ago', async () => {
            const response = await request(app).get('/api/feed').set('X-User-ID', userId);

            const ids = response.body.movies.map((m: { id: number }) => m.id);
            expect(ids).not.toContain(MOVIE_IDS.old);
        });

        it('includes movies created within 7 days', async () => {
            const response = await request(app).get('/api/feed').set('X-User-ID', userId);

            const ids = response.body.movies.map((m: { id: number }) => m.id);
            expect(ids).toContain(MOVIE_IDS.recent);
            expect(ids).toContain(MOVIE_IDS.recentWithLikes);
        });

        it('includes a score field on each movie', async () => {
            const response = await request(app).get('/api/feed').set('X-User-ID', userId);

            for (const movie of response.body.movies) {
                expect(movie).toHaveProperty('score');
                expect(typeof movie.score).toBe('number');
            }
        });

        it('scores a movie with 2 likes as 2', async () => {
            const response = await request(app).get('/api/feed').set('X-User-ID', userId);

            const movie = response.body.movies.find(
                (m: { id: number }) => m.id === MOVIE_IDS.recentWithLikes,
            );
            expect(movie.score).toBe(2);
        });

        it('applies 0.1 penalty for movies viewed within 1 day', async () => {
            const response = await request(app).get('/api/feed').set('X-User-ID', userId);

            const movie = response.body.movies.find(
                (m: { id: number }) => m.id === MOVIE_IDS.viewedWithin1Day,
            );
            // base score = 1 like = 1, penalty = 0.1
            expect(movie.score).toBeCloseTo(0.1);
        });

        it('applies 0.3 penalty for movies viewed within 3 days', async () => {
            const response = await request(app).get('/api/feed').set('X-User-ID', userId);

            const movie = response.body.movies.find(
                (m: { id: number }) => m.id === MOVIE_IDS.viewedWithin3Days,
            );
            // base score = 1 like = 1, penalty = 0.3
            expect(movie.score).toBeCloseTo(0.3);
        });

        it('applies 0.6 penalty for movies viewed within 7 days', async () => {
            const response = await request(app).get('/api/feed').set('X-User-ID', userId);

            const movie = response.body.movies.find(
                (m: { id: number }) => m.id === MOVIE_IDS.viewedWithin7Days,
            );
            // base score = 1 like = 1, penalty = 0.6
            expect(movie.score).toBeCloseTo(0.6);
        });

        it('returns movies sorted by score descending', async () => {
            const response = await request(app).get('/api/feed').set('X-User-ID', userId);

            const scores = response.body.movies.map((m: { score: number }) => m.score);
            const sorted = [...scores].sort((a, b) => b - a);
            expect(scores).toEqual(sorted);
        });

        it('returns 401 for unauthenticated requests', async () => {
            const response = await request(app).get('/api/feed');

            expect(response.status).toBe(401);
        });
    });
});
