import express from 'express';
import { addReview, getUserReviews } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, addReview);
router.get('/user/:userId', getUserReviews);

export default router;
