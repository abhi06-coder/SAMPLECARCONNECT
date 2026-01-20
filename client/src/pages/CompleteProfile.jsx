import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const CompleteProfile = () => {
    const { user, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        phone: '',
        age: '',
        gender: 'Male',
    });
    const [error, setError] = useState('');
    const [step, setStep] = useState('details'); // 'details' | 'otp' | 'otp-failed'
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': (response) => {
                    // reCAPTCHA solved
                },
                'expired-callback': () => {
                    // Response expired
                }
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

        // If phone is empty, save directly
        if (!formData.phone) {
            const result = await updateProfile({ ...user, ...formData });
            if (result.success) {
                navigate('/profile');
            } else {
                setError(result.message);
            }
            setLoading(false);
            return;
        }

        try {
            const appVerifier = window.recaptchaVerifier;
            const confirmation = await signInWithPhoneNumber(auth, formData.phone, appVerifier);
            setConfirmationResult(confirmation);
            setStep('otp');
        } catch (error) {
            console.error("Error sending OTP:", error);
            if (error.code === 'auth/billing-not-enabled') {
                setError("Firebase Billing is not enabled. You can use a Test Number OR Skip Verification.");
            } else {
                setError("Failed to send OTP. Please check the phone number.");
            }
            setStep('otp-failed');
            // Reset reCAPTCHA
            if (window.recaptchaVerifier) {
                // window.recaptchaVerifier.clear(); // Sometimes causes issues if cleared too aggressively
                // window.recaptchaVerifier = null;
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSkippingVerification = async () => {
        setLoading(true);
        const result = await updateProfile({ ...user, ...formData });
        if (result.success) {
            navigate('/profile');
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await confirmationResult.confirm(otp);
            const userResult = result.user;
            const idToken = await userResult.getIdToken();

            const updateResult = await updateProfile({ ...user, ...formData, phoneVerificationToken: idToken });

            if (updateResult.success) {
                navigate('/profile');
            } else {
                setError(updateResult.message);
            }
        } catch (error) {
            console.error("Error verifying OTP:", error);
            setError("Invalid OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 md:p-8 transition-colors duration-300">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl -ml-20 -mb-20"></div>
            </div>

            <Card className="w-full max-w-md animate-fade-in shadow-2xl relative border-none">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-secondary"></div>

                <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center font-heading text-text pt-4">Complete Your Profile</h2>

                {error && (
                    <div className="bg-error/10 text-error p-4 rounded-xl mb-6 text-sm font-medium border border-error/20 flex items-start gap-3">
                        <span className="text-lg">⚠</span>
                        <span>{error}</span>
                    </div>
                )}

                {step === 'details' ? (
                    <form onSubmit={handleSendOtp} className="space-y-6">
                        <Input
                            label="Phone Number (Optional)"
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+91..."
                            fullWidth
                        />
                        <Input
                            label="Age"
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            required
                            fullWidth
                        />
                        <div>
                            <label className="block text-text font-medium text-sm mb-1.5 ml-1">Gender</label>
                            <div className="relative">
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text appearance-none cursor-pointer"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>

                        <div id="recaptcha-container"></div>

                        <Button
                            type="submit"
                            isLoading={loading}
                            variant="primary"
                            fullWidth
                            size="lg"
                            className="mt-2 shadow-lg shadow-primary/20"
                        >
                            {formData.phone ? 'Send OTP & Save' : 'Save & Continue'}
                        </Button>
                    </form>
                ) : step === 'otp' ? (
                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                        <Input
                            label={`Enter OTP sent to ${formData.phone}`}
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="text-center text-2xl tracking-[0.5em] font-mono"
                            placeholder=" • • • • • • "
                            required
                            fullWidth
                            autoFocus
                        />

                        <div className="space-y-3 pt-2">
                            <Button
                                type="submit"
                                isLoading={loading}
                                variant="primary"
                                fullWidth
                                size="lg"
                                className="bg-success hover:bg-success-hover border-success shadow-lg shadow-success/20"
                            >
                                Verify & Complete
                            </Button>

                            <div className="flex flex-col gap-2 mt-4">
                                <Button
                                    type="button"
                                    onClick={handleSaveSkippingVerification}
                                    variant="ghost"
                                    fullWidth
                                    className="text-primary hover:bg-primary/5"
                                >
                                    Skip Verification & Save
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setStep('details')}
                                    variant="ghost"
                                    fullWidth
                                    className="text-text-muted hover:text-text"
                                >
                                    Back to Details
                                </Button>
                            </div>
                        </div>
                    </form>
                ) : (
                    // OTP Failed Step
                    <div className="text-center mt-2">
                        <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            ❌
                        </div>
                        <p className="text-text-muted mb-8">We couldn't send the OTP. This might be due to a configuration issue or network problem.</p>
                        <div className="space-y-3">
                            <Button
                                onClick={handleSaveSkippingVerification}
                                variant="primary"
                                fullWidth
                                className="shadow-lg"
                            >
                                Save without Verification
                            </Button>
                            <Button
                                onClick={() => setStep('details')}
                                variant="outline"
                                fullWidth
                            >
                                Try Again
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default CompleteProfile;
