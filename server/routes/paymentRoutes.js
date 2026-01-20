import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import { handleWebhook } from '../controllers/paymentWebhookController.js';

const router = express.Router();

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment); // Keep for manual/debug
router.post('/webhook', handleWebhook); // Public endpoint

export default router;
