import type { User } from "@/generated/prisma/client.js";

// Omit sensitive fields from Prisma User type
export type SafeUser = Omit<User, "password">;

// Auth user data (without password)
export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

// Response types
export type LoginResponse = {
  message: string;
  accessToken: string;
  refreshToken: string;
} & AuthUser;

export type RegisterResponse = {
  message: string;
  accessToken: string;
  refreshToken: string;
} & AuthUser;

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

export type LogoutResponse = {
  message: string;
};

export type CheckAuthResponse = {
  message: string;
} & AuthUser;

// Error responses
export type AuthErrorResponse = {
  message: string;
};
