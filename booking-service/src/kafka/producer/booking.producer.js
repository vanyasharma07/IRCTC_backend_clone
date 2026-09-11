/**
 * ─── Booking Kafka Producer ─────────────────────────────────────────────────
 *
 * Publishes booking lifecycle events for downstream consumers:
 *
 *   BOOKING_CONFIRMED  → Booking fully confirmed (notification-service sends email)
 *   BOOKING_CANCELLED  → Booking cancelled by user or system
 *   BOOKING_FAILED     → Booking failed (payment error, timeout, etc.)
 *
 * Each event includes user details (email, firstName) for personalized
 * notifications, plus relevant booking metadata.
 *
 * Built-in retry logic (3 attempts with exponential backoff) ensures
 * critical events aren't silently lost due to transient Kafka issues.
 * If all retries fail, the error is thrown to the caller for handling.
 */

const { producer, connectProducer } = require('../../config/kafka');
const logger = require('../../config/logger');
const { KAFKA_TOPICS } = require('../../../../shared/constants/kafka-topics');

const MAX_PUBLISH_RETRIES = 3;
const RETRY_DELAY_MS = 500;

class BookingProducer {
     constructor() {
          this.isInitialized = false;
     }

     /** Lazy initialization — connects the producer on first use */
     async initialize() {
          if (!this.isInitialized) {
               await connectProducer();
               this.isInitialized = true;
          }
     }

     /**
      * Send a message to a Kafka topic with retry logic.
      *
      * Critical events (BOOKING_CONFIRMED, etc.) must not be silently lost.
      * If all retry attempts fail, the error is thrown so callers can decide
      * how to handle it (log, compensate, etc.).
      *
      * @param {string} topic - Kafka topic name
      * @param {string} key   - Message key (for partition routing)
      * @param {Object} value - Message payload (will be JSON-serialized)
      */
     async sendMessage(topic, key, value) {
          await this.initialize();

          let lastError;
          for (let attempt = 1; attempt <= MAX_PUBLISH_RETRIES; attempt++) {
               try {
                    const result = await producer.send({
                         topic,
                         messages: [{
                              key: key || `${topic}-${Date.now()}`,
                              value: JSON.stringify(value),
                              timestamp: Date.now().toString(),
                         }],
                    });
                    logger.info(`Message sent to topic: ${topic}`, {
                         key,
                         partition: result[0].partition,
                         offset: result[0].offset,
                    });
                    return result;
               } catch (error) {
                    lastError = error;
                    logger.error(`Failed to send message to ${topic} (attempt ${attempt}/${MAX_PUBLISH_RETRIES})`, {
                         error: error.message,
                         key,
                    });
                    if (attempt < MAX_PUBLISH_RETRIES) {
                         await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
                    }
               }
          }

          logger.error(`All ${MAX_PUBLISH_RETRIES} publish attempts failed for ${topic}`, { key });
          throw lastError;
     }

     /** Publish a booking confirmation event (triggers email notification) */
     async publishBookingConfirmed(data) {
          return this.sendMessage(
               KAFKA_TOPICS.BOOKING_CONFIRMED,
               `booking-${data.bookingId}`,
               { ...data, confirmedAt: new Date().toISOString() }
          );
     }

     /** Publish a booking cancellation event */
     async publishBookingCancelled(data) {
          return this.sendMessage(
               KAFKA_TOPICS.BOOKING_CANCELLED,
               `booking-${data.bookingId}`,
               { ...data, cancelledAt: new Date().toISOString() }
          );
     }

     /** Publish a booking failure event (triggers failure notification) */
     async publishBookingFailed(data) {
          return this.sendMessage(
               KAFKA_TOPICS.BOOKING_FAILED,
               `booking-${data.bookingId}`,
               { ...data, failedAt: new Date().toISOString() }
          );
     }
}

module.exports = new BookingProducer();
