/**
 * ─── Centralized Configuration ──────────────────────────────────────────────
 *
 * Single source of truth for all environment variables used by the booking service.
 * Every config value is read here and exported as a plain object so the rest of the
 * codebase never touches `process.env` directly.
 *
 * Defaults are provided for development; production values come from `.env` or
 * container environment.
 */

const config = {
     // ─── Server ─────────────────────────────────────────────────────────────
     PORT: Number(process.env.PORT) || 4005,
     SERVICE_NAME: require('../../package.json').name,
     NODE_ENV: process.env.NODE_ENV || 'development',
     LOG_LEVEL: process.env.LOG_LEVEL || 'info',

     // ─── Infrastructure ─────────────────────────────────────────────────────
     KAFKA_BROKER: process.env.KAFKA_BROKER,
     KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'booking-service',
     DATABASE_URL: process.env.DATABASE_URL,
     ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
     REDIS_URL: process.env.REDIS_URL,

     // ─── Inter-service communication ────────────────────────────────────────
     // Each microservice is reached via its own base URL.
     // The internal service key authenticates server-to-server calls.
     INVENTORY_SERVICE_URL: process.env.INVENTORY_SERVICE_URL || 'http://localhost:4007',
     PAYMENT_SERVICE_URL: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4006',
     USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://localhost:4001',
     ADMIN_SERVICE_URL: process.env.ADMIN_SERVICE_URL || 'http://localhost:4003',
     INTERNAL_SERVICE_KEY: process.env.INTERNAL_SERVICE_KEY,

     // ─── Booking Lifecycle Tuning ───────────────────────────────────────────
     // BOOKING_TTL_SECONDS:  how long a booking can sit in PENDING/SEATS_HELD
     //                       before the expiry job marks it EXPIRED.
     // LOCK_TTL_SECONDS:     Redis distributed lock TTL for seat reservations.
     // BOOKING_EXPIRY_CHECK_INTERVAL_MS: polling interval for the background
     //                       expiry job that cleans up stale bookings.
     BOOKING_TTL_SECONDS: parseInt(process.env.BOOKING_TTL_SECONDS || '600', 10),
     LOCK_TTL_SECONDS: parseInt(process.env.LOCK_TTL_SECONDS || '600', 10),
     BOOKING_EXPIRY_CHECK_INTERVAL_MS: parseInt(process.env.BOOKING_EXPIRY_CHECK_INTERVAL_MS || '30000', 10),
}

module.exports = { config };
