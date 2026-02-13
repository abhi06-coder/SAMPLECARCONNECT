import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import GeometricBackground from '../components/GeometricBackground';
import GradientText from '../components/GradientText';

const SignUp = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        age: '',
        gender: '',
        travelPreferences: []
    });
    const [error, setError] = useState('');
    const [step, setStep] = useState('register'); // 'register' | 'otp' | 'otp-failed'
    const [shouldVerifyPhone, setShouldVerifyPhone] = useState(true);
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [timer, setTimer] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const otpInputRef = useRef(null);
    const { register, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    // Timer Logic
    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // Focus OTP input
    useEffect(() => {
        if (step === 'otp' && otpInputRef.current) {
            otpInputRef.current.focus();
        }
    }, [step]);

    // Initialize Recaptcha
    useEffect(() => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': (response) => {
                    // reCAPTCHA solved
                },
                'expired-callback': () => { }
            });
        }
        return () => {
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
        };
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (!formData.phone) {
            handleRegisterSkippingVerification();
            return;
        }

        try {
            const appVerifier = window.recaptchaVerifier;
            let formattedPhone = formData.phone;
            if (formattedPhone.length === 10 && !formattedPhone.startsWith('+')) {
                formattedPhone = '+91' + formattedPhone;
            }
            const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            setConfirmationResult(confirmation);
            setStep('otp');
            setTimer(30);
        } catch (error) {
            console.error("Error sending OTP:", error);
            if (error.code === 'auth/billing-not-enabled') {
                setError("Billing not enabled. Proceeding without verification.");
                setTimeout(() => handleRegisterSkippingVerification(), 2000);
                return;
            } else if (error.code === 'auth/invalid-app-credential') {
                console.error("Firebase Domain Error: Add this domain to Firebase Console -> Auth -> Settings -> Authorized Domains");
                setError("Domain not authorized. Check Firebase Console > Auth > Authorized Domains.");
                setStep('otp-failed');
            } else {
                setError("Failed to send OTP. Please check the phone number.");
                setStep('otp-failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (timer > 0) return;
        await handleSendOtp({ preventDefault: () => { } });
    };

    const handleRegisterSkippingVerification = async () => {
        setLoading(true);
        const result = await register(formData);
        if (result.success) {
            setLoading(false);
            setShowSuccess(true);
            setTimeout(() => navigate('/profile'), 2000);
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await confirmationResult.confirm(otp);
            const user = result.user;
            const idToken = await user.getIdToken();

            const registerResult = await register({ ...formData, phoneVerificationToken: idToken });

            if (registerResult.success) {
                setLoading(false);
                setShowSuccess(true);
                setTimeout(() => navigate('/profile'), 2000);
            } else {
                setError(registerResult.message);
                setLoading(false);
            }
        } catch (error) {
            console.error("Error verifying OTP:", error);
            setError("Invalid OTP. Please try again.");
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            const loginResult = await loginWithGoogle(idToken);

            if (loginResult.success) {
                setShowSuccess(true);
                setTimeout(() => {
                    navigate(loginResult.isNewUser ? '/complete-profile' : '/profile');
                }, 1500);
            } else {
                setError(loginResult.message);
            }
        } catch (error) {
            console.error(error);
            setError('Google Sign-Up failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-transparent p-4 relative overflow-y-auto py-10">
            <GeometricBackground />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 w-full max-w-2xl overflow-hidden relative z-10"
            >
                {/* Accent Header */}
                <div className="h-1.5 bg-gradient-to-r from-secondary via-primary to-secondary w-full animate-gradient-x" />

                <div className="p-6 md:p-10">
                    <div className="text-center mb-8">
                        <GradientText
                            colors={["#4F46E5", "#E11D48", "#4F46E5"]}
                            animationSpeed={3}
                            showBorder={false}
                            className="text-3xl font-bold font-heading mb-2"
                        >
                            Create Account
                        </GradientText>
                        <p className="text-text-muted mt-2 text-base">Join CarConnect and travel smarter together</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm mb-6 flex items-start gap-2"
                        >
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            {error}
                        </motion.div>
                    )}

                    {step === 'register' ? (
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            shouldVerifyPhone ? handleSendOtp(e) : handleRegisterSkippingVerification();
                        }} className="space-y-8">

                            {/* Section 1: User Details */}
                            <div className="space-y-5">
                                <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-border pb-2">User Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Input
                                        label="Full Name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        required
                                    />
                                    <Input
                                        label="Email Address"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="name@example.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <Input
                                        label="Phone Number"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+91 98765 43210"
                                        required
                                    />
                                    <div className="mt-2.5 flex items-center ml-1">
                                        <label className="flex items-center cursor-pointer relative group">
                                            <input
                                                type="checkbox"
                                                checked={shouldVerifyPhone}
                                                onChange={(e) => setShouldVerifyPhone(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-9 h-5 bg-neutral rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-success transition-colors"></div>
                                            <span className="ml-2 text-sm text-text-muted group-hover:text-text transition-colors">Verify phone number with OTP (Recommended)</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Emergency Contact */}
                            <div className="space-y-5">
                                <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-border pb-2">Emergency Contact (Required)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Input
                                        label="Contact Name"
                                        name="emergencyContactName"
                                        value={formData.emergencyContactName}
                                        onChange={handleChange}
                                        placeholder="Parent/Spouse Name"
                                        required
                                    />
                                    <div>
                                        <Input
                                            label="Contact Phone"
                                            name="emergencyContactPhone"
                                            value={formData.emergencyContactPhone}
                                            onChange={handleChange}
                                            placeholder="+91..."
                                            required
                                        />
                                        <p className="text-xs text-text-muted mt-1 ml-1">Used for safety features</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Personal Details & Preferences */}
                            <div className="space-y-5">
                                <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-border pb-2">Personal Details</h3>
                                <div className="flex flex-col md:flex-row gap-5 mb-4">
                                    <div className="w-full md:w-1/3">
                                        <Input
                                            label="Age"
                                            name="age"
                                            type="number"
                                            value={formData.age}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="w-full md:w-2/3">
                                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1">Gender</label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-surface border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text text-sm font-medium"
                                            required
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2 ml-1">Travel Preferences</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['No Smoking', 'Women Only', 'Music Friendly', 'Quiet Ride', 'Pet Friendly'].map(pref => (
                                            <button
                                                key={pref}
                                                type="button"
                                                onClick={() => {
                                                    const currentPrefs = formData.travelPreferences || [];
                                                    const newPrefs = currentPrefs.includes(pref)
                                                        ? currentPrefs.filter(p => p !== pref)
                                                        : [...currentPrefs, pref];
                                                    setFormData({ ...formData, travelPreferences: newPrefs });
                                                }}
                                                className={`px-4 py-2Rounded-full text-xs font-bold transition-all border rounded-full ${formData.travelPreferences.includes(pref)
                                                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20 transform scale-105'
                                                    : 'bg-transparent text-text-muted border-border hover:border-primary hover:text-primary'
                                                    }`}
                                            >
                                                {pref}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Security */}
                            <div className="space-y-5">
                                <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-border pb-2">Security</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Input
                                        label="Password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        required
                                        rightIcon={
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="text-text-muted hover:text-text transition-colors focus:outline-none"
                                            >
                                                {showPassword ? (
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                ) : (
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                )}
                                            </button>
                                        }
                                    />
                                    <Input
                                        label="Confirm Password"
                                        name="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                fullWidth
                                size="lg"
                                variant="primary"
                                isLoading={loading}
                            >
                                {shouldVerifyPhone ? 'Send OTP & Register' : 'Create Account'}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="text-center">
                                <span className="bg-primary/10 text-primary p-3 rounded-full inline-block mb-3 animate-pulse-slow">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                </span>
                                <h3 className="text-xl font-bold text-text">Verify Phone Number</h3>
                                <p className="text-text-muted mt-1">Found OTP sent to {formData.phone}</p>
                            </div>

                            <div className="relative">
                                <input
                                    ref={otpInputRef}
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full px-4 py-4 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text text-center text-3xl font-mono tracking-widest letter-spacing-2"
                                    placeholder="• • • • • •"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                fullWidth
                                size="lg"
                                variant="success" // Using success variant directly
                                isLoading={loading}
                                className="bg-success hover:bg-green-600 shadow-green-500/20"
                            >
                                Verify & Complete
                            </Button>

                            <div className="flex gap-3 mt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleResendOtp}
                                    disabled={timer > 0}
                                    className="flex-1"
                                    size="md"
                                >
                                    {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setStep('register')}
                                    className="flex-1"
                                    size="md"
                                >
                                    Change Number
                                </Button>
                            </div>

                            <button
                                type="button"
                                onClick={handleRegisterSkippingVerification}
                                className="w-full text-text-muted hover:text-text font-medium text-sm mt-4 underline decoration-dashed underline-offset-4 transition-colors"
                            >
                                Skip Verification & Register
                            </button>
                        </form>
                    )}

                    {step === 'otp-failed' && (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto text-error">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <p className="text-text font-medium">Verification Failed</p>
                            <p className="text-text-muted text-sm">We couldn't verify your phone number. You can try again or skip for now.</p>

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleRegisterSkippingVerification}
                                    variant="ghost"
                                    className="flex-1 bg-neutral"
                                >
                                    Skip Verification
                                </Button>
                                <Button
                                    onClick={() => setStep('register')}
                                    variant="primary"
                                    className="flex-1"
                                >
                                    Try Again
                                </Button>
                            </div>
                        </div>
                    )}

                    <div id="recaptcha-container"></div>

                    <div className="my-8 flex items-center">
                        <div className="flex-1 border-t border-border"></div>
                        <span className="px-4 text-xs font-bold text-text-muted uppercase tracking-wider">or continue with</span>
                        <div className="flex-1 border-t border-border"></div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        className="w-full bg-white dark:bg-neutral border border-border py-3.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition duration-200 flex items-center justify-center font-bold text-text group shadow-sm"
                    >
                        <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign up with Google
                    </button>

                    <p className="mt-8 text-center text-text-muted text-sm">
                        Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
                    </p>
                </div>
            </motion.div>

            {/* Success Animation Overlay */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-surface p-8 rounded-3xl shadow-2xl text-center max-w-sm mx-4"
                        >
                            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h2 className="text-2xl font-bold text-text">Welcome to CarConnect!</h2>
                            <p className="text-text-muted mt-2">Creating your profile...</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SignUp;
