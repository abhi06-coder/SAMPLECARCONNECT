import express from 'express';
import { createFeedback, getMyFeedback } from '../controllers/feedbackController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createFeedback);
router.route('/my').get(protect, getMyFeedback);

export default router;
