/**
 * ─── Saga Orchestrator ──────────────────────────────────────────────────────
 *
 * Implements the Saga pattern for distributed booking transactions.
 *
 * The booking lifecycle involves multiple services (inventory, payment),
 * and we can't use a single database transaction across them. Instead,
 * each step is executed independently with its own compensation action.
 *
 * Forward Flow:
 *   1. HOLD_SEATS     → Reserve seats in inventory (temporary hold)
 *   2. CREATE_PAYMENT → Create a payment order in payment-service
 *   3. CONFIRM_SEATS  → Permanently assign seats after payment success
 *
 * Compensation (reverse order of completed steps):
 *   3. compensateConfirmSeats  → Cancel confirmed booking in inventory
 *   2. compensateCreatePayment → Initiate refund in payment-service
 *   1. compensateHoldSeats     → Release held seats in inventory
 *
 * Every step is logged to the SagaLog table for:
 *   - Auditability: full trace of what happened and when
 *   - Crash recovery: on restart, we can see which steps completed
 *   - Debugging: response/error payloads are stored for investigation
 */

const prisma = require('../config/prisma');
const logger = require('../config/logger');
const { inventoryClient } = require('./inventoryClient');
const { paymentClient } = require('./paymentClient');

// ─── Forward Steps ──────────────────────────────────────────────────────────

/**
 * Step 1: Hold seats in inventory service.
 * Marks the booking as SEATS_HELD on success.
 *
 * @param {Object}   booking    - Booking record from DB
 * @param {string[]} seatIds    - Sorted seat IDs to hold
 * @param {number}   ttlSeconds - How long the hold lasts
 * @param {number}   [fromSeq]  - Segment start (for partial-route bookings)
 * @param {number}   [toSeq]    - Segment end (for partial-route bookings)
 */
async function executeHoldSeats(booking, seatIds, ttlSeconds, fromSeq, toSeq) {
     const sagaLog = await prisma.sagaLog.create({
          data: {
               bookingId: booking.id,
               step: 'HOLD_SEATS',
               status: 'PENDING',
               request: { scheduleId: booking.scheduleId, seatIds, userId: booking.userId, ttlSeconds, fromSeq, toSeq },
          },
     });

     try {
          const result = await inventoryClient.holdSeats(
               booking.scheduleId,
               seatIds,
               booking.userId,
               ttlSeconds,
               fromSeq,
               toSeq
          );

          await prisma.sagaLog.update({
               where: { id: sagaLog.id },
               data: { status: 'COMPLETED', response: result },
          });

          await prisma.booking.update({
               where: { id: booking.id },
               data: { status: 'SEATS_HELD' },
          });

          logger.info(`Saga HOLD_SEATS completed for booking ${booking.id}`);
          return result;

     } catch (error) {
          const errorMsg = error.response?.data?.message || error.message;
          await prisma.sagaLog.update({
               where: { id: sagaLog.id },
               data: { status: 'FAILED', error: errorMsg },
          });
          throw error;
     }
}

/**
 * Step 2: Create a payment order in payment service.
 * Marks the booking as PAYMENT_PENDING and stores the paymentOrderId.
 *
 * @param {Object} booking - Booking record from DB
 */
async function executeCreatePayment(booking) {
     const idempotencyKey = `${booking.id}-payment`;

     const sagaLog = await prisma.sagaLog.create({
          data: {
               bookingId: booking.id,
               step: 'CREATE_PAYMENT',
               status: 'PENDING',
               request: { bookingId: booking.id, amount: booking.totalAmount, userId: booking.userId },
          },
     });

     try {
          const result = await paymentClient.createPaymentOrder(
               booking.id,
               booking.totalAmount,
               booking.userId,
               idempotencyKey
          );

          await prisma.sagaLog.update({
               where: { id: sagaLog.id },
               data: { status: 'COMPLETED', response: result },
          });

          await prisma.booking.update({
               where: { id: booking.id },
               data: {
                    status: 'PAYMENT_PENDING',
                    paymentOrderId: result.paymentOrderId,
               },
          });

          logger.info(`Saga CREATE_PAYMENT completed for booking ${booking.id}`);
          return result;

     } catch (error) {
          const errorMsg = error.response?.data?.message || error.message;
          await prisma.sagaLog.update({
               where: { id: sagaLog.id },
               data: { status: 'FAILED', error: errorMsg },
          });
          throw error;
     }
}

/**
 * Step 3: Confirm seats in inventory after payment success.
 * This permanently assigns the seats to the booking.
 *
 * @param {Object}   booking   - Booking record from DB
 * @param {string[]} seatIds   - Sorted seat IDs to confirm
 * @param {number}   [fromSeq] - Segment start (for partial-route bookings)
 * @param {number}   [toSeq]   - Segment end (for partial-route bookings)
 */
async function executeConfirmSeats(booking, seatIds, fromSeq, toSeq) {
     const sagaLog = await prisma.sagaLog.create({
          data: {
               bookingId: booking.id,
               step: 'CONFIRM_SEATS',
               status: 'PENDING',
               request: { scheduleId: booking.scheduleId, seatIds, userId: booking.userId, bookingId: booking.id, fromSeq, toSeq },
          },
     });

     try {
          const result = await inventoryClient.confirmSeats(
               booking.scheduleId,
               seatIds,
               booking.userId,
               booking.id,
               fromSeq,
               toSeq
          );

          await prisma.sagaLog.update({
               where: { id: sagaLog.id },
               data: { status: 'COMPLETED', response: result },
          });

          logger.info(`Saga CONFIRM_SEATS completed for booking ${booking.id}`);
          return result;

     } catch (error) {
          const errorMsg = error.response?.data?.message || error.message;
          await prisma.sagaLog.update({
               where: { id: sagaLog.id },
               data: { status: 'FAILED', error: errorMsg },
          });
          throw error;
     }
}

// ─── Compensation Steps (reverse operations) ────────────────────────────────

/** Undo HOLD_SEATS: release the temporary seat reservation in inventory */
async function compensateHoldSeats(booking, seatIds) {
     logger.info(`Compensating HOLD_SEATS for booking ${booking.id}`);
     try {
          await inventoryClient.releaseSeats(booking.scheduleId, seatIds, booking.userId, booking.fromSeq, booking.toSeq);

          await prisma.sagaLog.updateMany({
               where: { bookingId: booking.id, step: 'HOLD_SEATS', status: 'COMPLETED' },
               data: { status: 'COMPENSATED' },
          });
     } catch (error) {
          logger.error(`Failed to compensate HOLD_SEATS for booking ${booking.id}`, {
               error: error.message,
          });
          // Non-fatal: inventory lock expiry will eventually clean this up
     }
}

/** Undo CREATE_PAYMENT: initiate a refund via payment service */
async function compensateCreatePayment(booking) {
     if (!booking.paymentOrderId) return; // No payment was created

     logger.info(`Compensating CREATE_PAYMENT for booking ${booking.id}`);
     try {
          const idempotencyKey = `${booking.id}-refund-compensation`;
          await paymentClient.initiateRefund(
               booking.paymentOrderId,
               booking.totalAmount,
               'booking_compensation',
               idempotencyKey
          );

          await prisma.sagaLog.updateMany({
               where: { bookingId: booking.id, step: 'CREATE_PAYMENT', status: 'COMPLETED' },
               data: { status: 'COMPENSATED' },
          });
     } catch (error) {
          logger.error(`Failed to compensate CREATE_PAYMENT for booking ${booking.id}`, {
               error: error.message,
          });
     }
}

/** Undo CONFIRM_SEATS: cancel the booking in inventory to release seats */
async function compensateConfirmSeats(booking) {
     logger.info(`Compensating CONFIRM_SEATS for booking ${booking.id}`);
     try {
          await inventoryClient.cancelBooking(booking.scheduleId, booking.id, booking.userId);

          await prisma.sagaLog.updateMany({
               where: { bookingId: booking.id, step: 'CONFIRM_SEATS', status: 'COMPLETED' },
               data: { status: 'COMPENSATED' },
          });
     } catch (error) {
          logger.error(`Failed to compensate CONFIRM_SEATS for booking ${booking.id}`, {
               error: error.message,
          });
     }
}

/**
 * Compensate ALL completed saga steps in reverse order.
 *
 * This is the main rollback function called when a booking needs to be
 * undone — whether due to a failure, timeout, or cancellation.
 * It reads the SagaLog to determine which steps completed, then runs
 * their compensation in reverse chronological order.
 */
async function compensateAll(booking, seatIds) {
     const completedSteps = await prisma.sagaLog.findMany({
          where: { bookingId: booking.id, status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' }, // Reverse order for proper rollback
     });

     for (const step of completedSteps) {
          switch (step.step) {
               case 'CONFIRM_SEATS':
                    await compensateConfirmSeats(booking);
                    break;
               case 'CREATE_PAYMENT':
                    await compensateCreatePayment(booking);
                    break;
               case 'HOLD_SEATS':
                    await compensateHoldSeats(booking, seatIds);
                    break;
          }
     }
}

module.exports = {
     executeHoldSeats,
     executeCreatePayment,
     executeConfirmSeats,
     compensateHoldSeats,
     compensateCreatePayment,
     compensateConfirmSeats,
     compensateAll,
};
