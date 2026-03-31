import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma.js";
import watchlistRouter from "@routes/watchlist.js";
import { requireUser } from "@middleware/auth.js";
import { errorHandler } from "@middleware/errorHandler.js";
import type { Movie } from "@/types/movie.js";
import { config } from "@/config/env.js";

const app = express();
app.use(express.json());
app.use("/api/watchlist", requireUser, watchlistRouter);
app.use(errorHandler);

describe("Watchlist Integration Tests", () => {
  let userId: string;
  let movieId: number;
  let authToken: string;

  const testMovieData: { movies: Movie[] } = {
    movies: [
      {
        id: 999999,
        title: "Test Movie",
        description: "A test movie",
        releaseDate: "2024-01-01",
        posterUrl: "https://example.com/poster.jpg",
        genres: ["Action", "Drama"],
        ratings: 8.5,
      },
    ],
  };

  beforeAll(async () => {
    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: "watchlist-test@example.com",
        password: "hashedpassword",
        firstName: "Test",
        lastName: "User",
      },
    });
    userId = testUser.id;

    // Generate auth token
    authToken = jwt.sign({ id: testUser.id }, config.jwtSecret);

    // Create a test movie
    const testMovie = await prisma.movies.create({
      data: {
        id: 999999,
        title: "Test Movie",
        description: "A test movie",
        releaseDate: new Date("2024-01-01"),
        posterUrl: "https://example.com/poster.jpg",
        genres: ["Action", "Drama"],
        ratings: 8.5,
      },
    });
    movieId = testMovie.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.watchlist.deleteMany({ where: { userId } });
    await prisma.movies.deleteMany({ where: { id: 999999 } });
    await prisma.user.deleteMany({
      where: { email: "watchlist-test@example.com" },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear watchlist entries before each test
    await prisma.watchlist.deleteMany({ where: { userId } });
  });

  describe("GET /watchlist", () => {
    it("should return empty watchlist for authenticated user", async () => {
      const response = await request(app)
        .get("/api/watchlist")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("watchlist");
      expect(response.body.watchlist).toEqual([]);
    });

    it("should return watchlist with movies for authenticated user", async () => {
      // Add movie to watchlist
      await prisma.watchlist.create({
        data: { userId, movieId },
      });

      const response = await request(app)
        .get("/api/watchlist")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.watchlist).toHaveLength(1);
      expect(response.body.watchlist[0]).toHaveProperty("movie");
      expect(response.body.watchlist[0].movie.title).toBe("Test Movie");
    });

    it("should return 401 for unauthenticated user", async () => {
      const response = await request(app).get("/api/watchlist");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /watchlist", () => {
    it("should add movies to watchlist", async () => {
      const response = await request(app)
        .post("/api/watchlist")
        .set("Authorization", `Bearer ${authToken}`)
        .send(testMovieData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty(
        "message",
        expect.stringContaining("movies added to watchlist"),
      );
    });

    it("should add multiple movies to watchlist", async () => {
      const bulkMoviesData = {
        movies: [
          {
            id: 888888,
            title: "Bulk Movie 1",
            description: "First bulk movie",
            releaseDate: "2024-02-01",
            posterUrl: "https://example.com/bulk1.jpg",
            genres: ["Comedy"],
            ratings: 7.5,
          },
          {
            id: 777777,
            title: "Bulk Movie 2",
            description: "Second bulk movie",
            releaseDate: "2024-03-01",
            posterUrl: "https://example.com/bulk2.jpg",
            genres: ["Horror"],
            ratings: 6.5,
          },
        ],
      };

      const response = await request(app)
        .post("/api/watchlist")
        .set("Authorization", `Bearer ${authToken}`)
        .send(bulkMoviesData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty(
        "message",
        expect.stringContaining("movies added to watchlist"),
      );
    });

    it("should return 400 for invalid movie data", async () => {
      const invalidData = {
        movies: [
          {
            id: "invalid", // Should be number
            title: "",
          },
        ],
      };

      const response = await request(app)
        .post("/api/watchlist")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Invalid request body");
    });

    it("should return 401 for unauthenticated user", async () => {
      const response = await request(app)
        .post("/api/watchlist")
        .send(testMovieData);

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /watchlist/:id", () => {
    it("should remove a movie from watchlist", async () => {
      // Add movie to watchlist first
      await prisma.watchlist.create({
        data: { userId, movieId },
      });

      const response = await request(app)
        .delete(`/api/watchlist/${movieId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify movie was removed
      const watchlist = await prisma.watchlist.findFirst({
        where: { userId, movieId },
      });
      expect(watchlist).toBeNull();
    });

    it("should return 404 when removing non-existent movie", async () => {
      const response = await request(app)
        .delete("/api/watchlist/99999")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        "message",
        "Watchlist item not found",
      );
    });

    it("should return 401 for unauthenticated user", async () => {
      const response = await request(app).delete(`/api/watchlist/${movieId}`);

      expect(response.status).toBe(401);
    });
  });
});
