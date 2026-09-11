/**
 * ─── User Service HTTP Client ───────────────────────────────────────────────
 *
 * Communicates with the user-service to fetch user details.
 * Used primarily for notification enrichment — adding user's email and
 * first name to booking event payloads so downstream services (e.g.,
 * notification-service) can send personalized emails.
 *
 * This client calls the internal endpoint (not the public API),
 * authenticated via x-internal-service-key header.
 */

const axios = require('axios');
const { config } = require('../config');
const logger = require('../config/logger');

const client = axios.create({
     baseURL: config.USER_SERVICE_URL,
     timeout: 5000,
     headers: {
          'Content-Type': 'application/json',
          'x-internal-service-key': config.INTERNAL_SERVICE_KEY,
     },
});

/** Retry with exponential backoff — skips retries for client errors (4xx) */
async function withRetry(fn, maxRetries = 3) {
     let lastError;
     for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
               return await fn();
          } catch (error) {
               lastError = error;
               const status = error.response?.status;
               if (status && status >= 400 && status < 500) throw error;

               if (attempt < maxRetries) {
                    const delay = 200 * Math.pow(2, attempt - 1);
                    logger.warn(`User client retry ${attempt}/${maxRetries} after ${delay}ms`, {
                         error: error.message,
                    });
                    await new Promise(resolve => setTimeout(resolve, delay));
               }
          }
     }
     throw lastError;
}

const userClient = {
     /** Fetch user profile by ID (internal endpoint) */
     async getUserById(userId) {
          return withRetry(async () => {
               const { data } = await client.get(`/user/internal/${userId}`);
               return data.data;
          });
     },
};

module.exports = { userClient };
