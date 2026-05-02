import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@tests': path.resolve(__dirname, './tests'),
            '@types': path.resolve(__dirname, './src/types'),
            '@models': path.resolve(__dirname, './src/models'),
            '@routes': path.resolve(__dirname, './src/routes'),
            '@services': path.resolve(__dirname, './src/services'),
            '@clients': path.resolve(__dirname, './src/clients'),
            '@controllers': path.resolve(__dirname, './src/controllers'),
            '@middleware': path.resolve(__dirname, './src/middleware'),
            '@utils': path.resolve(__dirname, './src/utils'),
        },
    },
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./tests/setupTests.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
        },
    },
});
