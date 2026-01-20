import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    ride: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride',
        required: true,
    },
    passenger: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    seatsBooked: {
        type: Number,
        required: true,
        min: 1,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending_approval', 'confirmed', 'cancelled', 'completion_pending'],
        default: 'pending_approval',
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending',
    },
    paymentMode: {
        type: String,
        enum: ['online', 'cash'],
        default: 'online'
    },
    meetingPoint: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number] } // [lng, lat]
    },
    distanceToMeetingPoint: {
        type: Number // in km
    },
    pickupName: { type: String },
    dropoffName: { type: String },
    endRideOtp: {
        type: String,
        // required: true // Make optional for backward compatibility
    },
}, {
    timestamps: true,
});

// Update status enum if needed, though standard string allows 'completed' effectively if not strict or we modify enum
bookingSchema.path('status').enumValues.push('completion_pending');
bookingSchema.path('status').enumValues.push('completed');

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
