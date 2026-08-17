const { AppError } = require("../utils/error");

/*
 * Centralized error-handling middleware.
 *
 * CATCHY THING:
 * "Throw errors in business code → handle them HERE."
 *
 * This prevents every controller/service from having to
 * repeat the same error-response logic.
 *
 * IMPORTANT:
 * Express identifies error middleware because it has
 * FOUR parameters:
 *
 * (err, req, res, next)
 */

const errorHandler = (err, req, res, next) => {
  /*
   * Our known application errors.
   *
   * Example:
   * throw new BadRequestError("Invalid email");
   */
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.code,
      message: err.message
    });
  }

  /*
   * Anything we didn't explicitly handle is an unexpected
   * server error.
   *
   * Don't expose internal error details to clients in
   * production.
   */
  console.error("UNHANDLED ERROR:", err);

  return res.status(500).json({
    success: false,
    error: "INTERNAL_SERVER_ERROR",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message
  });
};

module.exports = errorHandler;