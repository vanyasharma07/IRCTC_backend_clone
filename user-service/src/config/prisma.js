const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;

const globalForPrisma = global;

// Reuse the Prisma client during development
if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg({ connectionString });

    globalForPrisma.prisma = new PrismaClient({
        adapter,
        log: ['error', 'warn'],
    });
}

module.exports = globalForPrisma.prisma;