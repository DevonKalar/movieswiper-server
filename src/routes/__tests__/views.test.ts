import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import prisma from '@/lib/prisma.js';
import viewsRouter from '@routes/views.js';
import { requireUser } from '@middleware/auth.js';
import { errorHandler } from '@middleware/errorHandler.js';

const app = express();
app.use(express.json());
app.use('/api/views', requireUser, viewsRouter);
app.use(errorHandler);

describe('Views Routes', () => {
    let userId: string;
    let movieId: number;

    beforeAll(async () => {
        const user = await prisma.user.create({
            data: {
                email: 'views-test@example.com',
                password: 'hashedpassword',
                firstName: 'Test',
                lastName: 'User',
            },
        });
        userId = user.id;

        const movie = await prisma.movies.create({
            data: {
                id: 666661,
                title: 'Views Test Movie',
                description: 'A movie for testing views',
                releaseDate: new Date('2024-01-01'),
                posterUrl: null,
                genres: ['Action'],
                ratings: 7.5,
            },
        });
        movieId = movie.id;
    });

    afterAll(async () => {
        await prisma.movieView.deleteMany({ where: { userId } });
        await prisma.movies.deleteMany({ where: { id: movieId } });
        await prisma.user.deleteMany({ where: { id: userId } });
        await prisma.$disconnect();
    });

    describe('POST /views', () => {
        it('creates a view record and returns 201', async () => {
            const response = await request(app)
                .post('/api/views')
                .set('X-User-ID', userId)
                .send({ movieId });

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({ userId, movieId });
            expect(response.body).toHaveProperty('viewedAt');
            expect(response.body).toHaveProperty('id');
        });

        it('allows duplicate view records (append log)', async () => {
            const first = await request(app)
                .post('/api/views')
                .set('X-User-ID', userId)
                .send({ movieId });

            const second = await request(app)
                .post('/api/views')
                .set('X-User-ID', userId)
                .send({ movieId });

            expect(first.status).toBe(201);
            expect(second.status).toBe(201);
            expect(second.body.id).not.toBe(first.body.id);
        });

        it('returns 422 for missing movieId', async () => {
            const response = await request(app)
                .post('/api/views')
                .set('X-User-ID', userId)
                .send({});

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invalid request body');
        });

        it('returns 422 for a non-integer movieId', async () => {
            const response = await request(app)
                .post('/api/views')
                .set('X-User-ID', userId)
                .send({ movieId: 'abc' });

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invalid request body');
        });

        it('returns 422 for a non-positive movieId', async () => {
            const response = await request(app)
                .post('/api/views')
                .set('X-User-ID', userId)
                .send({ movieId: -1 });

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invalid request body');
        });

        it('returns 401 for unauthenticated requests', async () => {
            const response = await request(app).post('/api/views').send({ movieId });

            expect(response.status).toBe(401);
        });
    });
});
