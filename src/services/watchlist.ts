import prisma from "@/lib/prisma.js";
import type { Movie } from "@/types/movie.js";
import { NotFoundError } from "@middleware/errorHandler.js";

export async function getWatchlist(userId: string) {
  return await prisma.watchlist.findMany({
    where: { userId },
    include: { movie: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function addMovieToWatchlist(userId: string, movie: Movie) {
  return await prisma.$transaction(async (tx) => {
    // upsert movie into Movies table
    const movieEntry = await tx.movies.upsert({
      where: { id: movie.id },
      update: {
        title: movie.title,
        id: movie.id,
        description: movie.description,
        releaseDate: new Date(movie.releaseDate),
        posterUrl: movie.posterUrl,
        genres: movie.genres,
        ratings: movie.ratings,
      },
      create: {
        title: movie.title,
        id: movie.id,
        description: movie.description,
        releaseDate: new Date(movie.releaseDate),
        posterUrl: movie.posterUrl,
        genres: movie.genres,
        ratings: movie.ratings,
      },
    });

    // add entry to Watchlist table
    const watchlistEntry = await tx.watchlist.create({
      data: {
        userId,
        movieId: movieEntry.id,
      },
    });

    return watchlistEntry;
  });
}

export async function addBulkMoviesToWatchlist(
  userId: string,
  movies: Movie[],
) {
  const result = await prisma.$transaction(async (tx) => {
    // Upsert each movie individually to get their IDs
    const movieEntries = await Promise.all(
      movies.map((movie) =>
        tx.movies.upsert({
          where: { id: movie.id },
          update: {
            title: movie.title,
            description: movie.description,
            releaseDate: new Date(movie.releaseDate),
            posterUrl: movie.posterUrl,
            genres: movie.genres,
            ratings: movie.ratings,
          },
          create: {
            id: movie.id,
            title: movie.title,
            description: movie.description,
            releaseDate: new Date(movie.releaseDate),
            posterUrl: movie.posterUrl,
            genres: movie.genres,
            ratings: movie.ratings,
          },
        }),
      ),
    );

    // Create watchlist entries using the movie IDs
    const watchlistEntries = await tx.watchlist.createMany({
      data: movieEntries.map((movieEntry) => ({
        userId,
        movieId: movieEntry.id,
      })),
      skipDuplicates: true,
    });

    return watchlistEntries.count;
  });

  return result;
}

export async function removeMovieFromWatchlist(
  userId: string,
  movieId: number,
) {
  const watchlistEntry = await prisma.watchlist.findFirst({
    where: {
      userId,
      movieId,
    },
  });

  if (!watchlistEntry) {
    throw new NotFoundError("Watchlist item not found");
  }

  await prisma.watchlist.delete({
    where: { id: watchlistEntry.id },
  });
}
