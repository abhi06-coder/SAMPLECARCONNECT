import mongoose from 'mongoose';

const rideSchema = new mongoose.Schema({
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    source: {
        name: { type: String, required: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },
    destination: {
        name: { type: String, required: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },
    // GeoJSON for geospatial queries
    sourceLocation: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number] } // [lng, lat]
    },
    destLocation: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number] } // [lng, lat]
    },
    routePath: {
        type: { type: String, default: 'LineString' },
        coordinates: { type: [[Number]] } // Array of [lng, lat]
    },
    routePolyline: { type: String },
    bounds: {
        northeast: {
            lat: { type: Number },
            lng: { type: Number }
        },
        southwest: {
            lat: { type: Number },
            lng: { type: Number }
        }
    },
    waypoints: [
        {
            name: { type: String },
            lat: { type: Number },
            lng: { type: Number },
        }
    ],
    // Segment-Based Seat Management (10km Virtual Grid)
    stops: [{
        name: { type: String },
        lat: { type: Number },
        lng: { type: Number },
        stopIndex: { type: Number }
    }],
    segmentAvailability: {
        type: [mongoose.Schema.Types.Mixed], // Changed to Mixed to support {index, seats} objects while keeping legacy [Number] compat
        default: []
    },
    totalDistance: { type: Number }, // In km
    ratePerKm: { type: Number }, // Price per km
    dateTime: {
        type: Date,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    totalSeats: {
        type: Number,
        required: true,
    },
    availableSeats: {
        type: Number,
        required: true,
    },
    vehicle: {
        model: { type: String, required: true },
        plateNumber: { type: String, required: true },
        color: { type: String },
        capacity: { type: Number, required: true }, // Total seats in the car
    },
    visibility: {
        type: String,
        enum: ['public', 'community'],
        default: 'public',
    },
    communityId: {
        type: String, // Or ObjectId if we have a Community model, using String for now as per prompt ambiguity
        required: false,
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'completed', 'cancelled'],
        default: 'active', // Will be set to 'draft' initially in controller
    },
    razorpayOrderId: {
        type: String,
    },
    isDepositPaid: {
        type: Boolean,
        default: false,
    },
    commitmentFee: {
        type: Number,
        default: 100,
    },
    reminderSent: {
        type: Boolean,
        default: false,
    },
    waitlist: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            joinedAt: { type: Date, default: Date.now }
        }
    ]
}, {
    timestamps: true,
});

// Add Geospatial Indexes
rideSchema.index({ sourceLocation: '2dsphere' });
rideSchema.index({ destLocation: '2dsphere' });
rideSchema.index({ routePath: '2dsphere' });

const Ride = mongoose.model('Ride', rideSchema);

export default Ride;
