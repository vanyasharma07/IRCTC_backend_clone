const cors = require("cors");
const { config } = require("../config");

/*
 * CORS = Cross-Origin Resource Sharing
 *
 * It controls which frontend/origin is allowed to communicate
 * with this backend service from a browser.
 *
 * ALLOWED_ORIGINS comes from .env:
 *
 * http://localhost:4000,http://localhost:4001
 *
 * We convert that string into:
 *
 * [
 *   "http://localhost:4000",
 *   "http://localhost:4001"
 * ]
 */

const corsMiddleware = cors({
  origin: config.ALLOWED_ORIGINS.split(","),

  // Required when cookies/authentication credentials
  // need to travel between frontend and backend.
  credentials: true,

  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization"
  ]
});

module.exports = { corsMiddleware };