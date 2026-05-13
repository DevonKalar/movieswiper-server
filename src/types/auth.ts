import type { User } from '@/generated/prisma/client.js';

// Omit sensitive fields from Prisma User type
export type SafeUser = Omit<User, 'password'>;

// Discriminated union: guest vs full account
export type GuestAuthUser = {
    id: string;
    isGuest: true;
    email: null;
    firstName: null;
    lastName: null;
};

export type FullAuthUser = {
    id: string;
    isGuest: false;
    email: string;
    firstName: string;
    lastName: string;
};

export type AuthUser = GuestAuthUser | FullAuthUser;

// Response types
export type LoginResponse = {
    message: string;
    accessToken: string;
    refreshToken: string;
    user: FullAuthUser;
};

export type RegisterResponse = {
    message: string;
    accessToken: string;
    refreshToken: string;
    user: FullAuthUser;
};

export type GuestResponse = {
    message: string;
    accessToken: string;
    refreshToken: string;
    user: GuestAuthUser;
};

export type PromoteResponse = {
    message: string;
    accessToken: string;
    refreshToken: string;
    user: FullAuthUser;
};

export type RefreshResponse = {
    accessToken: string;
    refreshToken: string;
};

export type LogoutResponse = {
    message: string;
};

export type CheckAuthResponse = {
    message: string;
    id: string;
    isGuest: boolean;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
};

// Error responses
export type AuthErrorResponse = {
    message: string;
};
