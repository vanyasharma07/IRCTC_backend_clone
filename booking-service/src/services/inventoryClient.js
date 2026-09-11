/**
 * ─── Inventory Service HTTP Client ──────────────────────────────────────────
 *
 * Communicates with the inventory-service to manage seat availability.
 * The inventory service is the source of truth for which seats are available,
 * held, or confirmed on any given train schedule.
 *
 * Operations:
 *   - getAvailability() — check if a schedule is active and bookable
 *   - getSeats()        — fetch seat list with availability status
 *   - holdSeats()       — temporarily reserve seats for a booking (saga step 1)
 *   - releaseSeats()    — undo a hold (compensation)
 *   - confirmSeats()    — permanently assign seats to a booking (saga step 3)
 *   - cancelBooking()   — release confirmed seats (user cancellation)
 *
 * All calls include exponential backoff retry for transient failures.
 * Client errors (4xx) are NOT retried — they indicate a business logic issue.
 */

const axios = require('axios');
const { config } = require('../config');
const logger = require('../config/logger');

const client = axios.create({
     baseURL: config.INVENTORY_SERVICE_URL,
     timeout: 10000,
     headers: {
          'Content-Type': 'application/json',
          'x-internal-service-key': config.INTERNAL_SERVICE_KEY,
     },
});

/**
 * Retry wrapper with exponential backoff.
 * Only retries server errors (5xx) and network failures — NOT client errors (4xx).
 */
async function withRetry(fn, maxRetries = 3) {
     let lastError;
     for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
               return await fn();
          } catch (error) {
               lastError = error;
               const status = error.response?.status;
               if (status && status >= 400 && status < 500) throw error; // Don't retry client errors

               if (attempt < maxRetries) {
                    const delay = 200 * Math.pow(2, attempt - 1);
                    logger.warn(`Inventory client retry ${attempt}/${maxRetries} after ${delay}ms`, {
                         error: error.message,
                    });
                    await new Promise(resolve => setTimeout(resolve, delay));
               }
          }
     }
     throw lastError;
}

/**
 * Extract a structured error object from an axios error response.
 */
function extractError(error) {
     if (error.response?.data) {
          return {
               status: error.response.status,
               message: error.response.data.message || error.message,
               code: error.response.data.error,
          };
     }
     return { status: 500, message: error.message, code: 'INVENTORY_SERVICE_ERROR' };
}

const inventoryClient = {
     /** Check if a schedule is active and get train details */
     async getAvailability(scheduleId) {
          return withRetry(async () => {
               const { data } = await client.get(`/schedules/${scheduleId}/availability`);
               return data.data;
          });
     },

     /** Fetch seats for a schedule with optional segment filtering */
     async getSeats(scheduleId, filters = {}) {
          return withRetry(async () => {
               const params = {};
               if (filters.status) params.status = filters.status;
               if (filters.seatType) params.seatType = filters.seatType;
               if (filters.fromSeq) params.fromSeq = filters.fromSeq;
               if (filters.toSeq) params.toSeq = filters.toSeq;

               const { data } = await client.get(`/schedules/${scheduleId}/seats`, { params });
               return data.data;
          });
     },

     /** Hold (temporarily reserve) seats — saga step 1 */
     async holdSeats(scheduleId, seatIds, userId, ttlSeconds, fromSeq, toSeq) {
          return withRetry(async () => {
               const { data } = await client.post('/seats/lock', {
                    scheduleId,
                    seatIds,
                    userId,
                    ttlSeconds,
                    fromSeq,
                    toSeq,
               });
               return data.data;
          });
     },

     /** Release previously held seats — compensation for holdSeats */
     async releaseSeats(scheduleId, seatIds, userId, fromSeq, toSeq) {
          return withRetry(async () => {
               const { data } = await client.post('/seats/unlock', {
                    scheduleId,
                    seatIds,
                    userId,
                    fromSeq,
                    toSeq,
               });
               return data.data;
          });
     },

     /** Confirm seats as permanently booked — saga step 3 */
     async confirmSeats(scheduleId, seatIds, userId, bookingId, fromSeq, toSeq) {
          return withRetry(async () => {
               const { data } = await client.post('/seats/confirm', {
                    scheduleId,
                    seatIds,
                    userId,
                    bookingId,
                    fromSeq,
                    toSeq,
               });
               return data.data;
          });
     },

     /** Cancel a confirmed booking — releases seats back to available */
     async cancelBooking(scheduleId, bookingId, userId) {
          return withRetry(async () => {
               const { data } = await client.post('/seats/cancel-booking', {
                    scheduleId,
                    bookingId,
                    userId,
               });
               return data.data;
          });
     },
};

module.exports = { inventoryClient, extractError };
