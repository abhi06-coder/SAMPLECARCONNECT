import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createAlert, checkAlertStatus, deleteAlert } from '../controllers/rideAlertController.js';

const router = express.Router();

router.post('/create', protect, createAlert);
router.get('/check', protect, checkAlertStatus);
router.delete('/', protect, deleteAlert); // For query params (source, destination)
router.delete('/:id', protect, deleteAlert); // For ID

export default router;
