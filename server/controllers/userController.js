import User from '../models/User.js';
import admin from '../config/firebaseAdmin.js';
import Review from '../models/Review.js';
import Ride from '../models/Ride.js';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        profilePicture: req.user.profilePicture,
        age: req.user.age,
        gender: req.user.gender,
        isPhoneVerified: req.user.isPhoneVerified,
        emergencyContact: req.user.emergencyContact,
        emergencyContact: req.user.emergencyContact,
        travelPreferences: req.user.travelPreferences,
        bio: req.user.bio,
        isDriver: req.user.isDriver,
        depositPaid: req.user.depositPaid,
        vehicle: req.user.vehicle,
        vehicle: req.user.vehicle,
        paymentDetails: req.user.paymentDetails,
    };
    res.status(200).json(user);
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.age = req.body.age || user.age;
            user.age = req.body.age || user.age;
            user.gender = req.body.gender || user.gender;

            if (req.body.bio !== undefined) {
                user.bio = req.body.bio;
            }

            if (req.body.emergencyContact) {
                user.emergencyContact = req.body.emergencyContact;
            }
            if (req.body.travelPreferences) {
                user.travelPreferences = req.body.travelPreferences;
            }
            if (req.body.profilePicture) {
                user.profilePicture = req.body.profilePicture;
            }

            // Handle Vehicle Update
            if (req.body.vehicle) {
                user.vehicle = {
                    ...user.vehicle, // Keep existing fields if partial update (though usually full obj sent)
                    ...req.body.vehicle
                };

                // If deposit is already paid, check if we can unlock driver role
                if (user.depositPaid && user.vehicle.model && user.vehicle.plateNumber && user.vehicle.capacity) {
                    user.isDriver = true;
                }

                // Propagate vehicle changes to all ACTIVE rides
                try {
                    await Ride.updateMany(
                        { driver: user._id, status: 'active' },
                        {
                            $set: {
                                'vehicle.model': user.vehicle.model,
                                'vehicle.plateNumber': user.vehicle.plateNumber,
                                'vehicle.color': user.vehicle.color,
                                'vehicle.capacity': user.vehicle.capacity
                            }
                        }
                    );
                } catch (rideUpdateError) {
                    console.error("Failed to update active rides with new vehicle info", rideUpdateError);
                    // Continue, don't fail the profile update just because rides couldn't be updated
                }
            }

            // Handle Payment Details Update
            if (req.body.paymentDetails) {
                user.paymentDetails = {
                    ...user.paymentDetails,
                    ...req.body.paymentDetails
                };
            }

            if (req.body.password) {
                user.password = req.body.password;
            }

            // Handle Phone Update or Verification
            if (req.body.phone) {
                // If token is provided, verify the phone number
                if (req.body.phoneVerificationToken) {
                    try {
                        const decodedToken = await admin.auth().verifyIdToken(req.body.phoneVerificationToken);
                        if (decodedToken.phone_number !== req.body.phone) {
                            res.status(400).json({ message: 'Phone number verification failed' });
                            return;
                        }
                        user.phone = req.body.phone;
                        user.isPhoneVerified = true;
                    } catch (error) {
                        console.error('Firebase Token Error:', error);
                        res.status(401).json({ message: 'Invalid phone verification token' });
                        return;
                    }
                }
                // If no token but phone changed, update it and set unverified
                else if (req.body.phone !== user.phone) {
                    user.phone = req.body.phone;
                    user.isPhoneVerified = false;
                }
            }

            const updatedUser = await user.save();

            res.status(200).json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                role: updatedUser.role,
                profilePicture: updatedUser.profilePicture,
                age: updatedUser.age,
                gender: updatedUser.gender,
                emergencyContact: updatedUser.emergencyContact,
                emergencyContact: updatedUser.emergencyContact,
                travelPreferences: updatedUser.travelPreferences,
                bio: updatedUser.bio,
                isPhoneVerified: updatedUser.isPhoneVerified,
                isDriver: updatedUser.isDriver,
                depositPaid: updatedUser.depositPaid,
                vehicle: updatedUser.vehicle,
                depositPaid: updatedUser.depositPaid,
                vehicle: updatedUser.vehicle,
                paymentDetails: updatedUser.paymentDetails,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('SERVER ERROR in updateUserProfile:', error); // Debug log
        if (error.code === 11000) {
            res.status(400).json({ message: 'Phone number or email already in use' });
        } else {
            res.status(500).json({ message: 'Server Error', error: error.message, stack: error.stack });
        }
    }
};

// @desc    Upload profile picture
// @route   POST /api/users/profile/upload-photo
// @access  Private
const uploadProfilePhoto = (req, res) => {
    if (req.file && req.file.path) {
        res.status(200).json({ url: req.file.path });
    } else {
        res.status(400).json({ message: 'Image upload failed' });
    }
};

// @desc    Upload QR Code
// @route   POST /api/users/profile/upload-qr
// @access  Private
const uploadQrCode = (req, res) => {
    if (req.file && req.file.path) {
        res.status(200).json({ url: req.file.path });
    } else {
        res.status(400).json({ message: 'QR Code upload failed' });
    }
};

// @desc    Get public user profile (for drivers/passengers to view each other)
// @route   GET /api/users/:id/public
// @access  Private (Protected)
const getPublicProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -email -phone -firebaseUid -emergencyContact');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Calculate Average Rating
        const reviews = await Review.find({ reviewee: user._id });
        const avgRating = reviews.length > 0
            ? reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length
            : 0;

        const publicProfile = {
            _id: user._id,
            name: user.name,
            profilePicture: user.profilePicture,
            isVerified: user.isVerified,
            isPhoneVerified: user.isPhoneVerified,
            createdAt: user.createdAt,
            // Driver Specifics
            isDriver: user.isDriver,
            vehicle: user.isDriver ? user.vehicle : null, // Only share vehicle if driver
            // Preferences
            gender: user.gender, // Relevant for safety
            gender: user.gender, // Relevant for safety
            travelPreferences: user.travelPreferences,
            bio: user.bio,
            // Stats
            avgRating: avgRating.toFixed(1),
            totalRides: reviews.length, // Rough proxy for now, or count query
        };

        res.json(publicProfile);
    } catch (error) {
        console.error('SERVER ERROR in getPublicProfile:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
// @desc    Toggle Deposit (Simulate Pay/Withdraw)
// @route   PUT /api/users/profile/deposit
// @access  Private
const toggleDeposit = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Toggle status
        user.depositPaid = !user.depositPaid;

        // Sync isDriver status with deposit
        if (user.depositPaid) {
            user.isDriver = true;
        } else {
            user.isDriver = false;
        }

        await user.save();
        res.json({
            success: true,
            depositPaid: user.depositPaid,
            isDriver: user.isDriver,
            message: user.depositPaid ? "Deposit Paid. You are now a Driver!" : "Deposit Withdrawn. Driver access revoked."
        });
    } catch (error) {
        console.error("Toggle Deposit Error", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export { getUserProfile, updateUserProfile, uploadProfilePhoto, uploadQrCode, getPublicProfile, toggleDeposit };
