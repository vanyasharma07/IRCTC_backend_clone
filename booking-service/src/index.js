/**
 * ─── Booking Service Entry Point ────────────────────────────────────────────
 *
 * Bootstraps the Express server, connects to Kafka, and starts the
 * background booking expiry job. This is the main entry point for
 * the booking microservice.
 *
 * Startup sequence:
 *   1. Load environment variables (dotenv)
 *   2. Configure Express middleware (CORS, Helmet, logging, etc.)
 *   3. Mount API routes
 *   4. Start Kafka consumer (listens for payment/schedule events)
 *   5. Start booking expiry background job
 *   6. Listen on configured port
 *
 * Graceful shutdown:
 *   On SIGTERM/SIGINT, the service:
 *   - Stops the expiry job
 *   - Closes the HTTP server (stops accepting new requests)
 *   - Disconnects from Kafka (producer + consumer)
 *   - Closes Redis connection
 *   - Exits cleanly
 */

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const logger = require('./config/logger');
const { config } = require('./config');
const cookieParser = require('cookie-parser');

const { corsMiddleware } = require('./middlewares/cors.middleware');
const errorHandler = require('./middlewares/error.middleware');
const { reqLogger } = require('./middlewares/req.middleware');
const { disconnectAll } = require('./config/kafka');
const { RedisClient } = require('./config/redis');

const prisma = require('./config/prisma');
const bookingRoutes = require('./routes/booking.route');
const bookingConsumer = require('./kafka/consumer/booking.consumer');
const { startBookingExpiryJob, stopBookingExpiryJob } = require('./utils/bookingExpiry');

const app = express();

// ─── Middleware Stack ────────────────────────────────────────────────────────
app.use(corsMiddleware);
app.use(helmet({
     crossOriginOpenerPolicy: false,
     crossOriginEmbedderPolicy: false,
}));
app.use(reqLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Root Endpoint ──────────────────────────────────────────────────────────
app.get('/', (req, res) => {
     res.send('Hello from booking-service');
});

// ─── Health Check ───────────────────────────────────────────────────────────
// Reports the health of both PostgreSQL and Redis connections.
// Returns 503 if either dependency is unreachable.
app.get('/health', async (req, res) => {
     let dbHealthy = false;
     try {
          await prisma.$queryRaw`SELECT 1`;
          dbHealthy = true;
     } catch (e) {
          logger.error('Health check: DB unreachable', { error: e.message });
     }

     const redisHealthy = RedisClient.isReady();
     const healthy = dbHealthy && redisHealthy;

     res.status(healthy ? 200 : 503).json({
          success: healthy,
          message: healthy ? 'Booking Service is healthy' : 'Booking Service is degraded',
          redis: redisHealthy,
          database: dbHealthy,
          timestamp: new Date().toISOString(),
     });
});

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use(bookingRoutes);

// ─── Error Handler (must be last middleware) ─────────────────────────────────
app.use(errorHandler);

// ─── Server Startup ─────────────────────────────────────────────────────────
const startServer = async () => {
     try {
          // Start Kafka consumer (payment events + schedule cancellation)
          await bookingConsumer.start();

          // Start background job that cleans up expired bookings
          startBookingExpiryJob();

          const server = app.listen(config.PORT, () => {
               logger.info(
                    `${config.SERVICE_NAME} is running on port ${config.PORT}`
               );
          });

          // ─── Graceful Shutdown ─────────────────────────────────────────────
          const shutdown = async () => {
               logger.info('Shutting down gracefully...');
               stopBookingExpiryJob();

               server.close(async () => {
                    await disconnectAll();
                    await RedisClient.closeConnection();
                    logger.info('Server closed');
                    process.exit(0);
               });
          };

          process.on('SIGTERM', shutdown);
          process.on('SIGINT', shutdown);

     } catch (error) {
          logger.error('Failed to start server', error);
          process.exit(1);
     }
};

startServer();

module.exports = app;
