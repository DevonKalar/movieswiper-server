import type { Request, Response, NextFunction } from 'express';

export class HttpError extends Error {
    constructor(
        public statusCode: number,
        message: string,
    ) {
        super(message);
        this.name = 'HttpError';
    }
}

export class BadRequestError extends HttpError {
    constructor(message = 'Bad request') {
        super(400, message);
        this.name = 'BadRequestError';
    }
}

export class UnauthorizedError extends HttpError {
    constructor(message = 'Unauthorized') {
        super(401, message);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends HttpError {
    constructor(message = 'Forbidden') {
        super(403, message);
        this.name = 'ForbiddenError';
    }
}

export class NotFoundError extends HttpError {
    constructor(message = 'Not found') {
        super(404, message);
        this.name = 'NotFoundError';
    }
}

export class ConflictError extends HttpError {
    constructor(message = 'Conflict') {
        super(409, message);
        this.name = 'ConflictError';
    }
}

export class UnprocessableEntityError extends HttpError {
    constructor(message = 'Unprocessable entity') {
        super(422, message);
        this.name = 'UnprocessableEntityError';
    }
}

export const errorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction,
) => {
    if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
    }

    console.error('Unhandled error:', err instanceof Error ? err.stack : err);
    return res.status(500).json({ message: 'Internal server error' });
};
