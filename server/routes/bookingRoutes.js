import express from 'express';
import { bookRide, getMyBookings, processPayment, getDriverBookings, updateBookingStatus } from '../controllers/bookingController.js';
import { protect, restrictToActive } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/book', protect, restrictToActive, bookRide);
router.get('/my-bookings', protect, getMyBookings);
router.get('/driver-requests', protect, getDriverBookings);
router.put('/:id/pay', protect, processPayment);
router.put('/:id/status', protect, updateBookingStatus);
import { getRideBookings, completeBooking, confirmBookingCompletion } from '../controllers/bookingController.js';
router.get('/ride/:rideId', protect, getRideBookings);
router.put('/:id/complete', protect, completeBooking);
router.post('/:id/confirm-completion', protect, confirmBookingCompletion);

export default router;
