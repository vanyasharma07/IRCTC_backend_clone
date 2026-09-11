/**
 * ─── Request Logger Middleware ──────────────────────────────────────────────
 *
 * Logs every incoming HTTP request with method, path, status code,
 * and response time. Useful for debugging and performance monitoring.
 *
 * Uses Winston logger so output format matches the rest of the service.
 */

const logger = require('../config/logger');

const reqLogger = (req, res, next) => {
     logger.debug(`[${req.method}] ${req.originalUrl}`);
     const start = Date.now();

     // Log after the response is sent (so we have the final status code)
     res.on('finish', () => {
          const duration = Date.now() - start;
          logger.info(
               `[${req.method}] ${req.originalUrl} - status: ${res.statusCode} - ${duration}ms`
          );
     });

     next();
};

module.exports = {
     reqLogger,
};
