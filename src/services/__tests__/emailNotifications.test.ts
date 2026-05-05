import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/lib/prisma.js';
import * as resendClient from '@clients/resend.js';
import { EmailEventType, EmailStatus } from '@/generated/prisma/client.js';
import {
    buildIdempotencyKey,
    renderTemplate,
    enqueueEmailNotification,
    processPendingEmailNotifications,
    resetStuckEmailNotifications,
} from '../emailNotifications.js';

vi.mock('@/lib/prisma.js', () => ({
    default: {
        $transaction: vi.fn(),
        emailNotification: {
            upsert: vi.fn(),
            findMany: vi.fn(),
            updateMany: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock('@clients/resend.js', () => ({
    sendEmail: vi.fn(),
}));

const mockPrisma = prisma as unknown as {
    $transaction: ReturnType<typeof vi.fn>;
    emailNotification: {
        upsert: ReturnType<typeof vi.fn>;
        findMany: ReturnType<typeof vi.fn>;
        updateMany: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
    };
};

const mockSendEmail = vi.mocked(resendClient.sendEmail);

beforeEach(() => {
    vi.clearAllMocks();
});

describe('buildIdempotencyKey', () => {
    it('returns eventType:userId without discriminator', () => {
        expect(buildIdempotencyKey(EmailEventType.welcome, 'user-1')).toBe(
            'welcome:user-1',
        );
    });

    it('returns eventType:userId:discriminator with discriminator', () => {
        expect(
            buildIdempotencyKey(EmailEventType.watchlist_milestone, 'user-1', '10'),
        ).toBe('watchlist_milestone:user-1:10');
    });
});

describe('renderTemplate', () => {
    it('renders welcome template with correct subject', () => {
        const result = renderTemplate({
            eventType: 'welcome',
            data: { firstName: 'Alice', lastName: 'Smith' },
        });
        expect(result.subject).toContain('Alice');
        expect(result.html).toBeTruthy();
        expect(result.text).toBeTruthy();
    });

    it('renders watchlist_milestone template', () => {
        const result = renderTemplate({
            eventType: 'watchlist_milestone',
            data: { firstName: 'Bob', milestoneCount: 10 },
        });
        expect(result.subject).toContain('10');
    });

    it('renders weekly_digest template', () => {
        const result = renderTemplate({
            eventType: 'weekly_digest',
            data: {
                firstName: 'Carol',
                topMovies: [{ title: 'Inception', ratings: 8.8 }],
                weekLabel: 'Week of May 4',
            },
        });
        expect(result.subject).toContain('Week of May 4');
    });

    it('renders password_reset template with reset url', () => {
        const result = renderTemplate({
            eventType: 'password_reset',
            data: {
                firstName: 'Dave',
                resetUrl: 'https://example.com/reset',
                expiresInMinutes: 30,
            },
        });
        expect(result.html).toContain('https://example.com/reset');
    });
});

describe('enqueueEmailNotification', () => {
    it('upserts a notification record with pending status', async () => {
        const fakeRecord = { id: 'notif-1', status: EmailStatus.pending };
        mockPrisma.emailNotification.upsert.mockResolvedValue(fakeRecord);

        const result = await enqueueEmailNotification({
            userId: 'user-1',
            eventType: EmailEventType.welcome,
            templateData: { firstName: 'Alice', lastName: 'Smith' },
            idempotencyKey: 'welcome:user-1',
        });

        expect(mockPrisma.emailNotification.upsert).toHaveBeenCalledWith({
            where: { idempotencyKey: 'welcome:user-1' },
            create: expect.objectContaining({
                userId: 'user-1',
                eventType: EmailEventType.welcome,
                idempotencyKey: 'welcome:user-1',
            }),
            update: {},
        });
        expect(result).toBe(fakeRecord);
    });

    it('is idempotent — a duplicate key does not throw', async () => {
        mockPrisma.emailNotification.upsert.mockResolvedValue({ id: 'notif-1' });

        await enqueueEmailNotification({
            userId: 'user-1',
            eventType: EmailEventType.welcome,
            templateData: { firstName: 'Alice', lastName: 'Smith' },
            idempotencyKey: 'welcome:user-1',
        });

        await expect(
            enqueueEmailNotification({
                userId: 'user-1',
                eventType: EmailEventType.welcome,
                templateData: { firstName: 'Alice', lastName: 'Smith' },
                idempotencyKey: 'welcome:user-1',
            }),
        ).resolves.toBeDefined();

        expect(mockPrisma.emailNotification.upsert).toHaveBeenCalledTimes(2);
    });
});

describe('processPendingEmailNotifications', () => {
    const makeNotification = (overrides = {}) => ({
        id: 'notif-1',
        userId: 'user-1',
        eventType: EmailEventType.welcome,
        status: EmailStatus.sending,
        idempotencyKey: 'welcome:user-1',
        templateData: { firstName: 'Alice', lastName: 'Smith' },
        resendId: null,
        lastError: null,
        attemptCount: 0,
        sentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { email: 'alice@example.com' },
        ...overrides,
    });

    beforeEach(() => {
        mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => Promise<unknown>) =>
            callback(mockPrisma),
        );
    });

    it('sends pending emails and marks them sent', async () => {
        const notification = makeNotification();
        mockPrisma.emailNotification.findMany.mockResolvedValue([notification]);
        mockPrisma.emailNotification.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.emailNotification.update.mockResolvedValue({});
        mockSendEmail.mockResolvedValue({ id: 'msg_xyz' });

        const result = await processPendingEmailNotifications();

        expect(mockSendEmail).toHaveBeenCalledWith(
            expect.objectContaining({ to: 'alice@example.com' }),
        );
        expect(mockPrisma.emailNotification.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'notif-1' },
                data: expect.objectContaining({
                    status: EmailStatus.sent,
                    resendId: 'msg_xyz',
                }),
            }),
        );
        expect(result).toEqual({ sent: 1, failed: 0, skipped: 0 });
    });

    it('records lastError and marks failed when sendEmail throws', async () => {
        const notification = makeNotification({ attemptCount: 2 });
        mockPrisma.emailNotification.findMany.mockResolvedValue([notification]);
        mockPrisma.emailNotification.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.emailNotification.update.mockResolvedValue({});
        mockSendEmail.mockRejectedValue(new Error('Resend error: rate limited'));

        const result = await processPendingEmailNotifications();

        expect(mockPrisma.emailNotification.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'notif-1' },
                data: expect.objectContaining({
                    status: EmailStatus.failed,
                    lastError: 'Resend error: rate limited',
                }),
            }),
        );
        expect(result).toEqual({ sent: 0, failed: 1, skipped: 0 });
    });

    it('skips send and marks failed when attemptCount reaches MAX_ATTEMPTS', async () => {
        // attemptCount is incremented to 3 inside the transaction (increment: 1), so
        // we simulate a notification that already has attemptCount=3 after the increment.
        const notification = makeNotification({ attemptCount: 3 });
        mockPrisma.emailNotification.findMany.mockResolvedValue([notification]);
        mockPrisma.emailNotification.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.emailNotification.update.mockResolvedValue({});

        const result = await processPendingEmailNotifications();

        expect(mockSendEmail).not.toHaveBeenCalled();
        expect(mockPrisma.emailNotification.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ status: EmailStatus.failed }),
            }),
        );
        expect(result).toEqual({ sent: 0, failed: 0, skipped: 1 });
    });

    it('returns zeros when no pending notifications exist', async () => {
        mockPrisma.emailNotification.findMany.mockResolvedValue([]);
        mockPrisma.emailNotification.updateMany.mockResolvedValue({ count: 0 });

        const result = await processPendingEmailNotifications();

        expect(mockSendEmail).not.toHaveBeenCalled();
        expect(result).toEqual({ sent: 0, failed: 0, skipped: 0 });
    });
});

describe('resetStuckEmailNotifications', () => {
    it('calls updateMany with sending status and a time threshold', async () => {
        mockPrisma.emailNotification.updateMany.mockResolvedValue({ count: 2 });

        const before = new Date();
        const count = await resetStuckEmailNotifications();
        const after = new Date();

        expect(mockPrisma.emailNotification.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    status: EmailStatus.sending,
                    updatedAt: expect.objectContaining({ lt: expect.any(Date) }),
                }),
                data: { status: EmailStatus.pending },
            }),
        );
        expect(count).toBe(2);
    });
});
