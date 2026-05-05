import prisma from '@/lib/prisma.js';
import { EmailEventType, EmailStatus } from '@/generated/prisma/client.js';
import { sendEmail } from '@clients/resend.js';
import {
    type EmailTemplateInput,
    type TemplateResult,
    welcomeTemplate,
    watchlistMilestoneTemplate,
    weeklyDigestTemplate,
    passwordResetTemplate,
} from '@/templates/index.js';
import type { EmailNotification } from '@/generated/prisma/client.js';
import { z } from 'zod';

export { EmailEventType, EmailStatus };

const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 3;
const STUCK_THRESHOLD_MS = 10 * 60 * 1000;

const welcomeDataSchema = z.object({ firstName: z.string(), lastName: z.string() });
const watchlistMilestoneDataSchema = z.object({
    firstName: z.string(),
    milestoneCount: z.number(),
});
const weeklyDigestDataSchema = z.object({
    firstName: z.string(),
    topMovies: z.array(z.object({ title: z.string(), ratings: z.number() })),
    weekLabel: z.string(),
});
const passwordResetDataSchema = z.object({
    firstName: z.string(),
    resetUrl: z.string(),
    expiresInMinutes: z.number(),
});

export function buildIdempotencyKey(
    eventType: EmailEventType,
    userId: string,
    discriminator?: string,
): string {
    return discriminator
        ? `${eventType}:${userId}:${discriminator}`
        : `${eventType}:${userId}`;
}

export function renderTemplate(input: EmailTemplateInput): TemplateResult {
    switch (input.eventType) {
        case 'welcome':
            return welcomeTemplate(input.data);
        case 'watchlist_milestone':
            return watchlistMilestoneTemplate(input.data);
        case 'weekly_digest':
            return weeklyDigestTemplate(input.data);
        case 'password_reset':
            return passwordResetTemplate(input.data);
    }
}

function parseTemplateData(
    eventType: EmailEventType,
    raw: unknown,
): EmailTemplateInput {
    switch (eventType) {
        case EmailEventType.welcome:
            return { eventType: 'welcome', data: welcomeDataSchema.parse(raw) };
        case EmailEventType.watchlist_milestone:
            return {
                eventType: 'watchlist_milestone',
                data: watchlistMilestoneDataSchema.parse(raw),
            };
        case EmailEventType.weekly_digest:
            return {
                eventType: 'weekly_digest',
                data: weeklyDigestDataSchema.parse(raw),
            };
        case EmailEventType.password_reset:
            return {
                eventType: 'password_reset',
                data: passwordResetDataSchema.parse(raw),
            };
    }
}

export async function enqueueEmailNotification(params: {
    userId: string;
    eventType: EmailEventType;
    templateData: Record<string, unknown>;
    idempotencyKey: string;
}): Promise<EmailNotification> {
    return prisma.emailNotification.upsert({
        where: { idempotencyKey: params.idempotencyKey },
        create: {
            userId: params.userId,
            eventType: params.eventType,
            templateData: params.templateData,
            idempotencyKey: params.idempotencyKey,
        },
        update: {},
    });
}

export interface ProcessResult {
    sent: number;
    failed: number;
    skipped: number;
}

export async function processPendingEmailNotifications(): Promise<ProcessResult> {
    const result: ProcessResult = { sent: 0, failed: 0, skipped: 0 };
    const claimed = await prisma.$transaction(async (tx) => {
        const batch = await tx.emailNotification.findMany({
            where: { status: EmailStatus.pending },
            take: BATCH_SIZE,
            orderBy: { createdAt: 'asc' },
            include: { user: { select: { email: true } } },
        });

        if (batch.length === 0) return [];

        await tx.emailNotification.updateMany({
            where: {
                id: { in: batch.map((n) => n.id) },
                status: EmailStatus.pending,
            },
            data: { status: EmailStatus.sending, attemptCount: { increment: 1 } },
        });

        return batch;
    });

    for (const notification of claimed) {
        const attemptCount = notification.attemptCount + 1;

        if (attemptCount > MAX_ATTEMPTS) {
            await prisma.emailNotification.update({
                where: { id: notification.id },
                data: {
                    status: EmailStatus.failed,
                    lastError: `Max attempts (${MAX_ATTEMPTS}) exceeded`,
                },
            });
            result.skipped++;
            continue;
        }

        try {
            const input = parseTemplateData(notification.eventType, notification.templateData);
            const rendered = renderTemplate(input);

            const { id: resendId } = await sendEmail({
                to: notification.user.email,
                subject: rendered.subject,
                html: rendered.html,
                text: rendered.text,
            });

            await prisma.emailNotification.update({
                where: { id: notification.id },
                data: {
                    status: EmailStatus.sent,
                    resendId,
                    sentAt: new Date(),
                    lastError: null,
                },
            });
            result.sent++;
        } catch (err) {
            const lastError = err instanceof Error ? err.message : String(err);
            const nextStatus =
                attemptCount < MAX_ATTEMPTS ? EmailStatus.pending : EmailStatus.failed;

            await prisma.emailNotification.update({
                where: { id: notification.id },
                data: { status: nextStatus, lastError },
            });
            result.failed++;
        }
    }

    return result;
}

export async function resetStuckEmailNotifications(): Promise<number> {
    const threshold = new Date(Date.now() - STUCK_THRESHOLD_MS);

    const { count } = await prisma.emailNotification.updateMany({
        where: {
            status: EmailStatus.sending,
            updatedAt: { lt: threshold },
        },
        data: { status: EmailStatus.pending },
    });

    return count;
}
