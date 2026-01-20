import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
    },
    password: {
        type: String,
        // required: true, // Made optional for OAuth users
    },
    firebaseUid: {
        type: String,
        unique: true,
        sparse: true, // Allows null/undefined values to be unique (though unique index ignores them usually, sparse is safer)
    },
    role: {
        type: String,
        enum: ['user', 'driver', 'admin'],
        default: 'user',
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    profilePicture: {
        type: String,
        default: '',
    },
    isPhoneVerified: {
        type: Boolean,
        default: false,
    },
    age: {
        type: Number,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
    },
    emergencyContact: {
        name: { type: String },
        phone: { type: String },
    },
    travelPreferences: [{
        type: String,
        enum: ['No Smoking', 'Women Only', 'Music Friendly', 'Quiet Ride', 'Pet Friendly'],
    }],
    bio: {
        type: String,
        maxlength: 200,
        default: ''
    },
    // New fields for Driver Role & Accountability
    isDriver: {
        type: Boolean,
        default: false,
    },
    depositPaid: {
        type: Boolean,
        default: false,
    },
    vehicle: {
        model: { type: String },
        plateNumber: { type: String },
        capacity: { type: Number },
    },
}, {
    timestamps: true,
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

export default User;
