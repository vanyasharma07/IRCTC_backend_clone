/**
 * ─── Redis Client (Singleton) ───────────────────────────────────────────────
 *
 * Redis is used by the booking service for two critical purposes:
 *   1. Distributed seat locks — prevents double-booking across replicas
 *   2. Leader election    — ensures only one replica runs the expiry job
 *
 * The client uses ioredis with automatic reconnection and retry logic.
 * Connection health is tracked via event listeners so the /health endpoint
 * can report accurate Redis status.
 */

const Redis = require('ioredis');
const { config } = require('.');
const logger = require('./logger');

class RedisClient {
     static instance;
     static isConnected = false;

     constructor() {
          // Prevent direct instantiation — use RedisClient.getInstance()
     }

     /**
      * Returns the singleton Redis connection, creating it on first call.
      * Retry strategy uses exponential backoff capped at 2 seconds.
      */
     static getInstance() {
          if (!RedisClient.instance) {
               RedisClient.instance = new Redis(config.REDIS_URL, {
                    retryStrategy: (times) => {
                         const delay = Math.min(times * 50, 2000);
                         return delay;
                    },
                    maxRetriesPerRequest: 3,
               });

               RedisClient.setupEventListeners();
          }
          return RedisClient.instance;
     }

     /** Attach lifecycle event listeners for connection monitoring */
     static setupEventListeners() {
          RedisClient.instance.on('connect', () => {
               RedisClient.isConnected = true;
               logger.info('Connected to Redis');
          });

          RedisClient.instance.on('error', (error) => {
               RedisClient.isConnected = false;
               logger.error('Redis connection error', error);
          });

          RedisClient.instance.on('close', () => {
               RedisClient.isConnected = false;
               logger.warn('Redis connection closed');
          });

          RedisClient.instance.on('reconnecting', () => {
               logger.warn('Reconnecting to Redis...');
          });

          RedisClient.instance.on('ready', () => {
               logger.info('Redis client is ready');
          });

          RedisClient.instance.on('end', () => {
               RedisClient.isConnected = false;
               logger.warn('Redis connection ended');
          });
     }

     /** Gracefully close the Redis connection during shutdown */
     static async closeConnection() {
          if (RedisClient.instance) {
               try {
                    await RedisClient.instance.quit();
                    logger.info('Redis connection closed');
               } catch (error) {
                    logger.error('Error closing Redis connection: ', error);
               }
          }
     }

     /** Returns true if Redis is currently connected and responsive */
     static isReady() {
          return RedisClient.isConnected;
     }
}

module.exports = {
     redis: RedisClient.getInstance(),
     RedisClient,
};
