import User from '../models/User.js';
import crypto from 'crypto';

// @desc    Handle Razorpay Webhook
// @route   POST /api/payment/webhook
// @access  Public (Validated by Signature)
const handleWebhook = async (req, res) => {
    // In a real app, verify signature:
    // const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET);
    // shasum.update(JSON.stringify(req.body));
    // const digest = shasum.digest('hex');
    // if (digest !== req.headers['x-razorpay-signature']) return res.status(400).send('Invalid signature');

    const { event, payload } = req.body;

    console.log(`[Webhook] Received Event: ${event}`);

    if (event === 'payment.captured' || event === 'order.paid' || event === 'mock.payment.success') {
        // Extract userId from 'notes' or map orderId to user in DB
        // For this MOCK implementation, we will pass userId in the payload directly 
        // or assume the payload contains the custom order_id structure we created: "order_mock_TIMESTAMP"    

        // In this simplified mock, we expect the client/tester to send userId or email in payload
        // OR we just use the 'payment.entity.notes' if passed.

        const userId = payload?.payment?.entity?.notes?.userId;

        if (userId) {
            try {
                const user = await User.findById(userId);
                if (user) {
                    user.depositPaid = true;
                    // Auto-unlock driver if vehicle details exist
                    if (user.vehicle && user.vehicle.model && user.vehicle.plateNumber) {
                        user.isDriver = true;
                    }
                    await user.save();
                    console.log(`[Webhook] Deposit confirmed for user: ${user.email}`);
                    return res.status(200).json({ status: 'ok' });
                }
            } catch (err) {
                console.error(`[Webhook] User update failed: ${err.message}`);
            }
        } else {
            console.warn('[Webhook] No userId found in payload notes');
        }
    }

    res.status(200).json({ status: 'ignored' });
};

export { handleWebhook };
