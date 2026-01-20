import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DriverOnboarding = ({ onSuccess }) => {
    const { user, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [vehicleData, setVehicleData] = useState({
        model: '',
        plateNumber: '',
        capacity: 4
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.depositPaid) {
            if (onSuccess) {
                onSuccess();
            } else {
                navigate('/offer-ride'); // Default fallback redirect
            }
        }
    }, [user, onSuccess, navigate]);

    const handleVehicleChange = (e) => {
        setVehicleData({ ...vehicleData, [e.target.name]: e.target.value });
    };

    const submitVehicleDetails = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await updateProfile({
                vehicle: vehicleData
            });
            if (res.success) {
                setStep(2);
            } else {
                setError(res.message || 'Failed to save vehicle details');
            }
        } catch (err) {
            setError('Error saving vehicle details');
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        setLoading(true);
        setError('');
        try {
            // 1. Create Mock Order
            const { data: orderData } = await api.post('/payment/create-order');

            if (!orderData.success) {
                throw new Error('Failed to initiate payment');
            }

            // 2. SIMULATE RAZORPAY WEBHOOK (In real app, Razorpay server calls this)
            // We trigger the webhook endpoint from client just to demonstrate the flow
            await api.post('/payment/webhook', {
                event: 'mock.payment.success',
                payload: {
                    payment: {
                        entity: {
                            notes: orderData.notes // Contains userId
                        }
                    }
                }
            });

            // 3. Poll or wait for update 
            if (onSuccess) onSuccess();
            window.location.reload();

        } catch (err) {
            console.error(err);
            setError('Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-surface p-8 rounded-2xl shadow-xl border border-border">
            <h2 className="text-2xl font-bold font-heading text-text mb-2">Become a Driver</h2>
            <p className="text-text-muted mb-6">Complete these steps to start offering rides.</p>

            <div className="flex items-center mb-8">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-primary text-white' : 'bg-neutral text-text-muted'}`}>1</div>
                <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-primary' : 'bg-neutral'}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-primary text-white' : 'bg-neutral text-text-muted'}`}>2</div>
            </div>

            {error && <div className="bg-error/10 text-error p-3 rounded-lg mb-4 text-sm">{error}</div>}

            {step === 1 && (
                <form onSubmit={submitVehicleDetails} className="space-y-4">
                    <div>
                        <label className="block text-text font-medium text-sm mb-1">Vehicle Model</label>
                        <input
                            type="text"
                            name="model"
                            value={vehicleData.model}
                            onChange={handleVehicleChange}
                            placeholder="e.g. Maruti Swift"
                            required
                            className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-text font-medium text-sm mb-1">License Plate</label>
                        <input
                            type="text"
                            name="plateNumber"
                            value={vehicleData.plateNumber}
                            onChange={handleVehicleChange}
                            placeholder="e.g. MH 12 AB 1234"
                            required
                            className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-text font-medium text-sm mb-1">Capacity (Seats)</label>
                        <input
                            type="number"
                            name="capacity"
                            value={vehicleData.capacity}
                            onChange={handleVehicleChange}
                            min="1"
                            required
                            className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all mt-4"
                    >
                        {loading ? 'Saving...' : 'Next: Security Deposit'}
                    </button>
                </form>
            )}

            {step === 2 && (
                <div className="text-center space-y-4">
                    <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
                        <p className="text-text font-medium mb-2">Security Deposit Required</p>
                        <h3 className="text-3xl font-bold text-primary">₹100</h3>
                        <p className="text-xs text-text-muted mt-2">Refundable subject to terms.</p>
                    </div>
                    <p className="text-sm text-text-muted">
                        To ensure trust and accountability, we require a nominal deposit from all drivers.
                    </p>
                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full bg-success text-white py-3 rounded-xl font-bold shadow-lg shadow-success/20 hover:bg-success-hover transition-all transform hover:-translate-y-0.5"
                    >
                        {loading ? 'Processing...' : 'Pay & Verify'}
                    </button>
                    <button
                        onClick={() => setStep(1)}
                        className="text-text-muted text-sm hover:text-text transition-colors"
                    >
                        Back to Vehicle Details
                    </button>
                </div>
            )}
        </div>
    );
};

export default DriverOnboarding;
