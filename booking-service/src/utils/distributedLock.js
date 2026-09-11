/**
 * ─── Distributed Seat Locking ───────────────────────────────────────────────
 *
 * Redis-based distributed locking to prevent double-booking of seats.
 * Uses Lua scripts for atomicity — either ALL seats are locked or NONE.
 *
 * Key design decisions:
 *   1. Sorted seatIds → deterministic key ordering prevents deadlocks when
 *      overlapping seat sets are being booked concurrently.
 *   2. All-or-nothing acquisition via Lua script (no partial locks).
 *   3. Ownership-based release — only the process that acquired the lock
 *      can release it (lock value = bookingId:timestamp).
 *   4. Segment-aware keys — different segments on the same seat get
 *      independent lock keys so non-overlapping partial-route bookings
 *      don't block each other.
 *
 * Lock key pattern: booking:lock:seat:{scheduleId}:{seatId}[:fromSeq:toSeq]
 */

const { redis } = require('../config/redis');
const logger = require('../config/logger');

// ─── Lua Scripts ─────────────────────────────────────────────────────────────
// These run atomically on Redis, guaranteeing no race conditions.

/**
 * ACQUIRE_SCRIPT: Attempts to SET NX (not-exists) on each key.
 * If any key already exists, it rolls back all previously acquired keys
 * and returns 0. Returns 1 only if ALL keys were successfully acquired.
 */
const ACQUIRE_SCRIPT = `
local lockValue = ARGV[1]
local ttl = tonumber(ARGV[2])
local acquired = {}

for i, key in ipairs(KEYS) do
     local result = redis.call('SET', key, lockValue, 'NX', 'EX', ttl)
     if not result then
          -- Rollback: release all previously acquired locks
          for j = 1, #acquired do
               redis.call('DEL', acquired[j])
          end
          return 0
     end
     table.insert(acquired, key)
end

return 1
`;

/**
 * RELEASE_SCRIPT: Deletes each key ONLY if the stored value matches our
 * lock value — prevents one booking from releasing another's locks.
 */
const RELEASE_SCRIPT = `
local lockValue = ARGV[1]
local released = 0

for i, key in ipairs(KEYS) do
     local currentValue = redis.call('GET', key)
     if currentValue == lockValue then
          redis.call('DEL', key)
          released = released + 1
     end
end

return released
`;

/**
 * Build Redis lock keys for a set of seats within a schedule.
 *
 * For segment bookings (fromSeq/toSeq provided), the key includes the
 * segment range so that non-overlapping segments on the same physical seat
 * can be booked independently. The DB transaction layer catches overlapping
 * segments via FOR UPDATE NOWAIT.
 *
 * @param {string}   scheduleId - Train schedule identifier
 * @param {string[]} seatIds    - Seat IDs (will be sorted to prevent deadlocks)
 * @param {number}   [fromSeq]  - Segment start station sequence
 * @param {number}   [toSeq]    - Segment end station sequence
 * @returns {string[]} Sorted lock keys
 */
function buildLockKeys(scheduleId, seatIds, fromSeq, toSeq) {
     const suffix = (fromSeq && toSeq) ? `:${fromSeq}:${toSeq}` : '';
     return [...seatIds]
          .sort()
          .map(seatId => `booking:lock:seat:${scheduleId}:${seatId}${suffix}`);
}

/**
 * Acquire distributed locks for a set of seats (all-or-nothing).
 *
 * @param {string}   scheduleId  - Schedule being booked
 * @param {string[]} seatIds     - Seats to lock
 * @param {string}   bookingId   - Used as part of the lock value for ownership
 * @param {number}   ttlSeconds  - How long the lock lives before auto-expiry
 * @param {number}   [fromSeq]   - Segment start (for segment-aware keys)
 * @param {number}   [toSeq]     - Segment end (for segment-aware keys)
 * @returns {Promise<{acquired: boolean, lockValue: string|null}>}
 */
async function acquireSeatLocks(scheduleId, seatIds, bookingId, ttlSeconds, fromSeq, toSeq) {
     const keys = buildLockKeys(scheduleId, seatIds, fromSeq, toSeq);
     const lockValue = `${bookingId}:${Date.now()}`;

     try {
          const result = await redis.eval(ACQUIRE_SCRIPT, keys.length, ...keys, lockValue, ttlSeconds);

          if (result === 1) {
               logger.info(`Distributed locks acquired for booking ${bookingId}`, {
                    scheduleId,
                    seatCount: seatIds.length,
                    ttlSeconds,
               });
               return { acquired: true, lockValue };
          }

          logger.info(`Failed to acquire locks — seats already locked`, {
               scheduleId,
               bookingId,
          });
          return { acquired: false, lockValue: null };

     } catch (error) {
          logger.error('Error acquiring distributed locks', {
               error: error.message,
               scheduleId,
               bookingId,
          });
          // Fail closed: reject the booking attempt rather than bypassing the lock.
          // Allowing duplicate bookings is far worse than a temporary service degradation.
          return { acquired: false, lockValue: null };
     }
}

/**
 * Release distributed locks only if we still own them (value matches).
 *
 * @param {string}   scheduleId - Schedule that was booked
 * @param {string[]} seatIds    - Seats to unlock
 * @param {string}   lockValue  - The lock value from acquireSeatLocks
 * @param {number}   [fromSeq]  - Segment start (for segment-aware keys)
 * @param {number}   [toSeq]    - Segment end (for segment-aware keys)
 */
async function releaseSeatLocks(scheduleId, seatIds, lockValue, fromSeq, toSeq) {
     if (!lockValue) return;

     const keys = buildLockKeys(scheduleId, seatIds, fromSeq, toSeq);

     try {
          const released = await redis.eval(RELEASE_SCRIPT, keys.length, ...keys, lockValue);
          logger.info(`Released ${released} distributed lock(s)`, { scheduleId });
     } catch (error) {
          // Non-critical: locks will expire via TTL anyway
          logger.error('Error releasing distributed locks', {
               error: error.message,
               scheduleId,
          });
     }
}

/**
 * Force-release all locks for a schedule+seatIds regardless of ownership.
 * Used by the expiry job when we know the booking is expired and needs cleanup.
 *
 * @param {string}   scheduleId - Schedule being cleaned up
 * @param {string[]} seatIds    - Seats to force-unlock
 * @param {number}   [fromSeq]  - Segment start (for segment-aware keys)
 * @param {number}   [toSeq]    - Segment end (for segment-aware keys)
 */
async function forceReleaseSeatLocks(scheduleId, seatIds, fromSeq, toSeq) {
     const keys = buildLockKeys(scheduleId, seatIds, fromSeq, toSeq);

     try {
          if (keys.length > 0) {
               await redis.del(...keys);
               logger.info(`Force-released ${keys.length} lock(s)`, { scheduleId });
          }
     } catch (error) {
          logger.error('Error force-releasing locks', { error: error.message });
     }
}

module.exports = {
     acquireSeatLocks,
     releaseSeatLocks,
     forceReleaseSeatLocks,
};
