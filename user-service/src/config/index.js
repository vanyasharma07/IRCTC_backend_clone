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
  ALLOWED_ORIGINS:
      process.env.ALLOWED_ORIGINS || "http://localhost:4000",

  OTP_TTL:
      process.env.OTP_TTL || 300,

  OTP_RATE_MAX_PER_HOUR:
      process.env.OTP_RATE_MAX_PER_HOUR || 5,

  OTP_MAX_VERIFY_ATTEMPTS:
      process.env.OTP_MAX_VERIFY_ATTEMPTS || 5,

  OTP_HMAC_SECRET:
      process.env.OTP_HMAC_SECRET ||
      "replace-this-with-your-own-secret",

  MAIL_SEND:
      process.env.MAIL_SEND || "vanya2007sharma@gmail.com"
};

module.exports = { config };