declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
      validatedParams?: Record<string, unknown>;
      validatedBody?: Record<string, unknown>;
      validatedQuery?: Record<string, unknown>;
    }
  }
}

export {};
