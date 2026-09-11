/**
 * ─── Booking Expiry Background Job ──────────────────────────────────────────
 *
 * Periodically scans for bookings that have been stuck in early states
 * (PENDING, SEATS_HELD, PAYMENT_PENDING) past their lockExpiresAt time.
 *
 * These "stale" bookings happen when a user starts a booking but never
 * completes payment. Without cleanup, the seats would remain locked forever.
 *
 * Key features:
 *   - Redis-based leader election ensures only ONE instance runs per cycle
 *     (critical when running multiple replicas behind a load balancer)
 *   - Optimistic locking (CAS) prevents races with payment webhooks
 *   - Full saga compensation: releases inventory holds + Redis locks
 *   - Publishes BOOKING_FAILED events for downstream notifications
 */

const prisma = require('../config/prisma');
const logger = require('../config/logger');
const { config } = require('../config');
const { redis } = require('../config/redis');
const { forceReleaseSeatLocks } = require('./distributedLock');
const { compensateAll } = require('../services/saga.service');
const { userClient } = require('../services/userClient');
const bookingProducer = require('../kafka/producer/booking.producer');

/**
 * Fetch user details for notification enrichment.
 * Failures here must NEVER break the expiry workflow — log and return empty.
 */
const fetchUserForNotification = async (userId) => {
     try {
          const user = await userClient.getUserById(userId);
          return user ? { email: user.email, firstName: user.firstName } : {};
     } catch (err) {
          logger.warn('Failed to enrich expiry event with user details', {
               userId,
               error: err.message,
          });
          return {};
     }
};

let expiryInterval = null;

// ─── Leader Election ────────────────────────────────────────────────────────
// Only one instance across all replicas should run the expiry job per cycle.
// We use Redis SET NX EX as a lightweight leader lock.

const LEADER_KEY = 'booking:expiry-job:leader';
const LEADER_TTL_SECONDS = 25; // Shorter than the check interval so it re-acquires each cycle

/**
 * Try to become the leader for this expiry cycle.
 * Returns true if this instance acquired the lock (i.e., it's the leader).
 */
async function tryAcquireLeadership() {
     try {
          const result = await redis.set(LEADER_KEY, process.pid.toString(), 'NX', 'EX', LEADER_TTL_SECONDS);
          return result === 'OK';
     } catch (err) {
          // If Redis is down, skip this cycle rather than having all instances run
          logger.error('Failed to acquire expiry job leadership', { error: err.message });
          return false;
     }
}

/**
 * Core cleanup logic — finds and expires stale bookings.
 *
 * For each expired booking:
 *   1. CAS claim ownership (prevents race with payment webhook)
 *   2. Compensate all completed saga steps (release inventory holds)
 *   3. Force-release Redis distributed locks
 *   4. Publish BOOKING_FAILED event for notifications
 */
async function cleanExpiredBookings() {
     // Leader election: only one instance runs per cycle
     const isLeader = await tryAcquireLeadership();
     if (!isLeader) {
          logger.debug('Skipping expiry job — another instance is the leader');
          return;
     }

     try {
          const expiredBookings = await prisma.booking.findMany({
               where: {
                    status: { in: ['PENDING', 'SEATS_HELD', 'PAYMENT_PENDING'] },
                    lockExpiresAt: { lt: new Date() },
               },
               include: { seats: true },
          });

          if (expiredBookings.length === 0) return;

          logger.info(`Found ${expiredBookings.length} expired booking(s) to clean up`);

          for (const booking of expiredBookings) {
               try {
                    const seatIds = booking.seats.map(s => s.seatId).sort();

                    // Atomically claim this booking via optimistic lock (CAS).
                    // If payment webhook or user cancel already changed the version, skip it.
                    const claimed = await prisma.booking.updateMany({
                         where: {
                              id: booking.id,
                              version: booking.version,
                              status: { in: ['PENDING', 'SEATS_HELD', 'PAYMENT_PENDING'] },
                         },
                         data: {
                              status: 'EXPIRED',
                              failureReason: 'booking_timeout',
                              version: { increment: 1 },
                         },
                    });

                    if (claimed.count === 0) {
                         logger.info(`Booking ${booking.id} already handled by another process, skipping expiry`);
                         continue;
                    }

                    // Compensate all completed saga steps (release inventory holds, etc.)
                    await compensateAll(booking, seatIds);

                    // Release Redis distributed locks (segment-aware)
                    await forceReleaseSeatLocks(booking.scheduleId, seatIds, booking.fromSeq, booking.toSeq);

                    // Publish BOOKING_FAILED event so notification service can alert the user
                    try {
                         const userInfo = await fetchUserForNotification(booking.userId);
                         await bookingProducer.publishBookingFailed({
                              bookingId: booking.id,
                              userId: booking.userId,
                              email: userInfo.email,
                              firstName: userInfo.firstName,
                              scheduleId: booking.scheduleId,
                              reason: 'booking_timeout',
                         });
                    } catch (err) {
                         logger.error('Failed to publish BOOKING_FAILED for expired booking', {
                              bookingId: booking.id,
                              error: err.message,
                         });
                    }

                    logger.info(`Expired booking ${booking.id} cleaned up`, {
                         previousStatus: booking.status,
                    });

               } catch (error) {
                    logger.error(`Failed to clean up expired booking ${booking.id}`, {
                         error: error.message,
                    });
               }
          }
     } catch (error) {
          logger.error('Error in booking expiry job', { error: error.message });
     }
}

/** Start the background expiry job — runs immediately, then on interval */
function startBookingExpiryJob() {
     cleanExpiredBookings(); // Run once immediately on startup

     expiryInterval = setInterval(cleanExpiredBookings, config.BOOKING_EXPIRY_CHECK_INTERVAL_MS);
     logger.info(
          `Booking expiry job started (interval: ${config.BOOKING_EXPIRY_CHECK_INTERVAL_MS}ms)`
     );
}

/** Stop the background expiry job — called during graceful shutdown */
function stopBookingExpiryJob() {
     if (expiryInterval) {
          clearInterval(expiryInterval);
          expiryInterval = null;
          logger.info('Booking expiry job stopped');
     }
}

module.exports = { startBookingExpiryJob, stopBookingExpiryJob };
