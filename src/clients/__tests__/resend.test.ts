import { http, HttpResponse } from 'msw';
import { setupMSW } from '@tests/utils/setupMSW.js';
import { server } from '@tests/mocks/server.js';
import { sendEmail } from '../resend.js';

describe('sendEmail', () => {
    setupMSW();

    it('returns the resend message id on success', async () => {
        server.use(
            http.post('https://api.resend.com/emails', () => {
                return HttpResponse.json({ id: 'msg_abc123' }, { status: 200 });
            }),
        );

        const result = await sendEmail({
            to: 'user@example.com',
            subject: 'Test',
            html: '<p>Hello</p>',
            text: 'Hello',
        });

        expect(result).toEqual({ id: 'msg_abc123' });
    });

    it('throws a descriptive error when Resend returns an error', async () => {
        server.use(
            http.post('https://api.resend.com/emails', () => {
                return HttpResponse.json(
                    { name: 'validation_error', message: 'Invalid email address', statusCode: 422 },
                    { status: 422 },
                );
            }),
        );

        await expect(
            sendEmail({
                to: 'bad-email',
                subject: 'Test',
                html: '<p>Hello</p>',
                text: 'Hello',
            }),
        ).rejects.toThrow('Resend error');
    });
});
