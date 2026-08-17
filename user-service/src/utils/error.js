/*
 * Base application error.
 *
 * Instead of throwing generic Error objects everywhere,
 * we create errors that also carry:
 *
 * - HTTP status code
 * - application-specific error code
 * - human-readable message
 */

class AppError extends Error {
    constructor(message, statusCode, code) {
      super(message);
  
      this.statusCode = statusCode;
      this.code = code;
  
      // Keeps the stack trace clean and useful.
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /*
   * 400 - Bad Request
   *
   * Used when the client sends invalid input.
   */
  class BadRequestError extends AppError {
    constructor(message, code = "BAD_REQUEST") {
      super(message, 400, code);
    }
  }
  
  /*
   * 401 - Unauthorized
   *
   * Means authentication is missing/invalid.
   */
  class UnauthorizedError extends AppError {
    constructor(message, code = "UNAUTHORIZED") {
      super(message, 401, code);
    }
  }
  
  /*
   * 403 - Forbidden
   *
   * User is authenticated but doesn't have permission.
   */
  class ForbiddenError extends AppError {
    constructor(message, code = "FORBIDDEN") {
      super(message, 403, code);
    }
  }
  
  /*
   * 404 - Not Found
   *
   * Requested resource doesn't exist.
   */
  class NotFoundError extends AppError {
    constructor(message, code = "NOT_FOUND") {
      super(message, 404, code);
    }
  }
  
  /*
   * 409 - Conflict
   *
   * Useful later for things like:
   * "Email already registered"
   */
  class ConflictError extends AppError {
    constructor(message, code = "CONFLICT") {
      super(message, 409, code);
    }
  }
  
  /*
   * 500 - Internal Server Error
   *
   * Represents an unexpected server-side failure.
   */
  class InternalServerError extends AppError {
    constructor(message, code = "INTERNAL_SERVER_ERROR") {
      super(message, 500, code);
    }
  }
  
  module.exports = {
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    InternalServerError
  };