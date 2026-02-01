import Announcement from '../models/Announcement.js';

// @desc    Get all active announcements
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find({ isActive: true }).sort({ createdAt: -1 });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getAnnouncements };
