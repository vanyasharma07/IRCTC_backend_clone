/**
 * ─── CORS Middleware ────────────────────────────────────────────────────────
 *
 * Restricts cross-origin requests to a whitelist of allowed origins
 * defined in the ALLOWED_ORIGINS env var (comma-separated).
 *
 * Non-browser requests (no Origin header) are allowed through — these are
 * typically inter-service calls or API gateway proxied requests.
 */

const cors = require('cors');
const { config } = require('../config');

const allowedOrigins = config.ALLOWED_ORIGINS
     ? config.ALLOWED_ORIGINS.split(',').map(o => o.trim())
     : [];

const corsMiddleware = cors({
     origin: function (origin, callback) {
          // Allow requests with no origin (inter-service, curl, Postman, etc.)
          if (!origin) return callback(null, true);

          if (allowedOrigins.includes(origin)) {
               callback(null, true);
          } else {
               callback(new Error('Not allowed by CORS'));
          }
     },
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization'],
});

module.exports = { corsMiddleware };
