import { defineConfig } from 'tsup';
import { resolve } from 'path';

export default defineConfig({
    entry: ['src/server.ts', 'src/jobs/syncPopularMovies/run.ts'],
    format: ['esm'],
    splitting: false,
    sourcemap: true,
    clean: true,
    esbuildOptions(options) {
        options.alias = {
            '@': resolve(__dirname, 'src'),
            '@tests': resolve(__dirname, 'tests'),
            '@prisma/client': resolve(__dirname, 'node_modules/.prisma/client/index.d.ts'),
            '@types': resolve(__dirname, 'src/types'),
            '@routes': resolve(__dirname, 'src/routes'),
            '@services': resolve(__dirname, 'src/services'),
            '@middleware': resolve(__dirname, 'src/middleware'),
            '@utils': resolve(__dirname, 'src/utils'),
            '@clients': resolve(__dirname, 'src/clients'),
        };
    },
});
