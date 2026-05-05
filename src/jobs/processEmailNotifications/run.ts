import { processEmailNotifications } from './job.js';
import prisma from '@/lib/prisma.js';

processEmailNotifications()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('processEmailNotifications job failed:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
