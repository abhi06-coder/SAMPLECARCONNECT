import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    category: {
        type: String,
        enum: ['Bug', 'Feature', 'General', 'Other'],
        default: 'General',
    },
    message: {
        type: String,
        required: true,
    },
    adminReply: {
        type: String,
    },
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Closed'],
        default: 'Open',
    },
}, {
    timestamps: true,
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
