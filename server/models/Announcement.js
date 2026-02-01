import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    targetRoles: [{
        type: String,
        enum: ['user', 'driver', 'all'], // Assuming 'user' includes everyone or specific roles
    }],
    targetRegions: [{
        type: String, // State or District names
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
});

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;
