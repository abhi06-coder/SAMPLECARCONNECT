import express from 'express';
import { createRide, getDriverRides, updateRideStatus, updateRide, deleteRide, searchRides, joinWaitlist, cancelRide } from '../controllers/rideController.js';
import { protect, restrictToActive } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/search', searchRides); // Public route
router.post('/create', protect, restrictToActive, createRide);
router.get('/driver', protect, getDriverRides);
router.post('/:id/waitlist', protect, restrictToActive, joinWaitlist);
router.put('/:id', protect, restrictToActive, updateRide); // General Update (Date/Time)
router.put('/:id/status', protect, restrictToActive, updateRideStatus);
router.delete('/:id/cancel', protect, restrictToActive, cancelRide); // Cancel with penalty logic
router.delete('/:id', protect, restrictToActive, deleteRide);

import { getRideById } from '../controllers/rideController.js';
router.get('/:id', protect, getRideById); // Or public if needed, but protect is safe for now

export default router;
