const logger = require("../config/logger");

/*
 * Request logging middleware.
 *
 * It logs:
 * 1. When a request arrives.
 * 2. HTTP method + URL.
 * 3. Response status.
 * 4. How long the request took.
 *
 * Think:
 *
 * REQUEST
 *   ↓
 * start timer
 *   ↓
 * route/controller
 *   ↓
 * response finishes
 *   ↓
 * log duration + status
 */

const reqLogger = (req, res, next) => {
  logger.debug(`[${req.method}] ${req.originalUrl}`);

  const start = Date.now();

  /*
   * `finish` fires when the response has been sent.
   *
   * This is why we don't calculate duration immediately.
   * We need to wait until the request actually completes.
   */
  res.on("finish", () => {
    const duration = Date.now() - start;

    logger.info(
      `[${req.method}] ${req.originalUrl} - status: ${res.statusCode} - ${duration}ms`
    );
  });

  // VERY IMPORTANT:
  // Without next(), the request would stop here.
  next();
};

module.exports = { reqLogger };