import RefundRequest from '../models/RefundRequest.js';
import User from '../models/User.js';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Razorpay (Optional: only needed if we want to auto-process refund via API)
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Request a refund
// @route   POST /api/refunds/request
// @access  Private (Driver/User who paid deposit)
const requestRefund = async (req, res) => {
    const { reason, rideId } = req.body; // rideId is optional if it's general deposit refund?
    // Based on user request "refund request should be sended to admin panel"
    // And "when user pays the deposit of 100"
    // So this is likely about the Deposit Refund.
    // However, the model has `rideId`. Let's check the model again.
    // The model `RefundRequest.js` has `rideId` as required. This suggests it might be for a ride refund?
    // But the user prompt says "when user pays the deposit of 100".
    // If it's a deposit refund, `rideId` shouldn't be required or relevant.
    // Let's assume for DEPOSIT refund, we might need to adjust the model or use a dummy ID/make it optional.
    // Actually, looking at the model again, it has `rideId`. This model might have been created for RIDE refunds.
    // But the user wants DEPOSIT refunds.
    // I should probably make `rideId` optional in the model or create a new type of refund.
    // For now, I'll check if I can make `rideId` optional in the schema or if I should just use a null/dummy value if the schema enforces it.
    // Wait, I can modify the model.

    // Let's assume the user wants to refund the "Deposit".
    // The previously created `RefundRequest` model has `rideId` required. 
    // I will modify the model in a separate step to make `rideId` optional.

    // For now, let's write the controller assuming `rideId` is optional or we handle it.

    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        if (!user.depositPaid) {
            return res.status(400).json({ message: 'No deposit found to refund.' });
        }

        const existingRequest = await RefundRequest.findOne({
            driverId: userId,
            status: 'Pending',
            // Check if it's a deposit refund? Add a type field?
            // For now, let's assume any pending request blocks another.
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'Refund request already pending.' });
        }

        const refund = new RefundRequest({
            driverId: userId,
            amount: 100, // Deposit amount
            reason: reason,
            type: 'DEPOSIT', // Add this field to distinguish
            status: 'Pending'
        });

        await refund.save();

        res.status(201).json({ success: true, message: 'Refund request submitted', refund });
    } catch (error) {
        console.error("Refund Request Error:", error);
        res.status(500).json({ message: 'Failed to submit refund request' });
    }
};

// @desc    Get all refund requests (Admin)
// @route   GET /api/admin/refunds
// @access  Private/Admin
const getRefundRequests = async (req, res) => {
    try {
        const refunds = await RefundRequest.find({})
            .populate('driverId', 'name email phone')
            .sort({ createdAt: -1 });
        res.json(refunds);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch refund requests' });
    }
};

// @desc    Approve/Reject Refund
// @route   PUT /api/admin/refunds/:id/action
// @access  Private/Admin
const processRefund = async (req, res) => {
    const { id } = req.params;
    const { action, rejectionReason } = req.body; // action: 'approve' or 'reject'

    try {
        const refund = await RefundRequest.findById(id);
        if (!refund) {
            return res.status(404).json({ message: 'Refund request not found' });
        }

        if (refund.status !== 'Pending') {
            return res.status(400).json({ message: 'Refund request already processed' });
        }

        if (action === 'approve') {
            refund.status = 'Approved';
            refund.processedBy = req.user._id;
            refund.processedAt = Date.now();

            // Logic to actually refund via Razorpay if we had paymentId preserved
            // For now, we update local state

            const user = await User.findById(refund.driverId);
            if (user) {
                user.depositPaid = false;
                user.isDriver = false; // Revoke driver access?
                await user.save();
            }

            // Optional: Call Razorpay API to refund if paymentId was stored
            // await razorpay.payments.refund(paymentId, { amount: refund.amount * 100 });

        } else if (action === 'reject') {
            refund.status = 'Rejected';
            refund.rejectionReason = rejectionReason || 'No reason provided';
            refund.processedBy = req.user._id;
            refund.processedAt = Date.now();
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }

        await refund.save();
        res.json({ success: true, message: `Refund request ${action}d`, refund });

    } catch (error) {
        console.error("Process Refund Error:", error);
        res.status(500).json({ message: 'Failed to process refund' });
    }
};

export { requestRefund, getRefundRequests, processRefund };
