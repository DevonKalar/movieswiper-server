import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import prisma from '@/lib/prisma.js';
import * as resendClient from '@clients/resend.js';
import { EmailEventType, EmailStatus } from '@/generated/prisma/client.js';
import { enqueueEmailNotification, buildIdempotencyKey } from '@services/emailNotifications.js';
import { processEmailNotifications } from '../job.js';

vi.mock('@clients/resend.js', () => ({
    sendEmail: vi.fn(),
}));

const mockSendEmail = vi.mocked(resendClient.sendEmail);

describe('processEmailNotifications (integration)', () => {
    let userId: string;

    beforeAll(async () => {
        const user = await prisma.user.create({
            data: {
                email: 'email-job-test@example.com',
                password: 'hashedpassword',
                firstName: 'Test',
                lastName: 'User',
            },
        });
        userId = user.id;
    });

    afterAll(async () => {
        await prisma.emailNotification.deleteMany({ where: { userId } });
        await prisma.user.deleteMany({ where: { id: userId } });
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        vi.clearAllMocks();
        await prisma.emailNotification.deleteMany({ where: { userId } });
    });

    it('sends a pending email and updates status to sent', async () => {
        mockSendEmail.mockResolvedValue({ id: 'msg_integration_1' });

        await enqueueEmailNotification({
            userId,
            eventType: EmailEventType.welcome,
            templateData: { firstName: 'Test', lastName: 'User' },
            idempotencyKey: buildIdempotencyKey(EmailEventType.welcome, userId),
        });

        await processEmailNotifications();

        const notification = await prisma.emailNotification.findFirst({
            where: { userId },
        });

        expect(notification?.status).toBe(EmailStatus.sent);
        expect(notification?.resendId).toBe('msg_integration_1');
        expect(notification?.sentAt).toBeTruthy();
    });

    it('recovers stuck emails and processes them', async () => {
        mockSendEmail.mockResolvedValue({ id: 'msg_integration_2' });

        // Insert a notification manually in "sending" state with an old updatedAt
        await prisma.emailNotification.create({
            data: {
                userId,
                eventType: EmailEventType.welcome,
                status: EmailStatus.sending,
                idempotencyKey: `welcome:${userId}:stuck-test`,
                templateData: { firstName: 'Test', lastName: 'User' },
                attemptCount: 1,
                updatedAt: new Date(Date.now() - 20 * 60 * 1000), // 20 min ago
            },
        });

        await processEmailNotifications();

        const notification = await prisma.emailNotification.findFirst({
            where: { idempotencyKey: `welcome:${userId}:stuck-test` },
        });

        expect(notification?.status).toBe(EmailStatus.sent);
    });

    it('does not create duplicate records for the same idempotency key', async () => {
        mockSendEmail.mockResolvedValue({ id: 'msg_integration_3' });

        const key = buildIdempotencyKey(EmailEventType.welcome, userId, 'dedup-test');

        await enqueueEmailNotification({
            userId,
            eventType: EmailEventType.welcome,
            templateData: { firstName: 'Test', lastName: 'User' },
            idempotencyKey: key,
        });

        await enqueueEmailNotification({
            userId,
            eventType: EmailEventType.welcome,
            templateData: { firstName: 'Test', lastName: 'User' },
            idempotencyKey: key,
        });

        const records = await prisma.emailNotification.findMany({
            where: { idempotencyKey: key },
        });

        expect(records).toHaveLength(1);
    });
});
