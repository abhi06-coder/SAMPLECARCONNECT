import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { protectWithFirebase } from '../middleware/firebaseMiddleware.js';
import { getUserProfile, updateUserProfile, uploadProfilePhoto, getPublicProfile, toggleDeposit } from '../controllers/userController.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/profile/deposit', protect, toggleDeposit); // Toggle Deposit
router.post('/profile/upload-photo', protect, upload.single('profilePicture'), uploadProfilePhoto);
router.get('/:id/public', protect, getPublicProfile);

export default router;
