import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay Order
// @route   POST /api/payment/create-order
// @access  Private
const createOrder = async (req, res) => {
    const amount = 100 * 100; // 100 INR in paisa
    const currency = 'INR';

    const options = {
        amount: amount,
        currency: currency,
        receipt: `receipt_order_${Date.now()}`,
        notes: {
            userId: req.user._id.toString()
        }
    };

    try {
        const order = await razorpay.orders.create(options);

        res.json({
            success: true,
            orderId: order.id,
            amount: amount,
            currency: currency,
            key: process.env.RAZORPAY_KEY_ID,
            notes: order.notes
        });
    } catch (error) {
        console.error("Razorpay Order Creation Error:", error);
        res.status(500).json({ message: 'Failed to create payment order' });
    }
};

// @desc    Verify Payment
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user._id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: 'Invalid payment details' });
    }

    try {
        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Corrected Logic: Always set to 100 for Security Deposit.
            // Even if user has 50, they pay 100 to "refill" the security deposit.
            // They can't exceed 100 for this specific deposit type.
            user.walletBalance = 100;
            user.razorpayPaymentId = razorpay_payment_id;
            user.razorpayOrderId = razorpay_order_id;
            user.depositPaid = true; // explicitly mark as paid

            // If they already have vehicle details, unlock driver role immediately
            if (user.vehicle && user.vehicle.model && user.vehicle.plateNumber) {
                user.isDriver = true;
            }

            await user.save();

            res.json({
                success: true,
                message: 'Payment verified and Deposit recorded',
                user: {
                    isDriver: user.isDriver,
                    depositPaid: user.depositPaid,
                    walletBalance: user.walletBalance
                }
            });
        } else {
            res.status(400).json({ message: 'Payment verification failed' });
        }

    } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(500).json({ message: 'Server Payment Verification Failed' });
    }
};

// @desc    Request Refund for Security Deposit
// @route   POST /api/payment/request-refund
// @access  Private
const requestRefund = async (req, res) => {
    try {
        const { reason } = req.body;
        const userId = req.user._id;

        // Validate input
        if (!reason || reason.trim() === '') {
            return res.status(400).json({ message: 'Please provide a reason for the refund request' });
        }

        // Check if user has wallet balance to withdraw
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.walletBalance <= 0) {
            return res.status(400).json({ message: 'No wallet balance available to withdraw' });
        }

        // Import RefundRequest model dynamically
        const RefundRequest = (await import('../models/RefundRequest.js')).default;

        // Create refund request with current wallet balance
        const refundRequest = await RefundRequest.create({
            driverId: userId,
            type: 'DEPOSIT',
            amount: user.walletBalance, // Use actual balance, not fixed ₹100
            reason: reason.trim(),
            status: 'Pending'
        });

        console.log('✅ Refund Request Created:', {
            id: refundRequest._id,
            driverId: refundRequest.driverId,
            type: refundRequest.type,
            status: refundRequest.status,
            amount: refundRequest.amount
        });

        res.status(201).json({
            success: true,
            message: 'Refund request submitted successfully. Our admin team will review it soon.',
            refundRequest
        });

    } catch (error) {
        console.error('Refund Request Error:', error);
        res.status(500).json({ message: 'Failed to submit refund request' });
    }
};

export { createOrder, verifyPayment, requestRefund };
