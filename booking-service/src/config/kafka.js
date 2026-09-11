/**
 * ─── Kafka Client Configuration ─────────────────────────────────────────────
 *
 * Sets up the KafkaJS client with a producer and consumer for the booking service.
 *
 * Producer: publishes booking lifecycle events (CONFIRMED, CANCELLED, FAILED)
 *   - Idempotent mode enabled to prevent duplicate messages on retries
 *
 * Consumer: subscribes to payment events (SUCCESS, FAILED) and schedule cancellations
 *   - Uses a dedicated consumer group: 'booking-service-group'
 *   - Heartbeat/session timeouts tuned for reliability
 */

const { Kafka, logLevel } = require('kafkajs');
const logger = require('./logger');
const { config } = require('.');

const kafka = new Kafka({
     clientId: config.KAFKA_CLIENT_ID,
     brokers: [config.KAFKA_BROKER || 'localhost:9093'],
     logLevel: logLevel.ERROR,
     retry: {
          initialRetryTime: 300,
          retries: 8,
          maxRetryTime: 30000,
     },
});

// ─── Producer Setup ─────────────────────────────────────────────────────────
// Auto-creates topics if they don't exist (development convenience).
// Idempotent mode ensures exactly-once delivery semantics.

const producer = kafka.producer({
     allowAutoTopicCreation: true,
     transactionTimeout: 30000,
     idempotent: true,
     maxInFlightRequests: 5,
     retry: {
          retries: 5,
     },
});

let isProducerConnected = false;

const connectProducer = async () => {
     if (!isProducerConnected) {
          await producer.connect();
          isProducerConnected = true;
          logger.info('Kafka producer connected');
     }
};

const disconnectProducer = async () => {
     if (isProducerConnected) {
          await producer.disconnect();
          isProducerConnected = false;
          logger.info('Kafka producer disconnected');
     }
};

// ─── Consumer Setup ─────────────────────────────────────────────────────────
// Listens for payment results and schedule lifecycle events.

const consumer = kafka.consumer({
     groupId: 'booking-service-group',
     sessionTimeout: 30000,
     heartbeatInterval: 3000,
});

const disconnectConsumer = async () => {
     await consumer.disconnect();
     logger.info('Kafka consumer disconnected');
};

/** Disconnect both producer and consumer — called during graceful shutdown */
const disconnectAll = async () => {
     await disconnectProducer();
     await disconnectConsumer();
};

module.exports = {
     kafka,
     producer,
     consumer,
     connectProducer,
     disconnectProducer,
     disconnectConsumer,
     disconnectAll,
};
