import { useState } from 'react';
import api from '../utils/api';
import Button from './ui/Button';

const DepositButton = ({ onSuccess, className, variant = "primary", size = "lg", label = "Pay Deposit (₹100)" }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await loadRazorpay();
            if (!res) {
                setError('Razorpay SDK failed to load. Are you online?');
                setLoading(false);
                return;
            }

            // 1. Create Order
            const { data: orderData } = await api.post('/payment/create-order');

            if (!orderData.success) {
                throw new Error('Failed to create payment order');
            }

            const options = {
                key: orderData.key,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "CarConnect",
                description: "Driver Security Deposit",
                image: "/vite.svg", // Optional logo
                order_id: orderData.orderId,
                handler: async function (response) {
                    try {
                        const verifyRes = await api.post('/payment/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyRes.data.success) {
                            if (onSuccess) onSuccess();
                        } else {
                            setError('Payment verification failed.');
                        }
                    } catch (err) {
                        console.error("Verification Error", err);
                        setError('Server failed to verify payment.');
                    }
                },
                prefill: {
                    // prefill user data if available
                    // name: "User Name",
                    // email: "user@example.com",
                    // contact: "9999999999"
                },
                notes: {
                    address: "CarConnect Corporate Office"
                },
                theme: {
                    color: "#3399cc"
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

            paymentObject.on('payment.failed', function (response) {
                console.error(response.error);
                setError(`Payment Failed: ${response.error.description || response.error.reason}`);
            });

        } catch (err) {
            console.error("Payment Error", err);
            setError(err.response?.data?.message || 'Something went wrong during payment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {error && <div className="text-error text-sm mb-2">{error}</div>}
            <Button
                onClick={handlePayment}
                isLoading={loading}
                variant={variant}
                size={size}
                className={className}
            >
                {loading ? 'Processing...' : label}
            </Button>
        </>
    );
};

export default DepositButton;
