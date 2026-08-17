const winston = require("winston");
const { config } = require("./index");

/*
 * Centralized application logger.
 *
 * Instead of using console.log() everywhere:
 *
 *     console.log("User created")
 *
 * we use:
 *
 *     logger.info("User created")
 *
 * This becomes extremely useful once multiple microservices
 * are running and we need to identify which service produced
 * a particular log.
 */

const logger = winston.createLogger({
  level: config.LOG_LEVEL,

  // Metadata automatically attached to every log.
  defaultMeta: {
    service: config.SERVICE_NAME
  },

  /*
   * Format:
   *
   * timestamp → log level → service → message
   *
   * Example:
   * [2026-08-18T...] [info] [user-service]: Server started
   */
  format: winston.format.combine(
    winston.format.timestamp(),

    winston.format.printf(({ level, message, timestamp, service }) => {
      return `[${timestamp}] [${level}] [${service}]: ${message}`;
    })
  ),

  // For now logs go to the terminal.
  transports: [new winston.transports.Console()]
});

module.exports = logger;