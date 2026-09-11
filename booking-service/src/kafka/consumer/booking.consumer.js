/**
 * ─── Booking Kafka Consumer ─────────────────────────────────────────────────
 *
 * Subscribes to events from other microservices and triggers the appropriate
 * booking lifecycle handlers:
 *
 *   PAYMENT_SUCCESS     → Confirm the booking (seats held → confirmed)
 *   PAYMENT_FAILED      → Fail the booking and release held seats
 *   SCHEDULE_CANCELLED  → Cancel all active bookings on that schedule
 *
 * Uses the shared DLQ (Dead-Letter Queue) handler to prevent poison messages
 * from blocking the consumer. After DLQ_MAX_RETRIES failures, the message
 * is forwarded to dlq.booking-service topic for manual investigation.
 */

const { consumer } = require('../../config/kafka');
const { producer, connectProducer } = require('../../config/kafka');
const logger = require('../../config/logger');
const { KAFKA_TOPICS } = require('../../../../shared/constants/kafka-topics');
const { withDLQ } = require('../../../../shared/utils/dlqHandler');
const bookingService = require('../../services/booking.service');

const start = async () => {
     await consumer.connect();
     await connectProducer(); // Producer is needed for DLQ publishing
     logger.info('Booking consumer connected');

     // Subscribe to payment and schedule lifecycle topics
     await consumer.subscribe({
          topics: [
               KAFKA_TOPICS.PAYMENT_SUCCESS,
               KAFKA_TOPICS.PAYMENT_FAILED,
               KAFKA_TOPICS.SCHEDULE_CANCELLED,
          ],
          fromBeginning: false,
     });

     // Process messages with DLQ protection
     await consumer.run({
          eachMessage: withDLQ(producer, KAFKA_TOPICS.DLQ_BOOKING, logger, async ({ topic, partition, message, parsedValue }) => {
               logger.info(`Received message on topic: ${topic}`, {
                    partition,
                    offset: message.offset,
                    key: message.key?.toString(),
               });

               switch (topic) {
                    case KAFKA_TOPICS.PAYMENT_SUCCESS:
                         // Payment completed — confirm the booking
                         await bookingService.handlePaymentSuccess(
                              parsedValue.paymentOrderId,
                              parsedValue.gatewayPaymentId,
                              parsedValue.amount
                         );
                         break;

                    case KAFKA_TOPICS.PAYMENT_FAILED:
                         // Payment failed — release seats and mark booking as failed
                         await bookingService.handlePaymentFailure(
                              parsedValue.paymentOrderId,
                              parsedValue.reason
                         );
                         break;

                    case KAFKA_TOPICS.SCHEDULE_CANCELLED: {
                         // Train schedule cancelled — cancel all affected bookings
                         const scheduleId = parsedValue.scheduleId || parsedValue.id || (parsedValue.data && parsedValue.data.scheduleId);
                         await bookingService.handleScheduleCancelled(scheduleId);
                         break;
                    }

                    default:
                         logger.warn(`Unknown topic: ${topic}`);
               }
          }),
     });

     logger.info('Booking consumer running');
};

module.exports = { start };
