import RideAlert from '../models/RideAlert.js';

// @desc    Create a new ride alert
// @route   POST /api/alerts/create
// @access  Private
export const createAlert = async (req, res) => {
    try {
        const { source, destination, date } = req.body;

        if (!source || !destination) {
            return res.status(400).json({ message: 'Source and Destination are required' });
        }

        // Check availability logic? No, just create alert.

        const newAlert = await RideAlert.create({
            user: req.user._id,
            source,
            destination,
            date: date ? new Date(date) : undefined
        });

        res.status(201).json({ success: true, alert: newAlert, message: 'Alert created successfully' });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Alert already exists for this route' });
        }
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Check if alert exists for current search
// @route   GET /api/alerts/check
// @access  Private
export const checkAlertStatus = async (req, res) => {
    try {
        const { source, destination } = req.query;

        if (!source || !destination) {
            return res.status(400).json({ message: 'Missing params' });
        }

        const alert = await RideAlert.findOne({
            user: req.user._id,
            source: { $regex: new RegExp(`^${source}`, 'i') }, // Simple regex match or exact?
            destination: { $regex: new RegExp(`^${destination}`, 'i') }
        });

        res.json({ hasAlert: !!alert, alertId: alert?._id });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete/Cancel an alert
// @route   DELETE /api/alerts/:id (or by params?)
// @access  Private
export const deleteAlert = async (req, res) => {
    try {
        // If ID passed
        if (req.params.id && req.params.id !== 'undefined') {
            await RideAlert.findByIdAndDelete(req.params.id);
            return res.json({ success: true, message: 'Alert cancelled' });
        }

        // If canceling by Query (Source/Dest)
        const { source, destination } = req.query;
        if (source && destination) {
            await RideAlert.findOneAndDelete({
                user: req.user._id,
                source: { $regex: new RegExp(`^${source}`, 'i') },
                destination: { $regex: new RegExp(`^${destination}`, 'i') }
            });
            return res.json({ success: true, message: 'Alert cancelled' });
        }

        res.status(400).json({ message: 'Invalid Request' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
