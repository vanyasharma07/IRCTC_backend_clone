/**
 * ─── Global Error Handler ───────────────────────────────────────────────────
 *
 * Express error-handling middleware (must have 4 params: err, req, res, next).
 *
 * Known AppError subclasses → structured JSON with proper HTTP status code.
 * Unknown errors → 500 with generic message (stack traces only in non-production).
 */

const { AppError } = require('../utils/error');
const { config } = require('../config');
const logger = require('../config/logger');

module.exports = (err, req, res, next) => {
     // Handle known application errors with their specific status codes
     if (err instanceof AppError) {
          return res.status(err.statusCode).json({
               success: false,
               error: err.code,
               message: err.message,
          });
     }

     // Unexpected errors — log full details in non-production for debugging
     console.error('UNHANDLED ERROR:', err);

     if (config.NODE_ENV !== 'production') {
          logger.error({
               message: err.message,
               stack: err.stack,
               path: req.path,
               method: req.method,
               body: req.body,
               query: req.query,
          });
     }

     return res.status(500).json({
          success: false,
          error: 'SERVER_ERROR',
          message: 'Internal Server Error',
     });
};
