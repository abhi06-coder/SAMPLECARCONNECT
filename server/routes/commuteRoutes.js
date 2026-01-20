import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createTemplate, getMyTemplates, checkPendingCommute, publishCommute } from '../controllers/commuteController.js';

const router = express.Router();

router.post('/create', protect, createTemplate);
router.get('/list', protect, getMyTemplates);
router.get('/check-pending', protect, checkPendingCommute);
router.post('/publish/:id', protect, publishCommute);

export default router;
