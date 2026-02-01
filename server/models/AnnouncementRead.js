import mongoose from 'mongoose';

const announcementReadSchema = new mongoose.Schema({
    announcementId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Announcement',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    readAt: {
        type: Date,
        default: Date.now,
    }
}, {
    timestamps: false, // Only need readAt
});

// Compound index to ensure a user only reads an announcement once (or tracks it once)
announcementReadSchema.index({ announcementId: 1, userId: 1 }, { unique: true });

const AnnouncementRead = mongoose.model('AnnouncementRead', announcementReadSchema);

export default AnnouncementRead;
