import mongoose from 'mongoose';

const userReportSchema = new mongoose.Schema({
    reportedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    rideId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride',
    },
    type: {
        type: String,
        enum: ['Spam', 'Harassment', 'Unsafe Driving', 'Other'],
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    adminNotes: {
        type: String,
    },
    status: {
        type: String,
        enum: ['Pending', 'Resolved', 'Dismissed'],
        default: 'Pending',
    }
}, {
    timestamps: true,
});

const UserReport = mongoose.model('UserReport', userReportSchema);

export default UserReport;
