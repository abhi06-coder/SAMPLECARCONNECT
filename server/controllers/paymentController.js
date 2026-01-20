import User from '../models/User.js';

// @desc    Create Mock Razorpay Order
// @route   POST /api/payment/create-order
// @access  Private
const createOrder = async (req, res) => {
    // In a real scenario, we would use Razorpay SDK here
    const amount = 100 * 100; // 100 INR in paisa
    const currency = 'INR';

    // Simulate Order ID
    const mockOrderId = `order_mock_${Date.now()}`;

    // Pass userId so our mock webhook can identify the user later
    const userId = req.user._id;

    res.json({
        success: true,
        orderId: mockOrderId,
        amount: amount,
        currency: currency,
        key: 'mock_razorpay_key',
        notes: { userId } // Important for webhook identification
    });
};

// @desc    Verify Mock Payment
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = async (req, res) => {
    const { orderId, paymentId } = req.body;
    const userId = req.user._id;

    if (!orderId || !paymentId) {
        return res.status(400).json({ message: 'Invalid payment details' });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.depositPaid = true;

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
                depositPaid: user.depositPaid
            }
        });

    } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(500).json({ message: 'Server Payment Verification Failed' });
    }
};

export { createOrder, verifyPayment };
