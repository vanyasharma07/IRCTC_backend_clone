/**
 * ─── Async Handler ──────────────────────────────────────────────────────────
 *
 * Wraps async Express route handlers to automatically catch rejected promises
 * and forward them to the Express error-handling middleware.
 *
 * Without this, every async controller would need its own try/catch block.
 *
 * Usage:
 *   const asyncHandler = require('../utils/asyncHandler');
 *   router.get('/bookings', asyncHandler(async (req, res) => { ... }));
 */
module.exports = fn => (req, res, next) => {
     Promise.resolve(fn(req, res, next)).catch(next);
};
