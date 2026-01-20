import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const Payment = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    const handlePayment = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setError('');

        // Simulate network delay for payment processing
        setTimeout(async () => {
            try {
                await api.put(`/bookings/${bookingId}/pay`);
                alert("Payment Successful!");
                navigate('/my-bookings');
            } catch (err) {
                setError(err.response?.data?.message || "Payment failed");
                setProcessing(false);
            }
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-success/5 rounded-full blur-3xl pointer-events-none -ml-24 -mb-24"></div>

            <Card className="w-full max-w-md animate-fade-in relative overflow-hidden border-none shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-success to-primary"></div>

                <div className="text-center mb-8 pt-4">
                    <h2 className="text-2xl md:text-3xl font-bold font-heading text-text">Secure Payment</h2>
                    <p className="text-text-muted mt-1 text-sm">Complete your booking securely</p>
                </div>

                <div className="bg-primary/5 p-4 rounded-xl mb-8 flex items-start gap-3 border border-primary/10">
                    <div className="text-xl">🔒</div>
                    <div>
                        <p className="font-bold text-sm text-primary mb-0.5">Mock Payment Gateway</p>
                        <p className="text-xs text-text-muted">No real money will be deducted. Enter any dummy details.</p>
                    </div>
                </div>

                {error && <p className="bg-error/10 text-error p-3 rounded-xl mb-6 text-sm font-medium border border-error/20 flex items-center justify-center"><span className="mr-2">⚠</span>{error}</p>}

                <form onSubmit={handlePayment} className="space-y-6">
                    <Input
                        label="Card Number"
                        placeholder="0000 0000 0000 0000"
                        className="font-mono"
                        required
                        fullWidth
                    />

                    <div className="flex gap-4">
                        <Input
                            label="Expiry"
                            placeholder="MM/YY"
                            className="text-center"
                            required
                            fullWidth
                        />
                        <Input
                            label="CVV"
                            placeholder="123"
                            className="text-center"
                            required
                            fullWidth
                        />
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            isLoading={processing}
                            variant="primary"
                            fullWidth
                            size="lg"
                            className="bg-success hover:bg-success-hover border-success shadow-lg shadow-success/20"
                        >
                            {processing ? 'Processing...' : 'Pay Now'}
                        </Button>
                    </div>
                </form>

                <div className="mt-6 text-center">
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>Cancel Payment</Button>
                </div>
            </Card>
        </div>
    );
};

export default Payment;
