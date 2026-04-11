import { describe, it, expect, vi } from "vitest";
import {
  validateReqBody,
  validateReqParams,
  validateReqQuery,
} from "@middleware/validate.js";
import { loginSchema, registerSchema } from "@/models/auth.js";
import { movieDetailsSchema, movieQuerySchema } from "@/models/tmdb.js";
import { movieRecommendationSchema } from "@/models/recommendations.js";
import type { Request, Response, NextFunction } from "express";

describe("Validation Middleware", () => {
  describe("validateReqQuery", () => {
    it("should call next() for valid query parameters (movieQuerySchema)", async () => {
      // Arrange
      const validQuery = {
        include_adult: "false",
        include_video: "false",
        language: "en-US",
        page: "1",
        sort_by: "popularity.desc",
      };
      const req = { query: validQuery } as Partial<Request> as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      const middleware = validateReqQuery(movieQuerySchema);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledOnce();
      expect(next).toHaveBeenCalledWith();
      expect(req.validatedQuery).toEqual(validQuery);
    });

    it("should call next() for valid query parameters (movieRecommendationSchema)", async () => {
      // Arrange
      const validQuery = { page: "1" };
      const req = { query: validQuery } as Partial<Request> as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      const middleware = validateReqQuery(movieRecommendationSchema);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledOnce();
      expect(next).toHaveBeenCalledWith();
      expect(req.validatedQuery).toEqual(validQuery);
    });

    it("should return 422 for invalid query parameters", async () => {
      // Arrange
      const invalidQuery = { page: "not-a-number" };
      const req = { query: invalidQuery } as Partial<Request> as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      const middleware = validateReqQuery(movieRecommendationSchema);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid request query",
          errors: expect.any(Array),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("validateReqBody", () => {
    it("should call next() for valid request body (loginSchema)", async () => {
      // Arrange
      const validBody = {
        email: "test@example.com",
        password: "password123",
      };
      const req = { body: validBody } as Partial<Request> as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      const middleware = validateReqBody(loginSchema);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledOnce();
      expect(next).toHaveBeenCalledWith();
      expect(req.validatedBody).toEqual(validBody);
    });

    it("should call next() for valid request body (registerSchema)", async () => {
      // Arrange
      const validBody = {
        email: "newuser@example.com",
        password: "securepass123",
        firstName: "John",
        lastName: "Doe",
      };
      const req = { body: validBody } as Partial<Request> as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      const middleware = validateReqBody(registerSchema);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledOnce();
      expect(next).toHaveBeenCalledWith();
      expect(req.validatedBody).toEqual(validBody);
    });

    it("should return 422 for invalid request body (loginSchema)", async () => {
      // Arrange
      const invalidBody = { email: "invalid-email", password: "123" };
      const req = { body: invalidBody } as Partial<Request> as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      const middleware = validateReqBody(loginSchema);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid request body",
          errors: expect.any(Array),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("validateReqParams", () => {
    it("should call next() for valid request params (movieDetailsSchema)", async () => {
      // Arrange
      const validParams = { id: "550" };
      const req = { params: validParams } as Partial<Request> as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      const middleware = validateReqParams(movieDetailsSchema);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledOnce();
      expect(next).toHaveBeenCalledWith();
      expect(req.validatedParams).toEqual(validParams);
    });

    it("should return 422 for invalid request params (movieDetailsSchema)", async () => {
      // Arrange
      const invalidParams = { id: "" };
      const req = { params: invalidParams } as Partial<Request> as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      const middleware = validateReqParams(movieDetailsSchema);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid request params",
          errors: expect.any(Array),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});
