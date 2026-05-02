import type { Request, Response, NextFunction } from 'express';
import * as z from 'zod';

export const validateReqBody = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            req.validatedBody = await schema.parseAsync(req.body);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res
                    .status(422)
                    .json({ message: 'Invalid request body', errors: error.issues });
            }
            next(error);
        }
    };
};

export const validateReqQuery = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            req.validatedQuery = await schema.parseAsync(req.query);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res
                    .status(422)
                    .json({ message: 'Invalid request query', errors: error.issues });
            }
            next(error);
        }
    };
};

export const validateReqParams = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            req.validatedParams = await schema.parseAsync(req.params);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res
                    .status(422)
                    .json({ message: 'Invalid request params', errors: error.issues });
            }
            next(error);
        }
    };
};
