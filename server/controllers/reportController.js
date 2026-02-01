import UserReport from '../models/UserReport.js';

// @desc    Create new report
// @route   POST /api/reports
// @access  Private
const createReport = async (req, res) => {
    try {
        const { reportedUserId, type, description, rideId } = req.body;

        const report = await UserReport.create({
            reportedBy: req.user._id,
            reportedUserId,
            type,
            description,
            rideId
        });

        res.status(201).json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get my reports
// @route   GET /api/reports/my
// @access  Private
const getMyReports = async (req, res) => {
    try {
        const reports = await UserReport.find({ reportedBy: req.user._id })
            .populate('reportedUserId', 'name')
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { createReport, getMyReports };
