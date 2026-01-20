import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import ProfilePreviewModal from '../components/ProfilePreviewModal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';

const Profile = () => {
    const { user, updateProfile, logout, uploadProfilePicture, loading } = useAuth();
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        age: '',
        gender: '',
        bio: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        travelPreferences: [],
        profilePicture: '',
        // Vehicle Info (for drivers)
        vehicleModel: '',
        vehiclePlate: '',
        vehicleCapacity: '',
    });

    // UI States
    const [isEditing, setIsEditing] = useState(false);
    const [activeSection, setActiveSection] = useState('details'); // 'details' | 'safety' | 'driver'
    const [showPreview, setShowPreview] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Verification States
    const [isVerifying, setIsVerifying] = useState(false);
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);

    // Initialize Recaptcha
    useEffect(() => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': () => { },
                'expired-callback': () => { }
            });
        }
    }, []);

    // Sync User Data
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                age: user.age || '',
                gender: user.gender || '',
                bio: user.bio || '',
                emergencyContactName: user.emergencyContact?.name || '',
                emergencyContactPhone: user.emergencyContact?.phone || '',
                travelPreferences: user.travelPreferences || [],
                profilePicture: user.profilePicture || '',
                vehicleModel: user.vehicle?.model || '',
                vehiclePlate: user.vehicle?.plateNumber || '',
                vehicleCapacity: user.vehicle?.capacity || '',
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const updateResult = await updateProfile({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                age: formData.age,
                gender: formData.gender,
                bio: formData.bio,
                emergencyContact: {
                    name: formData.emergencyContactName,
                    phone: formData.emergencyContactPhone
                },
                travelPreferences: formData.travelPreferences,
                profilePicture: formData.profilePicture, // Ensure picture link is preserved
                vehicle: {
                    model: formData.vehicleModel,
                    plateNumber: formData.vehiclePlate,
                    capacity: formData.vehicleCapacity
                }
            });

            if (updateResult.success) {
                setMessage("Profile updated successfully");
                setIsEditing(false);
                setTimeout(() => setMessage(''), 3000);
            } else {
                setError(updateResult.message || "Failed to update profile");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update profile");
        }
    };

    // OTP Logic
    const handleSendOtp = async () => {
        setError('');
        setMessage('');
        if (!formData.phone) return setError("Please enter a phone number.");

        try {
            const appVerifier = window.recaptchaVerifier;
            const confirmation = await signInWithPhoneNumber(auth, formData.phone, appVerifier);
            setConfirmationResult(confirmation);
            setIsVerifying(true);
            setMessage("OTP sent to your phone.");
        } catch (error) {
            console.error(error);
            setError(error.code === 'auth/billing-not-enabled' ? "Billing disabled. Use test number." : "Failed to send OTP.");
        }
    };

    const handleVerifyOtp = async () => {
        try {
            const result = await confirmationResult.confirm(otp);
            const idToken = await result.user.getIdToken();
            const updateResult = await updateProfile({ ...formData, phoneVerificationToken: idToken });

            if (updateResult.success) {
                setIsVerifying(false);
                setOtp('');
                setMessage("Phone verified successfully!");
            } else {
                setError(updateResult.message);
            }
        } catch (error) {
            setError("Invalid OTP.");
        }
    };

    const handleDepositToggle = async () => {
        try {
            const res = await api.put('/users/profile/deposit');

            if (res.data.success) {
                setMessage(res.data.message);
                window.location.reload();
            }
        } catch (err) {
            console.error("Deposit Toggle Error", err);
            setError("Failed to update deposit status.");
        }
    };

    // Image Upload
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setMessage('Uploading image...');
        const uploadData = new FormData();
        uploadData.append('profilePicture', file);

        const uploadRes = await uploadProfilePicture(uploadData);

        if (uploadRes.success) {
            setFormData(prev => ({ ...prev, profilePicture: uploadRes.url }));
            setMessage('Image uploaded. Click Save to apply.');
        } else {
            setError(uploadRes.message);
        }
    };

    const togglePreference = (pref) => {
        const current = formData.travelPreferences || [];
        setFormData({
            ...formData,
            travelPreferences: current.includes(pref)
                ? current.filter(p => p !== pref)
                : [...current, pref]
        });
    };

    const TRAVEL_PREFERENCES = ['No Smoking', 'Women Only', 'Music Friendly', 'Quiet Ride', 'Pet Friendly'];

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 relative overflow-hidden pb-24">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

            <div className="max-w-4xl mx-auto relative z-10 pt-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-surface rounded-3xl shadow-xl border border-border overflow-hidden"
                >
                    {/* Header Strip */}
                    <div className="h-28 md:h-32 bg-gradient-to-r from-primary to-secondary relative">
                        <div className="absolute -bottom-10 md:-bottom-12 left-6 md:left-12">
                            <div className="relative group">
                                <div
                                    onClick={() => !isEditing && setShowPreview(true)}
                                    className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-[6px] border-surface bg-neutral overflow-hidden shadow-lg transition-transform ${!isEditing ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}`}
                                >
                                    {formData.profilePicture ? (
                                        <img src={formData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-text-muted text-3xl font-bold bg-neutral">
                                            {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                    )}
                                </div>
                                {isEditing && (
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Profile Header Info */}
                    <div className="pt-14 md:pt-16 px-6 md:px-12 pb-6 md:pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div className="w-full md:w-auto">
                            <h1 className="text-2xl md:text-3xl font-bold font-heading text-text flex items-center gap-2">
                                {user?.name || 'User'}
                                {user?.isPhoneVerified && (
                                    <span className="text-primary bg-primary/10 p-0.5 rounded-full" title="Verified">
                                        <svg className="w-4 h-4 md:w-5 md:h-5 block" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    </span>
                                )}
                            </h1>
                            <p className="text-text-muted mt-1 text-sm md:text-base">Manage your identity, safety details, and preferences.</p>

                            {/* Badges */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                {user?.isDriver ? (
                                    <Badge variant="success">Active Driver</Badge>
                                ) : (
                                    <Badge variant="neutral">Passenger</Badge>
                                )}
                                {user?.depositPaid && (
                                    <Badge variant="primary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">🛡️ Deposit Paid</Badge>
                                )}
                                {!user?.isPhoneVerified && (
                                    <Badge variant="error" className="animate-pulse">⚠️ Phone Unverified</Badge>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 w-full md:w-auto">
                            <Button
                                onClick={() => setIsEditing(!isEditing)}
                                variant={isEditing ? 'outline' : 'primary'}
                                className={isEditing ? 'bg-background hover:bg-neutral' : ''}
                            >
                                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                            </Button>
                            {!isEditing && (
                                <Button onClick={logout} variant="ghost" className="text-error hover:bg-error/10 hover:text-error">
                                    Logout
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Messages */}
                    <AnimatePresence>
                        {message && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-6 md:px-12 mb-6">
                                <div className="bg-success/10 text-success p-3 rounded-xl border border-success/20 flex items-center text-sm font-medium"><span className="mr-2 text-xl">✓</span>{message}</div>
                            </motion.div>
                        )}
                        {error && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-6 md:px-12 mb-6">
                                <div className="bg-error/10 text-error p-3 rounded-xl border border-error/20 flex items-center text-sm font-medium"><span className="mr-2 text-xl">⚠</span>{error}</div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Content Tabs */}
                    <div className="border-t border-border bg-background/50 backdrop-blur-sm sticky top-0 z-20 px-6 md:px-12 flex gap-8 overflow-x-auto no-scrollbar">
                        {['details', 'safety', 'driver', 'preferences'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveSection(tab)}
                                className={`py-4 font-bold text-sm md:text-base capitalize border-b-2 transition-all whitespace-nowrap ${activeSection === tab ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <div className="p-6 md:p-12 min-h-[400px]">
                        <form onSubmit={handleSubmit}>
                            <AnimatePresence mode="wait">
                                {activeSection === 'details' && (
                                    <motion.div
                                        key="details"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6 max-w-2xl"
                                    >
                                        <h3 className="text-xl font-bold text-text mb-4">Personal Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Input
                                                label="Full Name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                fullWidth
                                            />
                                            <Input
                                                label="Email Address"
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                fullWidth
                                            />

                                            <div>
                                                <div className="flex items-end gap-2">
                                                    <div className="flex-1">
                                                        <Input
                                                            label="Phone Number"
                                                            name="phone"
                                                            value={formData.phone}
                                                            onChange={handleChange}
                                                            disabled={!isEditing || user?.isPhoneVerified}
                                                            fullWidth
                                                        />
                                                    </div>
                                                    {isEditing && !user?.isPhoneVerified && formData.phone && (
                                                        <Button type="button" onClick={handleSendOtp} variant="primary" size="lg" className="h-[50px] mb-[1px]">Verify</Button>
                                                    )}
                                                </div>
                                                {isVerifying && (
                                                    <div className="mt-3 flex gap-2">
                                                        <Input
                                                            value={otp}
                                                            onChange={(e) => setOtp(e.target.value)}
                                                            placeholder="Enter OTP"
                                                            fullWidth
                                                        />
                                                        <Button type="button" onClick={handleVerifyOtp} variant="primary" className="bg-success hover:bg-success-hover border-success">Confirm</Button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bio Field - Full Width */}
                                            <div className="md:col-span-2">
                                                <label className="block text-text font-medium text-sm mb-1.5 px-1">Bio</label>
                                                <textarea
                                                    disabled={!isEditing}
                                                    name="bio"
                                                    value={formData.bio}
                                                    onChange={handleChange}
                                                    maxLength={200}
                                                    rows={3}
                                                    placeholder="Software engineer from Pune, friendly and punctual 🚗"
                                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-text disabled:opacity-60 resize-none transition-all placeholder:text-text-muted/50 outline-none"
                                                />
                                                <div className="flex justify-between mt-1 px-1">
                                                    <span className="text-xs text-text-muted">Visible to passengers</span>
                                                    <span className="text-xs text-text-muted">{formData.bio.length}/200</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-6 md:col-span-2">
                                                <div className="flex-1">
                                                    <Input
                                                        label="Age"
                                                        type="number"
                                                        name="age"
                                                        value={formData.age}
                                                        onChange={handleChange}
                                                        disabled={!isEditing}
                                                        fullWidth
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-text font-medium text-sm mb-1.5 px-1">Gender</label>
                                                    <select
                                                        disabled={!isEditing}
                                                        name="gender"
                                                        value={formData.gender}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-3 h-[50px] bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-text disabled:opacity-60 outline-none transition-all"
                                                    >
                                                        <option value="">Select</option>
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeSection === 'safety' && (
                                    <motion.div
                                        key="safety"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6 max-w-2xl"
                                    >
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-bold text-text">Safety & Emergency</h3>
                                            {!formData.emergencyContactName && <Badge variant="error" className="animate-pulse">Action Required</Badge>}
                                        </div>

                                        <div className="bg-warning/5 border border-warning/20 p-6 rounded-2xl">
                                            <h4 className="font-bold text-warning-dark mb-2 flex items-center gap-2">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                Emergency Contact
                                            </h4>
                                            <p className="text-sm text-text-muted mb-6">This person will be contacted in case of emergency.</p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <Input
                                                    label="Contact Name"
                                                    name="emergencyContactName"
                                                    value={formData.emergencyContactName}
                                                    onChange={handleChange}
                                                    placeholder="e.g. Spouse, Parent"
                                                    disabled={!isEditing}
                                                    fullWidth
                                                />
                                                <Input
                                                    label="Contact Phone"
                                                    type="tel"
                                                    name="emergencyContactPhone"
                                                    value={formData.emergencyContactPhone}
                                                    onChange={handleChange}
                                                    placeholder="+91..."
                                                    disabled={!isEditing}
                                                    fullWidth
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-surface border border-border p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                                            <div>
                                                <h4 className="font-bold text-text">Password & Security</h4>
                                                <p className="text-sm text-text-muted">Manage your password and security settings.</p>
                                            </div>
                                            <Link to="/change-password">
                                                <Button variant="outline">Change Password</Button>
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}

                                {activeSection === 'driver' && (
                                    <motion.div
                                        key="driver"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6 max-w-2xl"
                                    >
                                        <h3 className="text-xl font-bold text-text mb-4">Driver Profile</h3>

                                        {/* DEPOSIT MANAGEMENT */}
                                        <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm mb-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <h4 className="font-bold text-text">Security Deposit</h4>
                                                    <p className="text-sm text-text-muted mt-1">Status:
                                                        <span className={`font-bold ml-2 ${user?.depositPaid ? 'text-success' : 'text-warning'}`}>
                                                            {user?.depositPaid ? 'Paid (Active)' : 'Unpaid (Inactive)'}
                                                        </span>
                                                    </p>
                                                </div>
                                                {user?.depositPaid ? (
                                                    <Button
                                                        type="button"
                                                        onClick={() => {
                                                            if (window.confirm("Are you sure you want to withdraw your deposit? You will effectively stop being a committed driver.")) {
                                                                handleDepositToggle();
                                                            }
                                                        }}
                                                        variant="outline"
                                                        className="text-error border-error/30 hover:bg-error/5 hover:border-error"
                                                    >
                                                        Withdraw
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        onClick={() => navigate('/driver-onboarding')}
                                                        variant="primary"
                                                        className="shadow-lg shadow-primary/20"
                                                    >
                                                        Pay Deposit (₹100)
                                                    </Button>
                                                )}
                                            </div>
                                            <p className="text-xs text-text-muted bg-neutral p-3 rounded-lg border border-border/50">
                                                {user?.depositPaid
                                                    ? "Your deposit is secure. Withdrawing it will revoke your 'Committed Driver' status."
                                                    : "Pay the security deposit to become a Committed Driver and publish rides."}
                                            </p>
                                        </div>

                                        {user?.isDriver ? (
                                            <div className="grid gap-6">
                                                <div className="bg-success/5 border border-success/20 p-6 rounded-2xl flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center text-success flex-shrink-0">
                                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-text">Driver Account Active</h4>
                                                        <p className="text-sm text-text-muted">You can publish rides and accept passengers.</p>
                                                    </div>
                                                </div>

                                                {/* VEHICLE INFORMATION */}
                                                <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm">
                                                    <h4 className="font-bold text-text mb-6">Vehicle Information</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <Input
                                                            label="Model"
                                                            placeholder="e.g. Maruti Swift"
                                                            name="vehicleModel"
                                                            value={formData.vehicleModel}
                                                            onChange={handleChange}
                                                            disabled={!isEditing}
                                                            fullWidth
                                                        />
                                                        <Input
                                                            label="Plate Number"
                                                            placeholder="e.g. MH 12 AB 1234"
                                                            name="vehiclePlate"
                                                            value={formData.vehiclePlate}
                                                            onChange={handleChange}
                                                            disabled={!isEditing}
                                                            fullWidth
                                                        />
                                                        <Input
                                                            label="Capacity"
                                                            type="number"
                                                            placeholder="e.g. 4"
                                                            name="vehicleCapacity"
                                                            value={formData.vehicleCapacity}
                                                            onChange={handleChange}
                                                            disabled={!isEditing}
                                                            fullWidth
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 bg-neutral/30 rounded-3xl border-2 border-dashed border-border p-6">
                                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                                </div>
                                                <h4 className="font-bold text-xl text-text">Become a Driver</h4>
                                                <p className="text-text-muted max-w-sm mx-auto mt-2 mb-8">Start offering rides, save commute costs, and meet new people.</p>
                                                <Link to="/offer-ride">
                                                    <Button variant="primary" size="lg" className="shadow-xl shadow-primary/20">
                                                        Register as Driver
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {activeSection === 'preferences' && (
                                    <motion.div
                                        key="preferences"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6 max-w-2xl"
                                    >
                                        <h3 className="text-xl font-bold text-text mb-2">Travel Preferences</h3>
                                        <p className="text-text-muted mb-6">Select your preferences to help passengers know what to expect.</p>

                                        <div className="flex flex-wrap gap-3">
                                            {TRAVEL_PREFERENCES.map(pref => (
                                                <button
                                                    key={pref}
                                                    type="button"
                                                    disabled={!isEditing}
                                                    onClick={() => togglePreference(pref)}
                                                    className={`px-5 py-3 rounded-full text-sm font-bold transition-all border-2 ${(formData.travelPreferences || []).includes(pref)
                                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                                                        : 'bg-surface text-text-muted border-border hover:border-text-muted'
                                                        } ${!isEditing && 'opacity-80 cursor-default hover:border-border'}`}
                                                >
                                                    {pref}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Floating Save Button */}
                            <AnimatePresence>
                                {isEditing && (
                                    <motion.div
                                        initial={{ y: 100 }}
                                        animate={{ y: 0 }}
                                        exit={{ y: 100 }}
                                        className="fixed bottom-8 right-8 z-40"
                                    >
                                        <Button
                                            type="submit"
                                            isLoading={loading}
                                            variant="primary"
                                            size="lg"
                                            className="rounded-full shadow-2xl shadow-primary/40 px-8 py-4 h-auto text-base"
                                            rightIcon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                        >
                                            Save Changes
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </form>
                    </div>
                </motion.div>

                <div id="recaptcha-container"></div>

                {/* Profile Preview Modal */}
                <ProfilePreviewModal
                    userId={user?._id}
                    isOpen={showPreview}
                    onClose={() => setShowPreview(false)}
                />
            </div >
        </div >
    );
};

export default Profile;
