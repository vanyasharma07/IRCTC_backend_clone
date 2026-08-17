/*
 * Utility for handling errors thrown by async functions.
 *
 * Without this:
 *
 * async (req, res) => {
 *   throw new Error("Something went wrong");
 * }
 *
 * can require explicit try/catch handling.
 *
 * With asyncHandler, rejected promises are forwarded
 * to Express's error middleware.
 */

const asyncHandler = (handler) => {
    return (req, res, next) => {
      Promise.resolve(handler(req, res, next)).catch(next);
    };
  };
  
  module.exports = asyncHandler;