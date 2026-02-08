import mongoose from 'mongoose';

const rideAlertSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    source: {
        type: String,
        required: true,
        trim: true
    },
    destination: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: false // Optional: Alert for any date or specific date? Plan said optional.
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: { expires: '24h' } // TTL Index: Auto-delete after 24 hours
    }
});

// Compound index to prevent duplicate alerts for same route by same user
rideAlertSchema.index({ user: 1, source: 1, destination: 1 }, { unique: true });

const RideAlert = mongoose.model('RideAlert', rideAlertSchema);

export default RideAlert;
