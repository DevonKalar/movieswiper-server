import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapIdToGenre, mapIdsToGenres } from '@/utils/genreMapping.js';

describe('mappingGenreUtils', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('mapIdToGenre', () => {
        it('should map genre ID to genre name', () => {
            // Arrange
            const genreId = 99;
            const expectedGenreName = 'Documentary';

            // Act
            const result = mapIdToGenre(genreId);

            // Assert
            expect(result).toBe(expectedGenreName);
        });
    });

    describe('mapIdsToGenres', () => {
        it('should map multiple genre IDs to genre names', () => {
            // Arrange
            const genreIds = [28, 12, 16];
            const expectedGenreNames = ['Action', 'Adventure', 'Animation'];

            // Act
            const result = mapIdsToGenres(genreIds);

            // Assert
            expect(result).toEqual(expectedGenreNames);
        });
    });
});
