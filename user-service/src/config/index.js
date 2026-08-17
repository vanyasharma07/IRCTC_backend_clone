// Load environment variables from .env into process.env
require("dotenv").config();

/*
 * Central configuration object.
 *
 * CATCHY THING TO REMEMBER:
 * "Environment → Config → Application"
 *
 * The rest of the application should read configuration
 * from `config`, rather than directly accessing process.env
 * everywhere.
 */

const config = {
  // package.json name becomes the service name automatically.
  SERVICE_NAME: require("../../package.json").name,

  // Convert PORT from string → number.
  PORT: Number(process.env.PORT) || 4001,

  NODE_ENV: process.env.NODE_ENV || "development",

  LOG_LEVEL: process.env.LOG_LEVEL || "info",

  // Used later when Prisma connects to PostgreSQL.
  DATABASE_URL: process.env.DATABASE_URL,

  // Used later for Redis.
  REDIS_URL:
    process.env.REDIS_URL || "redis://:irctcpass@redis:6379",

  // Multiple origins are stored as a comma-separated string
  // in .env and converted into an array by the CORS middleware.
  ALLOWED_ORIGINS:
    process.env.ALLOWED_ORIGINS || "http://localhost:4000"
};

module.exports = { config };