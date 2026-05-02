import { syncPopularMovies } from './job.js';
import prisma from '@/lib/prisma.js';

syncPopularMovies()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('syncPopularMovies job failed:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
