import { config } from './config/env.js';
import app from './app.js';

// Validate required environment variables
const JWT_SECRET = config.jwtSecret;
if (!JWT_SECRET) {
    console.error('Error: JWT_SECRET is not defined in environment variables.');
    process.exit(1);
}

const DATABASE_URL = config.databaseUrl;
if (!DATABASE_URL) {
    console.error('Error: DATABASE_URL is not defined in environment variables.');
    process.exit(1);
}

const PORT = config.port;

// Start the server
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${config.nodeEnvironment}`);
});

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    server.close(() => {
        console.log('HTTP server closed.');
        console.log('Graceful shutdown completed.');
        process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});
