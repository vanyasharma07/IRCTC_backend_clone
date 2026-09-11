/**
 * ─── User Context Middleware ────────────────────────────────────────────────
 *
 * Extracts the authenticated user's ID from the `x-user-id` header.
 *
 * In a microservice architecture, the API gateway authenticates the user
 * (JWT verification, session validation, etc.) and forwards the user ID
 * as a trusted header to downstream services. This middleware reads that
 * header and attaches it to `req.user`.
 *
 * Requests without this header are rejected — they must come through the gateway.
 */

const { UnauthorizedError } = require('../utils/error');

function getUserContext(req, res, next) {
     const userId = req.headers['x-user-id'];

     if (!userId) {
          return next(
               new UnauthorizedError('User context missing - must come through gateway')
          );
     }

     req.user = { id: userId };
     next();
}

module.exports = { getUserContext };
