const Redis = require("ioredis");
const { config } = require(".");
const logger = require("./logger");

/*
 * =========================================================
 * REDIS SINGLETON
 * =========================================================
 *
 * Redis will be used throughout this project for things like:
 *
 * - OTP storage
 * - caching
 * - session/token related data
 * - distributed locks
 * - idempotency
 *
 * IMPORTANT:
 *
 * We DON'T want every service/file to create its own Redis
 * connection.
 *
 * Instead:
 *
 *              RedisClient
 *                  |
 *             getInstance()
 *                  |
 *          ┌───────┴───────┐
 *          │               │
 *      Controller       Service
 *          │               │
 *          └───────┬───────┘
 *                  │
 *             SAME CLIENT
 *
 * This is the Singleton Design Pattern.
 */

class RedisClient {
  /*
   * Static properties belong to the CLASS rather than
   * individual objects.
   *
   * `instance` stores our one and only Redis client.
   */
  static instance = null;

  /*
   * Keeps track of whether Redis is currently connected.
   */
  static isConnected = false;

  /*
   * Constructor is intentionally empty.
   *
   * We don't want other parts of the application doing:
   *
   *     new RedisClient()
   *
   * Redis creation should happen through getInstance().
   */
  constructor() {
    // Prevent direct instantiation.
  }

  /*
   * =======================================================
   * GET INSTANCE
   * =======================================================
   *
   * This is the heart of the Singleton pattern.
   *
   * First call:
   *
   *     instance doesn't exist
   *             ↓
   *     create Redis client
   *
   * Every later call:
   *
   *     instance already exists
   *             ↓
   *     return the same client
   */
  static getInstance() {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis(config.REDIS_URL, {
        /*
         * Retry connection using an increasing delay.
         *
         * times = number of retry attempts
         *
         * Example:
         *
         * attempt 1 → 50ms
         * attempt 2 → 100ms
         * attempt 3 → 150ms
         * ...
         *
         * Math.min() prevents the delay from becoming
         * ridiculously large.
         *
         * Maximum delay = 2000ms.
         */
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);

          logger.warn(
            `Redis connection retry #${times} in ${delay}ms`
          );

          return delay;
        },

        /*
         * Don't retry one individual Redis command forever.
         *
         * After 3 retries for a command, ioredis will stop
         * retrying that command.
         */
        maxRetriesPerRequest: 3,

        /*
         * Keep reconnecting when the connection itself drops.
         */
        reconnectOnError: () => true
      });

      /*
       * Attach all Redis lifecycle event listeners once,
       * immediately after creating the client.
       */
      RedisClient.setupEventListeners();
    }

    return RedisClient.instance;
  }

  /*
   * =======================================================
   * EVENT LISTENERS
   * =======================================================
   *
   * Redis emits events such as:
   *
   * connect
   * ready
   * error
   * close
   * reconnecting
   *
   * Listening to them makes debugging production systems
   * much easier.
   */
  static setupEventListeners() {
    const redis = RedisClient.instance;

    redis.on("connect", () => {
      logger.info("Redis connection established");
    });

    redis.on("ready", () => {
      RedisClient.isConnected = true;

      logger.info("Redis client is ready");
    });

    redis.on("error", (error) => {
      /*
       * An error doesn't necessarily mean the application
       * has permanently lost Redis.
       *
       * ioredis may reconnect automatically.
       */
      RedisClient.isConnected = false;

      logger.error(`Redis error: ${error.message}`);
    });

    redis.on("close", () => {
      RedisClient.isConnected = false;

      logger.warn("Redis connection closed");
    });

    redis.on("reconnecting", () => {
      logger.warn("Reconnecting to Redis...");
    });

    redis.on("end", () => {
      RedisClient.isConnected = false;

      logger.warn("Redis connection ended");
    });
  }

  /*
   * =======================================================
   * CONNECT
   * =======================================================
   *
   * ioredis normally starts connecting as soon as the client
   * is created.
   *
   * This method gives the application a clean way to explicitly
   * initialize Redis during server startup.
   */
  static async connect() {
    const redis = RedisClient.getInstance();

    /*
     * If Redis is already ready, there is nothing to do.
     */
    if (RedisClient.isConnected || redis.status === "ready") {
      RedisClient.isConnected = true;
      return redis;
    }

    /*
     * Wait until Redis becomes ready.
     *
     * `ready` means authentication/connection setup has
     * completed and the client can accept commands.
     */
    if (redis.status !== "ready") {
      await new Promise((resolve, reject) => {
        const onReady = () => {
          cleanup();
          resolve();
        };

        const onError = (error) => {
          cleanup();
          reject(error);
        };

        const cleanup = () => {
          redis.off("ready", onReady);
          redis.off("error", onError);
        };

        redis.once("ready", onReady);
        redis.once("error", onError);
      });
    }

    RedisClient.isConnected = true;

    return redis;
  }

  /*
   * =======================================================
   * DISCONNECT
   * =======================================================
   *
   * Used during graceful application shutdown.
   */
  static async disconnect() {
    if (!RedisClient.instance) {
      return;
    }

    try {
      await RedisClient.instance.quit();
      RedisClient.isConnected = false;

      logger.info("Redis connection closed gracefully");
    } catch (error) {
      logger.error(
        `Failed to close Redis connection: ${error.message}`
      );

      RedisClient.instance.disconnect();
      RedisClient.isConnected = false;
    }
  }
}

/*
 * Export the class itself.
 *
 * Other files can do:
 *
 *     const RedisClient = require("./config/redis");
 *
 * and then:
 *
 *     const redis = RedisClient.getInstance();
 */
module.exports = RedisClient;