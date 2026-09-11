/**
 * ─── Booking Controller ─────────────────────────────────────────────────────
 *
 * Thin HTTP layer that validates request parameters and delegates to
 * the booking service. Controllers should NOT contain business logic —
 * they extract inputs, call the service, and format the response.
 *
 * All routes require user context (x-user-id header from API gateway).
 */

const asyncHandler = require('../utils/asyncHandler');
const { BadRequestError } = require('../utils/error');
const bookingService = require('../services/booking.service');

/**
 * POST /bookings
 * Create a new booking with seat selection and passenger details.
 */
exports.createBooking = asyncHandler(async (req, res) => {
     const userId = req.user.id;
     const { scheduleId, seatIds, passengers, idempotencyKey, fromStationId, toStationId, fromSeq, toSeq } = req.body;

     if (!scheduleId || !seatIds || !passengers || !idempotencyKey) {
          throw new BadRequestError('scheduleId, seatIds, passengers, and idempotencyKey are required');
     }

     const result = await bookingService.createBooking(
          userId, scheduleId, seatIds, passengers, idempotencyKey,
          fromStationId, toStationId, fromSeq, toSeq
     );

     res.status(201).json({ success: true, data: result });
});

/**
 * GET /bookings/:bookingId
 * Fetch a single booking by ID (user can only see their own bookings).
 */
exports.getBooking = asyncHandler(async (req, res) => {
     const userId = req.user.id;
     const { bookingId } = req.params;

     const result = await bookingService.getBooking(bookingId, userId);

     res.status(200).json({ success: true, data: result });
});

/**
 * GET /bookings
 * List all bookings for the authenticated user with optional filters.
 * Supports pagination (page, limit) and status filtering.
 */
exports.getUserBookings = asyncHandler(async (req, res) => {
     const userId = req.user.id;
     const { status, page, limit } = req.query;

     const result = await bookingService.getUserBookings(userId, {
          status,
          page: page ? parseInt(page, 10) : 1,
          limit: limit ? parseInt(limit, 10) : 10,
     });

     res.status(200).json({ success: true, data: result });
});

/**
 * POST /bookings/:bookingId/verify-payment
 * Verify client-side Razorpay payment after checkout.
 * Requires razorpayPaymentId and razorpaySignature in the request body.
 */
exports.verifyPayment = asyncHandler(async (req, res) => {
     const userId = req.user.id;
     const { bookingId } = req.params;
     const { razorpayPaymentId, razorpaySignature } = req.body;

     if (!razorpayPaymentId || !razorpaySignature) {
          throw new BadRequestError('razorpayPaymentId and razorpaySignature are required');
     }

     const result = await bookingService.verifyPayment(bookingId, userId, razorpayPaymentId, razorpaySignature);

     res.status(200).json({ success: true, data: result });
});

/**
 * POST /bookings/:bookingId/cancel
 * Cancel a booking. Handles both pre-payment and post-payment scenarios.
 */
exports.cancelBooking = asyncHandler(async (req, res) => {
     const userId = req.user.id;
     const { bookingId } = req.params;

     const result = await bookingService.cancelBooking(bookingId, userId);

     res.status(200).json({
          success: true,
          message: 'Booking cancelled successfully',
          data: result,
     });
});
