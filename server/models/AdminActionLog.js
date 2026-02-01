import mongoose from 'mongoose';

const adminActionLogSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    actionType: {
        type: String,
        required: true,
        // Examples: 'BLOCK_USER', 'UNBLOCK_USER', 'APPROVE_REFUND', 'REJECT_REFUND', 'CREATE_ANNOUNCEMENT', 'RESOLVE_REPORT'
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        // Dynamic reference not easily possible with strict population unless we use refPath, 
        // but for logging usually just storing the ID is enough.
        // Or we can just store it as a generic ObjectId.
    },
    targetModel: {
        type: String,
        // 'User', 'Ride', 'RefundRequest', etc. helping identify what targetId refers to.
    },
    reason: {
        type: String,
    },
    details: {
        type: Object, // detailed changes or snapshot
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
});

const AdminActionLog = mongoose.model('AdminActionLog', adminActionLogSchema);

export default AdminActionLog;
