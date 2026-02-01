import express from 'express';
import { createReport, getMyReports } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createReport);
router.route('/my').get(protect, getMyReports);

export default router;
