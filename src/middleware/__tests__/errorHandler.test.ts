import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import {
    HttpError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    UnprocessableEntityError,
    errorHandler,
} from '@middleware/errorHandler.js';

const mockRes = () => {
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    return res;
};

const req = {} as Request;
const next = vi.fn() as NextFunction;

describe('HttpError', () => {
    it('should set statusCode and message', () => {
        const err = new HttpError(418, "I'm a teapot");
        expect(err.statusCode).toBe(418);
        expect(err.message).toBe("I'm a teapot");
        expect(err).toBeInstanceOf(Error);
    });
});

describe('Error subclasses', () => {
    it.each([
        { Class: BadRequestError, status: 400, defaultMsg: 'Bad request' },
        { Class: UnauthorizedError, status: 401, defaultMsg: 'Unauthorized' },
        { Class: ForbiddenError, status: 403, defaultMsg: 'Forbidden' },
        { Class: NotFoundError, status: 404, defaultMsg: 'Not found' },
        { Class: ConflictError, status: 409, defaultMsg: 'Conflict' },
        {
            Class: UnprocessableEntityError,
            status: 422,
            defaultMsg: 'Unprocessable entity',
        },
    ])(
        '$Class.name uses status $status and correct default message',
        ({ Class, status, defaultMsg }) => {
            const err = new Class();
            expect(err.statusCode).toBe(status);
            expect(err.message).toBe(defaultMsg);
            expect(err).toBeInstanceOf(HttpError);
        },
    );

    it('allows overriding the default message', () => {
        const err = new NotFoundError('Movie not found');
        expect(err.message).toBe('Movie not found');
    });
});

describe('errorHandler', () => {
    it('returns the statusCode and message for an HttpError', () => {
        const res = mockRes();
        errorHandler(new NotFoundError('Movie not found'), req, res, next);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Movie not found' });
    });

    it('returns 500 for an unhandled Error', () => {
        const res = mockRes();
        errorHandler(new Error('Something broke'), req, res, next);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });

    it('returns 500 for a non-Error thrown value', () => {
        const res = mockRes();
        errorHandler('oops', req, res, next);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });

    it('logs the stack trace for unhandled errors', () => {
        const res = mockRes();
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const err = new Error('Something broke');
        errorHandler(err, req, res, next);
        expect(consoleSpy).toHaveBeenCalledWith('Unhandled error:', err.stack);
        consoleSpy.mockRestore();
    });

    it('logs the raw value for non-Error thrown values', () => {
        const res = mockRes();
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        errorHandler('raw string error', req, res, next);
        expect(consoleSpy).toHaveBeenCalledWith('Unhandled error:', 'raw string error');
        consoleSpy.mockRestore();
    });
});
