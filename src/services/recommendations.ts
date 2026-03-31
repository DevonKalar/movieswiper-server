import { fetchPopularMovies } from "@/clients/tmdb.js";
import { apiMoviesToMovies } from "@utils/mapTMDBtoMovie.js";
import type { Movie, TMDBMovie } from "@/types/movie.js";
import prisma from "@/lib/prisma.js";

export async function fetchGuestRecommendations(page: number) {
  const tmdbFetch = await fetchPopularMovies(page);
  const movieResults = apiMoviesToMovies(tmdbFetch.results);

  return {
    results: movieResults,
    nextPage:
      tmdbFetch.page < tmdbFetch.total_pages ? tmdbFetch.page + 1 : null,
  };
}

export async function fetchUserRecommendations(
  userId: string,
  startPage: number,
) {
  const limit = 20;

  // 1. Get user's watchlist IDs
  const watchlistIds = await prisma.watchlist
    .findMany({
      where: { userId },
      select: { movieId: true },
    })
    .then((entries) => entries.map((entry) => entry.movieId));

  const watchlistIdSet = new Set<number>(watchlistIds);

  // 2. Fetch and filter recommendations
  let tmdbResults: TMDBMovie[] = [];
  let currentPage = startPage;
  const maxPages = startPage + 10;

  while (tmdbResults.length < limit && currentPage < maxPages) {
    const movies = await fetchPopularMovies(currentPage);
    if (!movies?.results) break;
    console.log(
      `Fetched page ${currentPage} with ${movies.results.length} movies`,
    );
    const filtered = movies.results.filter(
      (movie: Movie) => !watchlistIdSet.has(movie.id),
    );
    tmdbResults.push(...filtered);
    currentPage += 1;
  }

  // 3. Transform and return
  const movieResults = apiMoviesToMovies(tmdbResults.slice(0, limit));
  console.log(`Returning ${movieResults.length} recommended movies`);
  return {
    results: movieResults,
    nextPage: movieResults.length >= limit ? currentPage : null,
  };
}
