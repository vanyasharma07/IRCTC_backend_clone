/**
 * ─── Prisma Client (Singleton) ──────────────────────────────────────────────
 *
 * Uses the @prisma/adapter-pg driver adapter for connection pooling via `pg`.
 * The client is cached on `globalThis` to avoid creating multiple connections
 * during hot-reloads in development (nodemon restarts).
 *
 * Why adapter-pg?
 *   Prisma's native query engine is replaced with the Node.js `pg` driver,
 *   giving us access to pg-level connection tuning and compatibility with
 *   environments that don't support Prisma's binary engine (e.g., Alpine).
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { config } = require('./');

const connectionString = config.DATABASE_URL;
const globalForPrisma = global;

if (!globalForPrisma.prisma) {
     const adapter = new PrismaPg({ connectionString });

     globalForPrisma.prisma = new PrismaClient({
          adapter,
          log: ['error', 'warn'],
     });
}

const prisma = globalForPrisma.prisma;

module.exports = prisma;
