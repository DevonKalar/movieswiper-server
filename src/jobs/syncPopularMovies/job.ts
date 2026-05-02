import { fetchPopularMovies } from '@clients/tmdb.js';
import { apiMoviesToMovies } from '@utils/mapTMDBtoMovie.js';
import prisma from '@/lib/prisma.js';
import type { Movie } from '@/types/movie.js';

const SEQUENTIAL_PAGES = 10;
const RANDOM_PAGES_RECENT = 6; // from recent 50% of total pages
const RANDOM_PAGES_OLDER = 4; // from older 50% of total pages
const MIN_JITTER_MS = 8_000;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function jitter(): Promise<void> {
    await sleep(MIN_JITTER_MS + Math.random() * 4_000);
}

function pickUniquePages(min: number, max: number, count: number, exclude: Set<number>): number[] {
    const pages = new Set<number>();
    const range = max - min + 1;
    if (range - exclude.size < count) {
        throw new Error(
            `Cannot pick ${count} unique pages from range [${min}, ${max}] with ${exclude.size} exclusions`,
        );
    }
    while (pages.size < count) {
        const page = Math.floor(Math.random() * range) + min;
        if (!exclude.has(page)) {
            pages.add(page);
        }
    }
    return Array.from(pages);
}

async function upsertMovies(movies: Movie[]): Promise<void> {
    await Promise.all(
        movies.map((movie) =>
            prisma.movies.upsert({
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
}

async function fetchAndUpsertPage(page: number): Promise<void> {
    const response = await fetchPopularMovies(page);
    const movies = apiMoviesToMovies(response?.results ?? []);
    await upsertMovies(movies);
}

export async function syncPopularMovies(): Promise<void> {
    const fetchedPages = new Set<number>();

    // Page 1 — also provides total_pages for randomisation
    const firstResponse = await fetchPopularMovies(1);
    const totalPages: number = firstResponse?.total_pages ?? 38_029; // The current total number of pages in the TMDB API as of 2026-04-10
    const firstMovies = apiMoviesToMovies(firstResponse?.results ?? []);
    await upsertMovies(firstMovies);
    fetchedPages.add(1);

    // Pages 2–10 sequentially with jitter between each call
    for (let page = 2; page <= SEQUENTIAL_PAGES; page++) {
        await jitter();
        await fetchAndUpsertPage(page);
        fetchedPages.add(page);
    }

    // Randomised pages: 6 from recent 50%, 4 from the older half
    const midPage = Math.floor(totalPages / 2);
    const recentPages = pickUniquePages(1, midPage, RANDOM_PAGES_RECENT, fetchedPages);
    const olderPages = pickUniquePages(midPage + 1, totalPages, RANDOM_PAGES_OLDER, fetchedPages);

    for (const page of [...recentPages, ...olderPages]) {
        await jitter();
        await fetchAndUpsertPage(page);
        fetchedPages.add(page);
    }

    console.log(
        `syncPopularMovies complete — fetched ${fetchedPages.size} pages across ${totalPages} total TMDB pages`,
    );
}
