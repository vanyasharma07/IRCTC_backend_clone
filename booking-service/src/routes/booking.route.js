/**
 * ─── Booking Routes ─────────────────────────────────────────────────────────
 *
 * Defines the HTTP API for the booking service.
 * All routes require user authentication via the getUserContext middleware,
 * which reads the x-user-id header set by the API gateway.
 *
 * API Endpoints:
 *   POST   /bookings                       → Create a new booking
 *   GET    /bookings                       → List user's bookings (paginated)
 *   GET    /bookings/:bookingId            → Get booking details
 *   POST   /bookings/:bookingId/verify-payment → Verify Razorpay payment
 *   POST   /bookings/:bookingId/cancel     → Cancel a booking
 */

const express = require('express');
const { getUserContext } = require('../middlewares/getUserContext.middleware');
const {
     createBooking,
     getBooking,
     getUserBookings,
     cancelBooking,
     verifyPayment,
} = require('../controllers/booking.controller');

const router = express.Router();

// All booking routes require authentication (user context from gateway)
router.post('/bookings', getUserContext, createBooking);
router.get('/bookings', getUserContext, getUserBookings);
router.get('/bookings/:bookingId', getUserContext, getBooking);
router.post('/bookings/:bookingId/verify-payment', getUserContext, verifyPayment);
router.post('/bookings/:bookingId/cancel', getUserContext, cancelBooking);

module.exports = router;
