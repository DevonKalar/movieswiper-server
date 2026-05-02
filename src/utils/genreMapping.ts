// TMDB genre ID to name mapping
export const GENRE_MAP: Record<number, string> = {
    28: 'Action',
    12: 'Adventure',
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    18: 'Drama',
    10751: 'Family',
    14: 'Fantasy',
    36: 'History',
    27: 'Horror',
    10402: 'Music',
    9648: 'Mystery',
    10749: 'Romance',
    878: 'Science Fiction',
    10770: 'TV Movie',
    53: 'Thriller',
    10752: 'War',
    37: 'Western',
};

/**
 * Maps a TMDB genre ID to its name
 * @param genreId - The TMDB genre ID
 * @returns The genre name or undefined if not found
 */

export function mapIdToGenre(genreId: number): string | undefined {
    return GENRE_MAP[genreId];
}

/**
 * Maps multiple TMDB genre IDs to their names
 * @param genreIds - Array of TMDB genre IDs
 * @returns Array of genre names (filters out undefined)
 */

export function mapIdsToGenres(genreIds: number[]): string[] {
    return genreIds.map((id) => GENRE_MAP[id]).filter((name): name is string => name !== undefined);
}

/**
 * Maps a genre name to its TMDB ID (case-insensitive)
 * @param genreName - The genre name
 * @returns The TMDB genre ID or undefined if not found
 */

export function mapGenreToId(genreName: string): number | undefined {
    const lowerName = genreName.toLowerCase();
    for (const [id, name] of Object.entries(GENRE_MAP)) {
        if (name.toLowerCase() === lowerName) {
            return parseInt(id, 10);
        }
    }
    return undefined;
}

/**
 * Maps multiple genre names to their TMDB IDs (case-insensitive)
 * @param genreNames - Array of genre names
 * @returns Array of TMDB genre IDs (filters out undefined)
 */

export function mapGenresToIds(genreNames: string[]): number[] {
    return genreNames
        .map((name) => mapGenreToId(name))
        .filter((id): id is number => id !== undefined);
}

/**
 * Maps multiple genre names to a comma-separated string of IDs
 * @param genreNames - Array of genre names
 * @returns Comma-separated string of TMDB genre IDs
 */

export function mapGenresToIdString(genreNames: string[]): string {
    return mapGenresToIds(genreNames).join(',');
}
