import { createHash } from 'crypto';
import prisma from '@/lib/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ConflictError, NotFoundError } from '@middleware/errorHandler.js';
import { config } from '@/config/env.js';
import {
    enqueueEmailNotification,
    buildIdempotencyKey,
    EmailEventType,
} from '@services/emailNotifications.js';

export interface UserPayload {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}

function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

export function signAccessToken(userId: string): string {
    return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: '15m' });
}

export function signRefreshToken(userId: string): string {
    return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: '7d' });
}

export async function createRefreshToken(userId: string): Promise<string> {
    const token = signRefreshToken(userId);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
        data: { userId, tokenHash: hashToken(token), expiresAt },
    });

    return token;
}

export async function rotateRefreshToken(
    rawToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: jwt.JwtPayload;
    try {
        payload = jwt.verify(rawToken, config.jwtSecret) as jwt.JwtPayload;
    } catch {
        throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(rawToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.expiresAt < new Date()) {
        if (stored) await prisma.refreshToken.delete({ where: { tokenHash } });
        throw new UnauthorizedError('Invalid or expired refresh token');
    }

    await prisma.refreshToken.delete({ where: { tokenHash } });

    const accessToken = signAccessToken(payload.sub!);
    const refreshToken = await createRefreshToken(payload.sub!);

    return { accessToken, refreshToken };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    await prisma.refreshToken.deleteMany({ where: { tokenHash } });
}

export async function authenticateUser(email: string, password: string): Promise<UserPayload> {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new UnauthorizedError('Invalid email or password');
    }

    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
    };
}

export async function createUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
): Promise<UserPayload> {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw new ConflictError('User with that email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
        data: { email, firstName, lastName, password: hashedPassword },
    });

    await enqueueEmailNotification({
        userId: user.id,
        eventType: EmailEventType.welcome,
        templateData: { firstName: user.firstName, lastName: user.lastName },
        idempotencyKey: buildIdempotencyKey(EmailEventType.welcome, user.id),
    });

    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
    };
}

export async function findUserById(userId: string): Promise<UserPayload> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new NotFoundError('User not found');
    }

    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
    };
}
