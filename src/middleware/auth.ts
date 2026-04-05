import type { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "@middleware/errorHandler.js";

export const requireUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.headers["x-user-id"];
  
  if (!userId || typeof userId !== "string") {
    return next(new UnauthorizedError("No token"));
  }

  req.user = { id: userId };
  next();
};

export const optionalUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.headers["x-user-id"];

  if (userId && typeof userId === "string") {
    req.user = { id: userId };
  }

  next();
};
