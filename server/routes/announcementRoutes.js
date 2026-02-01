import express from 'express';
import { getAnnouncements } from '../controllers/announcementController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getAnnouncements);

export default router;
