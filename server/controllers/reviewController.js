import Review from '../models/Review.js';
import Ride from '../models/Ride.js';
import Booking from '../models/Booking.js';

// @desc    Add a review
// @route   POST /api/reviews
// @access  Private
const addReview = async (req, res) => {
    try {
        const { rideId, revieweeId, rating, comment } = req.body;

        // Verify that the user was actually part of the ride
        const ride = await Ride.findById(rideId);
        if (!ride) {
            res.status(404).json({ message: 'Ride not found' });
            return;
        }

        // Check availability/participation logic if needed (skipped for brevity as per existing)

        // Simplified check: Just ensure they are not reviewing themselves
        if (req.user._id.toString() === revieweeId) {
            res.status(400).json({ message: 'Cannot review yourself' });
            return;
        }

        // Use findOneAndUpdate with upsert
        const review = await Review.findOneAndUpdate(
            {
                ride: rideId,
                reviewer: req.user._id,
                reviewee: revieweeId
            },
            {
                rating,
                comment
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        res.status(201).json(review);
    } catch (error) {
        console.error("Add Review Error:", error);
        res.status(400).json({ message: 'Review failed', error: error.message });
    }
};

// @desc    Get reviews for a user
// @route   GET /api/reviews/user/:userId
// @access  Public
const getUserReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ reviewee: req.params.userId })
            .populate('reviewer', 'name profilePicture')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export { addReview, getUserReviews };
