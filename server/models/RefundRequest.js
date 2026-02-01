import mongoose from 'mongoose';

const refundRequestSchema = new mongoose.Schema({
    rideId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride',
        required: false, // Made optional for Deposit refunds
    },
    type: {
        type: String,
        enum: ['RIDE', 'DEPOSIT'],
        default: 'DEPOSIT'
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Admin ID
    },
    processedAt: {
        type: Date,
    },
    rejectionReason: {
        type: String,
    }
}, {
    timestamps: true,
});

const RefundRequest = mongoose.model('RefundRequest', refundRequestSchema);

export default RefundRequest;
