import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client.js';
import { config } from '@/config/env.js';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const adapter = new PrismaPg({ connectionString: config.databaseUrl });
const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (config.nodeEnvironment !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
