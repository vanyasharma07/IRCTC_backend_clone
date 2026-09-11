/**
 * ─── Winston Logger ─────────────────────────────────────────────────────────
 *
 * Structured logger with service-name tagging.
 * Format: [timestamp] [level] [service-name]: message
 *
 * Log level is controlled via LOG_LEVEL env var (defaults to 'info').
 */

const winston = require('winston');
const { config } = require('.');

const logger = winston.createLogger({
     level: config.LOG_LEVEL,
     defaultMeta: { service: config.SERVICE_NAME },
     format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.printf(({ level, message, timestamp, service }) => {
               return `[${timestamp}] [${level}] [${service}]: ${message}`;
          })
     ),
     transports: [new winston.transports.Console()],
});

module.exports = logger;
