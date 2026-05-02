import { beforeAll, afterAll, afterEach } from 'vitest';
import { server } from '../mocks/server.js';

/**
 * Sets up MSW (Mock Service Worker) for tests that need to mock external API calls.
 * Call this function at the top of your test suite (within a describe block).
 *
 * @example
 * ```typescript
 * import { setupMSW } from '@tests/utils/setupMSW.js';
 *
 * describe('tmdbClient', () => {
 *   setupMSW();
 *
 *   it('should fetch movie details', async () => {
 *     // MSW will intercept external API calls
 *   });
 * });
 * ```
 */
export function setupMSW() {
    beforeAll(() => {
        server.listen({ onUnhandledRequest: 'error' });
    });

    afterEach(() => {
        server.resetHandlers();
    });

    afterAll(() => {
        server.close();
    });
}
