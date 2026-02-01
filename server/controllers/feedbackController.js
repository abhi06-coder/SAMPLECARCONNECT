import Feedback from '../models/Feedback.js';

// @desc    Create new feedback
// @route   POST /api/feedback
// @access  Private
const createFeedback = async (req, res) => {
    try {
        const { message, category } = req.body;

        const feedback = await Feedback.create({
            userId: req.user._id,
            message,
            category
        });

        res.status(201).json(feedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get my feedback
// @route   GET /api/feedback/my
// @access  Private
const getMyFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(feedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { createFeedback, getMyFeedback };
