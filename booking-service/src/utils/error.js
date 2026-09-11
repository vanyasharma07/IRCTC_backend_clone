/**
 * ─── Application Error Hierarchy ────────────────────────────────────────────
 *
 * Custom error classes that map to HTTP status codes.
 * Each error carries a `statusCode` and a machine-readable `code` so the
 * error middleware can return consistent JSON responses.
 *
 * Hierarchy:
 *   AppError (base)
 *     ├── BadRequestError      (400) — validation failures, missing fields
 *     ├── UnauthorizedError    (401) — missing/invalid auth context
 *     ├── ForbiddenError       (403) — insufficient permissions
 *     ├── NotFoundError        (404) — resource doesn't exist
 *     ├── ConflictError        (409) — state conflicts (e.g., seat already booked)
 *     │   └── StaleStateError  (409) — optimistic lock conflict (CAS failure)
 *     ├── TooManyRequestsError (429) — rate limiting
 *     └── InternalServerError  (500) — unexpected server failures
 */

class AppError extends Error {
     constructor(message, statusCode, code) {
          super(message);
          this.statusCode = statusCode;
          this.code = code;
          Error.captureStackTrace(this, this.constructor);
     }
}

class BadRequestError extends AppError {
     constructor(message, code = 'BAD_REQUEST') {
          super(message, 400, code);
     }
}

class UnauthorizedError extends AppError {
     constructor(message, code = 'UNAUTHORIZED') {
          super(message, 401, code);
     }
}

class ForbiddenError extends AppError {
     constructor(message, code = 'FORBIDDEN') {
          super(message, 403, code);
     }
}

class NotFoundError extends AppError {
     constructor(message, code = 'NOT_FOUND') {
          super(message, 404, code);
     }
}

class ConflictError extends AppError {
     constructor(message, code = 'CONFLICT') {
          super(message, 409, code);
     }
}

class TooManyRequestsError extends AppError {
     constructor(message, code = 'TOO_MANY_REQUESTS') {
          super(message, 429, code);
     }
}

class InternalServerError extends AppError {
     constructor(message = 'Internal Server Error', code = 'SERVER_ERROR') {
          super(message, 500, code);
     }
}

/**
 * StaleStateError — thrown when an optimistic lock (CAS) update finds the
 * booking version has changed since our read, meaning another process
 * (payment webhook, expiry job, etc.) already modified this booking.
 */
class StaleStateError extends ConflictError {
     constructor(message = 'Booking state changed by another process', code = 'STALE_STATE') {
          super(message, code);
     }
}

module.exports = {
     AppError,
     BadRequestError,
     UnauthorizedError,
     ForbiddenError,
     NotFoundError,
     ConflictError,
     TooManyRequestsError,
     InternalServerError,
     StaleStateError,
};
