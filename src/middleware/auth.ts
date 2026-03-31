import type { JwtPayload } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "@middleware/errorHandler.js";
import { config } from "@/config/env.js";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many login attempts, please try again later.",
});

export const requireUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next(new UnauthorizedError("No token"));
  }

  try {
    const decoded = jwt.verify(
      token,
      config.jwtSecret,
    ) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    next(new UnauthorizedError("Invalid token"));
  }
};

export const optionalUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(
      token,
      config.jwtSecret,
    ) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    console.error("OptionalUser - Token invalid", err);
    next();
  }
};
