import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import prisma from '@/lib/prisma.js';
import reactionsRouter from '@routes/reactions.js';
import { requireUser } from '@middleware/auth.js';
import { errorHandler } from '@middleware/errorHandler.js';

const app = express();
app.use(express.json());
app.use('/api/reactions', requireUser, reactionsRouter);
app.use(errorHandler);

describe('Reactions Routes', () => {
    let userId: string;
    let otherUserId: string;
    let movieId: number;
    let secondMovieId: number;

    beforeAll(async () => {
        const user = await prisma.user.create({
            data: {
                email: 'reactions-test@example.com',
                password: 'hashedpassword',
                firstName: 'Test',
                lastName: 'User',
            },
        });
        userId = user.id;

        const otherUser = await prisma.user.create({
            data: {
                email: 'reactions-other@example.com',
                password: 'hashedpassword',
                firstName: 'Other',
                lastName: 'User',
            },
        });
        otherUserId = otherUser.id;

        const [movie, secondMovie] = await Promise.all([
            prisma.movies.create({
                data: {
                    id: 555551,
                    title: 'Reactions Test Movie',
                    description: 'A movie for testing reactions',
                    releaseDate: new Date('2024-01-01'),
                    posterUrl: null,
                    genres: ['Action'],
                    ratings: 7.0,
                },
            }),
            prisma.movies.create({
                data: {
                    id: 555552,
                    title: 'Reactions Test Movie 2',
                    description: 'A second movie for testing bulk reactions',
                    releaseDate: new Date('2024-06-01'),
                    posterUrl: null,
                    genres: ['Drama'],
                    ratings: 6.5,
                },
            }),
        ]);

        movieId = movie.id;
        secondMovieId = secondMovie.id;
    });

    afterAll(async () => {
        await prisma.movieReaction.deleteMany({
            where: { userId: { in: [userId, otherUserId] } },
        });
        await prisma.movies.deleteMany({ where: { id: { in: [555551, 555552] } } });
        await prisma.user.deleteMany({
            where: { id: { in: [userId, otherUserId] } },
        });
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await prisma.movieReaction.deleteMany({
            where: { userId: { in: [userId, otherUserId] } },
        });
    });

    describe('POST /reactions', () => {
        it('creates a single reaction', async () => {
            const response = await request(app)
                .post('/api/reactions')
                .set('X-User-ID', userId)
                .send({ reactions: [{ movieId, reaction: 'like' }] });

            expect(response.status).toBe(201);
            expect(response.body.reactions).toHaveLength(1);
            expect(response.body.reactions[0]).toMatchObject({
                userId,
                movieId,
                reaction: 'like',
            });
        });

        it('creates multiple reactions in bulk', async () => {
            const response = await request(app)
                .post('/api/reactions')
                .set('X-User-ID', userId)
                .send({
                    reactions: [
                        { movieId, reaction: 'like' },
                        { movieId: secondMovieId, reaction: 'reject' },
                    ],
                });

            expect(response.status).toBe(201);
            expect(response.body.reactions).toHaveLength(2);
            expect(response.body.reactions).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ movieId, reaction: 'like' }),
                    expect.objectContaining({
                        movieId: secondMovieId,
                        reaction: 'reject',
                    }),
                ]),
            );
        });

        it('upserts when a reaction already exists for the same user and movie', async () => {
            await prisma.movieReaction.create({
                data: { userId, movieId, reaction: 'like' },
            });

            const response = await request(app)
                .post('/api/reactions')
                .set('X-User-ID', userId)
                .send({ reactions: [{ movieId, reaction: 'reject' }] });

            expect(response.status).toBe(201);
            expect(response.body.reactions[0]).toMatchObject({
                movieId,
                reaction: 'reject',
            });

            const count = await prisma.movieReaction.count({
                where: { userId, movieId },
            });
            expect(count).toBe(1);
        });

        it('returns 422 for an empty reactions array', async () => {
            const response = await request(app)
                .post('/api/reactions')
                .set('X-User-ID', userId)
                .send({ reactions: [] });

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invalid request body');
        });

        it('returns 422 for an invalid reaction value', async () => {
            const response = await request(app)
                .post('/api/reactions')
                .set('X-User-ID', userId)
                .send({ reactions: [{ movieId, reaction: 'love' }] });

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invalid request body');
        });

        it('returns 401 for unauthenticated requests', async () => {
            const response = await request(app)
                .post('/api/reactions')
                .send({ reactions: [{ movieId, reaction: 'like' }] });

            expect(response.status).toBe(401);
        });
    });

    describe('PATCH /reactions/:id', () => {
        it('updates a reaction', async () => {
            const created = await prisma.movieReaction.create({
                data: { userId, movieId, reaction: 'like' },
            });

            const response = await request(app)
                .patch(`/api/reactions/${created.id}`)
                .set('X-User-ID', userId)
                .send({ reaction: 'reject' });

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                id: created.id,
                userId,
                movieId,
                reaction: 'reject',
            });
        });

        it('returns 404 when the reaction does not exist', async () => {
            const response = await request(app)
                .patch('/api/reactions/999999999')
                .set('X-User-ID', userId)
                .send({ reaction: 'reject' });

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'Reaction not found');
        });

        it('returns 404 when the reaction belongs to another user', async () => {
            const created = await prisma.movieReaction.create({
                data: { userId: otherUserId, movieId, reaction: 'like' },
            });

            const response = await request(app)
                .patch(`/api/reactions/${created.id}`)
                .set('X-User-ID', userId)
                .send({ reaction: 'reject' });

            expect(response.status).toBe(404);
        });

        it('returns 422 for a non-numeric id', async () => {
            const response = await request(app)
                .patch('/api/reactions/abc')
                .set('X-User-ID', userId)
                .send({ reaction: 'reject' });

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invalid request params');
        });

        it('returns 422 for an invalid reaction value in body', async () => {
            const created = await prisma.movieReaction.create({
                data: { userId, movieId, reaction: 'like' },
            });

            const response = await request(app)
                .patch(`/api/reactions/${created.id}`)
                .set('X-User-ID', userId)
                .send({ reaction: 'love' });

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invalid request body');
        });

        it('returns 401 for unauthenticated requests', async () => {
            const response = await request(app)
                .patch('/api/reactions/1')
                .send({ reaction: 'reject' });

            expect(response.status).toBe(401);
        });
    });

    describe('DELETE /reactions/:id', () => {
        it('deletes a reaction and returns 204', async () => {
            const created = await prisma.movieReaction.create({
                data: { userId, movieId, reaction: 'like' },
            });

            const response = await request(app)
                .delete(`/api/reactions/${created.id}`)
                .set('X-User-ID', userId);

            expect(response.status).toBe(204);

            const deleted = await prisma.movieReaction.findUnique({
                where: { id: created.id },
            });
            expect(deleted).toBeNull();
        });

        it('returns 404 when the reaction does not exist', async () => {
            const response = await request(app)
                .delete('/api/reactions/999999999')
                .set('X-User-ID', userId);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'Reaction not found');
        });

        it('returns 404 when the reaction belongs to another user', async () => {
            const created = await prisma.movieReaction.create({
                data: { userId: otherUserId, movieId, reaction: 'like' },
            });

            const response = await request(app)
                .delete(`/api/reactions/${created.id}`)
                .set('X-User-ID', userId);

            expect(response.status).toBe(404);
        });

        it('returns 422 for a non-numeric id', async () => {
            const response = await request(app)
                .delete('/api/reactions/abc')
                .set('X-User-ID', userId);

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invalid request params');
        });

        it('returns 401 for unauthenticated requests', async () => {
            const response = await request(app).delete('/api/reactions/1');

            expect(response.status).toBe(401);
        });
    });
});
