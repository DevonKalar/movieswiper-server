import { describe, it, expect } from 'vitest';
import { createResponse, retrieveResponse } from '@clients/openai.js';

describe('OpenAI client (integration)', () => {
    describe('createResponse', () => {
        it('returns a completed response for a simple prompt', async () => {
            const result = await createResponse('Reply with the single word: pong');

            expect(result).toMatchObject({
                id: expect.any(String),
                status: expect.any(String),
            });
            expect(result.id.length).toBeGreaterThan(0);
        });

        it('accepts instructions that shape the response', async () => {
            const result = await createResponse(
                'What is 1 + 1?',
                'You are a calculator. Reply with only the numeric result.',
            );

            expect(result).toMatchObject({
                id: expect.any(String),
                status: expect.any(String),
            });
        });

        it('accepts a previous_response_id for multi-turn continuations', async () => {
            const first = await createResponse('My favourite colour is blue. Acknowledge this.');
            expect(first.id).toBeTruthy();

            const second = await createResponse(
                'What is my favourite colour?',
                undefined,
                first.id,
            );

            expect(second).toMatchObject({
                id: expect.any(String),
                status: expect.any(String),
            });
        });
    });

    describe('retrieveResponse', () => {
        it('retrieves a previously created response by id', async () => {
            const created = await createResponse('Say hello');
            const retrieved = await retrieveResponse(created.id);

            expect(retrieved).toMatchObject({
                id: created.id,
                status: expect.any(String),
            });
        });

        it('throws for an unknown response id', async () => {
            await expect(retrieveResponse('resp_doesnotexist')).rejects.toThrow();
        });
    });
});
