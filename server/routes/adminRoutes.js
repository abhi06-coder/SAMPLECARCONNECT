import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    getUsers,
    updateUserStatus,
    getRideAnalytics,
    getFeedback,
    replyFeedback,
    getUserReports,
    updateReportStatus,
    getAnnouncements,
    createAnnouncement,
    getAuditLogs
} from '../controllers/adminController.js';
import { getRefundRequests, processRefund as processRefundRequest } from '../controllers/refundController.js';

const router = express.Router();

router.use(protect);
router.use(admin);

// Module 1: User Management
router.route('/users').get(getUsers);
router.route('/users/:id/status').put(updateUserStatus);

// Module 2: Analytics
router.route('/analytics').get(getRideAnalytics);

// Module 3: Refunds
router.route('/refunds').get(getRefundRequests);
router.route('/refunds/:id').put(processRefundRequest);

// Module 4: Feedback
router.route('/feedback').get(getFeedback);
router.route('/feedback/:id/reply').put(replyFeedback);

// Module 5: Abuse & Trust
router.route('/reports').get(getUserReports);
router.route('/reports/:id').put(updateReportStatus);

// Module 6: Announcements
router.route('/announcements').get(getAnnouncements).post(createAnnouncement);

// Module 7: Audit Log
router.route('/audit-logs').get(getAuditLogs);

export default router;
