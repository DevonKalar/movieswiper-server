import type { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      validatedParams?: Record<string, any>;
      validatedBody?: Record<string, any>;
      validatedQuery?: Record<string, any>;
    }
  }
}
