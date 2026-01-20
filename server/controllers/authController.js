import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, phone, password, phoneVerificationToken, emergencyContactName, emergencyContactPhone, age, gender, travelPreferences } = req.body;

    let isPhoneVerified = false;

    // Verify Firebase Phone Token if provided
    if (phoneVerificationToken) {
        try {
            const decodedToken = await admin.auth().verifyIdToken(phoneVerificationToken);
            if (decodedToken.phone_number !== phone) {
                res.status(400).json({ message: 'Phone number verification failed' });
                return;
            }
            isPhoneVerified = true;
        } catch (error) {
            console.error('Firebase Token Error:', error);
            res.status(401).json({ message: 'Invalid phone verification token' });
            return;
        }
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }

    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
        res.status(400).json({ message: 'Phone number already registered' });
        return;
    }

    const user = await User.create({
        name,
        email,
        phone,
        password,
        age,
        gender,
        travelPreferences,
        emergencyContact: {
            name: emergencyContactName,
            phone: emergencyContactPhone
        },
        isVerified: false, // Email verification is separate if needed
        isPhoneVerified,
    });

    if (user) {
        generateToken(res, user._id);
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isVerified: user.isVerified,
            isPhoneVerified: user.isPhoneVerified,
            age: user.age,
            gender: user.gender,
            emergencyContact: user.emergencyContact,
            travelPreferences: user.travelPreferences,
            profilePicture: user.profilePicture,
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        generateToken(res, user._id);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isVerified: user.isVerified,
            isPhoneVerified: user.isPhoneVerified,
            age: user.age,
            gender: user.gender,
            profilePicture: user.profilePicture,
            emergencyContact: user.emergencyContact,
            travelPreferences: user.travelPreferences,
            isDriver: user.isDriver,
            depositPaid: user.depositPaid,
            vehicle: user.vehicle,
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

    res.cookie('jwt', '', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        expires: new Date(0),
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

import admin from '../config/firebaseAdmin.js';

// @desc    Social Login (Google/Microsoft)
// @route   POST /api/auth/social-login
// @access  Public
const socialLogin = async (req, res) => {
    const { idToken } = req.body;

    try {
        // Verify Firebase Token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid, email, name, picture } = decodedToken;

        // Check if user exists
        let user = await User.findOne({ $or: [{ firebaseUid: uid }, { email }] });
        let isNewUser = false;

        if (user) {
            // Link firebaseUid if not already linked (e.g. user signed up with email/password before)
            if (!user.firebaseUid) {
                user.firebaseUid = uid;
                await user.save();
            }
        } else {
            // Create new user
            user = await User.create({
                name: name || 'User',
                email,
                firebaseUid: uid,
                profilePicture: picture,
                isVerified: true, // Social login emails are verified
            });
            isNewUser = true;
        }

        generateToken(res, user._id);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isVerified: user.isVerified,
            isPhoneVerified: user.isPhoneVerified,
            profilePicture: user.profilePicture,
            age: user.age,
            gender: user.gender,
            emergencyContact: user.emergencyContact,
            travelPreferences: user.travelPreferences,
            isNewUser, // Flag to trigger profile completion on frontend
        });

    } catch (error) {
        console.error('Social Login Error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

export { registerUser, loginUser, logoutUser, socialLogin };
