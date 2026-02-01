import Ride from '../models/Ride.js';
import User from '../models/User.js';

// @desc    Cancel ride with time-based penalty
// @route   DELETE /api/rides/:id/cancel
// @access  Private (Driver only)
const cancelRide = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id).populate('bookings.passenger', 'name email');

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        // Verify ownership
        if (ride.driver.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to cancel this ride' });
        }

        // Calculate time difference
        const now = new Date();
        const rideStartTime = new Date(ride.dateTime);
        const timeDifferenceMinutes = (rideStartTime - now) / (1000 * 60); // Convert ms to minutes

        console.log(`⏰ Ride starts in ${timeDifferenceMinutes.toFixed(0)} minutes`);

        // Apply penalty if canceling within 20 minutes of start time
        if (timeDifferenceMinutes <= 20 && timeDifferenceMinutes > 0) {
            const user = await User.findById(req.user._id);

            if (user.walletBalance > 0) {
                const previousBalance = user.walletBalance;
                user.walletBalance = 0;
                user.isDriver = false; // Revoke driver status
                await user.save();

                console.log(`⚠️ Late cancellation penalty applied to user ${user._id}. Balance ${previousBalance} → 0`);

                // Delete the ride
                await ride.deleteOne();

                return res.json({
                    success: true,
                    message: `Ride cancelled. Late cancellation penalty applied: ₹${previousBalance} deducted from wallet.`,
                    penaltyApplied: true,
                    penaltyAmount: previousBalance,
                    warning: 'You cancelled within 20 minutes of ride start time. Your wallet balance has been forfeited as penalty.'
                });
            }
        }

        // No penalty - normal cancellation
        await ride.deleteOne();

        // Auto-demote to user if no active rides left
        const activeRides = await Ride.countDocuments({ driver: req.user._id, status: 'active' });
        if (activeRides === 0) {
            await User.findByIdAndUpdate(req.user._id, { role: 'user' });
        }

        res.json({
            success: true,
            message: `Ride cancelled successfully. ${timeDifferenceMinutes > 20 ? 'No penalty applied.' : ''}`,
            penaltyApplied: false
        });

    } catch (error) {
        console.error('Cancel Ride Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export { cancelRide };
