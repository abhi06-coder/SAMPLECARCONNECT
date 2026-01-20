import mongoose from 'mongoose';

const commuteTemplateSchema = new mongoose.Schema({
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: { type: String, default: 'My Commute' }, // e.g. "Work to Home"
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
    // Store route details so we can recreate the ride accurately
    routePolyline: { type: String },
    routePath: { type: [[Number]] }, // Array of [lng, lat]
    bounds: {
        northeast: { lat: Number, lng: Number },
        southwest: { lat: Number, lng: Number }
    },
    time: {
        type: String,
        required: true
    }, // HH:MM format (24h)
    daysOfWeek: [{
        type: Number,
        min: 0,
        max: 6
    }], // 0=Sun, 1=Mon...
    price: { type: Number, required: true },
    totalSeats: { type: Number, required: true },
    vehicle: {
        model: { type: String, required: true },
        plateNumber: { type: String, required: true },
        capacity: { type: Number, required: true },
    },
    visibility: {
        type: String,
        enum: ['public', 'community'],
        default: 'public',
    },
    communityId: { type: String },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

const CommuteTemplate = mongoose.model('CommuteTemplate', commuteTemplateSchema);

export default CommuteTemplate;
