import { http, HttpResponse } from 'msw';
import { server } from '@tests/mocks/server.js';
import { setupMSW } from '@tests/utils/setupMSW.js';
import { createResponse, retrieveResponse } from '@clients/openai.js';
import { expect, describe, it } from 'vitest';

const OPENAI_BASE = 'https://api.openai.com/v1';

describe('createResponse', () => {
    setupMSW();

    it('returns the API response for a basic input', async () => {
        const payload = {
            id: 'resp_001',
            object: 'response',
            status: 'completed',
            output: 'Hello!',
        };
        server.use(http.post(`${OPENAI_BASE}/responses`, () => HttpResponse.json(payload)));

        const result = await createResponse('Say hello');

        expect(result).toEqual(payload);
    });

    it('sends instructions and previous_response_id when provided', async () => {
        let capturedBody: Record<string, unknown> = {};
        server.use(
            http.post(`${OPENAI_BASE}/responses`, async ({ request }) => {
                capturedBody = (await request.json()) as Record<string, unknown>;
                return HttpResponse.json({ id: 'resp_002', status: 'completed' });
            }),
        );

        await createResponse('Continue', 'Be concise', 'resp_001');

        expect(capturedBody.instructions).toBe('Be concise');
        expect(capturedBody.previous_response_id).toBe('resp_001');
        expect(capturedBody.model).toBe('gpt-4o');
    });

    it('omits instructions and previous_response_id when not provided', async () => {
        let capturedBody: Record<string, unknown> = {};
        server.use(
            http.post(`${OPENAI_BASE}/responses`, async ({ request }) => {
                capturedBody = (await request.json()) as Record<string, unknown>;
                return HttpResponse.json({ id: 'resp_003', status: 'completed' });
            }),
        );

        await createResponse('Hello');

        expect(capturedBody).not.toHaveProperty('instructions');
        expect(capturedBody).not.toHaveProperty('previous_response_id');
    });

    it('throws when the API responds with an error', async () => {
        server.use(
            http.post(`${OPENAI_BASE}/responses`, () =>
                HttpResponse.json({ error: { message: 'Invalid API key' } }, { status: 401 }),
            ),
        );

        await expect(createResponse('Hello')).rejects.toThrow();
    });
});

describe('retrieveResponse', () => {
    setupMSW();

    it('returns the response for a given id', async () => {
        const payload = {
            id: 'resp_001',
            object: 'response',
            status: 'completed',
            output: 'Hello!',
        };
        server.use(http.get(`${OPENAI_BASE}/responses/resp_001`, () => HttpResponse.json(payload)));

        const result = await retrieveResponse('resp_001');

        expect(result).toEqual(payload);
    });

    it('throws when the API responds with an error', async () => {
        server.use(
            http.get(`${OPENAI_BASE}/responses/bad_id`, () =>
                HttpResponse.json({ error: { message: 'Not found' } }, { status: 404 }),
            ),
        );

        await expect(retrieveResponse('bad_id')).rejects.toThrow();
    });
});
