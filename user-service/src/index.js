const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");

const { config } = require("./config");
const logger = require("./config/logger");

const { corsMiddleware } = require("./middlewares/cors.middleware");
const errorHandler = require("./middlewares/error.middleware");
const { reqLogger } = require("./middlewares/req.middleware");

/*
 * =========================================================
 * APPLICATION SETUP
 * =========================================================
 *
 * This file is the ENTRY POINT of user-service.
 *
 * Think of it as:
 *
 * CONFIG
 *   ↓
 * EXPRESS APP
 *   ↓
 * SECURITY MIDDLEWARE
 *   ↓
 * REQUEST MIDDLEWARE
 *   ↓
 * ROUTES
 *   ↓
 * ERROR HANDLER
 *   ↓
 * SERVER
 */

const app = express();

/*
 * ---------------------------------------------------------
 * GLOBAL MIDDLEWARE
 * ---------------------------------------------------------
 */

// Adds security-related HTTP headers.
app.use(helmet());

// Enables configured cross-origin requests.
app.use(corsMiddleware);

// Logs every incoming request and its duration.
app.use(reqLogger);

// Parses cookies from incoming requests.
app.use(cookieParser());

// Parses JSON request bodies.
app.use(express.json());

/*
 * ---------------------------------------------------------
 * BASIC ROUTES
 * ---------------------------------------------------------
 */

// Simple root route to confirm the service is alive.
app.get("/", (req, res) => {
  res.send("Hello from index.js of user-service");
});

/*
 * Health-check endpoint.
 *
 * This is extremely common in production systems.
 *
 * Load balancers, Docker, Kubernetes, monitoring systems,
 * etc. can use this endpoint to determine whether the
 * service is alive.
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    message: "ok"
  });
});

/*
 * ---------------------------------------------------------
 * ERROR HANDLER
 * ---------------------------------------------------------
 *
 * Keep this AFTER routes.
 *
 * Errors generated above flow down into this middleware.
 */
app.use(errorHandler);

/*
 * ---------------------------------------------------------
 * SERVER STARTUP
 * ---------------------------------------------------------
 */

const startServer = async () => {
  try {
    const server = app.listen(config.PORT, () => {
      logger.info(
        `${config.SERVICE_NAME} is running on http://localhost:${config.PORT}`
      );
    });

    /*
     * Graceful shutdown.
     *
     * When the process receives SIGTERM/SIGINT, stop accepting
     * new requests and allow existing requests to finish.
     *
     * This becomes important when Docker/Kubernetes restarts
     * or scales the service.
     */
    const shutdown = (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      server.close(() => {
        logger.info("HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error("Failed to Start Server", error);
    process.exit(1);
  }
};

startServer();