import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import RatePassengers from '../components/RatePassengers';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const BookingMonitor = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('pending_approval');
    const [socket, setSocket] = useState(null);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [driverToRate, setDriverToRate] = useState([]);

    // useRef to keep track of latest booking state for socket listeners
    const bookingRef = useRef(null);
    const bookingIdRef = useRef(bookingId);

    useEffect(() => {
        bookingRef.current = booking;
    }, [booking]);

    useEffect(() => {
        bookingIdRef.current = bookingId;
    }, [bookingId]);

    // Fetch initial booking status
    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const { data } = await api.get('/bookings/my-bookings');
                const found = data.find(b => b._id === bookingId);
                if (found) {
                    setBooking(found);
                    setStatus(found.status);
                } else {
                    alert("Booking not found");
                    navigate('/search-rides');
                }
            } catch (error) {
                console.error("Fetch booking error", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBooking();
    }, [bookingId, navigate]);

    // Socket Connection and Join Ride Room
    useEffect(() => {
        if (!user) return;

        const SOCKET_URL = process.env.REACT_APP_API_URL
            ? process.env.REACT_APP_API_URL.replace('/api', '')
            : 'http://localhost:5000';

        const newSocket = io(SOCKET_URL, {
            withCredentials: true,
        });

        newSocket.on('connect', () => {
            console.log('Socket Connected');
            newSocket.emit('register_user', user._id);
        });

        newSocket.on('completion_requested', (data) => {
            console.log('Completion Requested:', data);
            if (data.bookingId === bookingIdRef.current) {
                setStatus('completion_pending');
            }
        });

        newSocket.on('booking_status', (data) => {
            console.log('Booking Status Update:', data);
            if (data.booking._id === bookingIdRef.current) {
                setBooking(data.booking);
                setStatus(data.status);
            }
        });

        newSocket.on('booking_completed', (data) => {
            console.log("Passenger received booking_completed:", data);
            if (data.bookingId === bookingIdRef.current) {
                setBooking(prev => ({ ...prev, status: 'completed' }));
                setStatus('completed');

                // Trigger Rating Modal
                // data.driverId is populated from backend now
                if (data.rideId && (data.driverId || bookingRef.current?.ride?.driver)) {
                    setDriverToRate([data.driverId || bookingRef.current.ride.driver]);
                    setShowRatingModal(true);
                }
            }
        });

        newSocket.on('ride_ended', (data) => {
            console.log("Ride Ended Event received by passenger:", data);
            const currentBooking = bookingRef.current;
            const currentRideId = currentBooking?.ride?._id || currentBooking?.ride;

            if (data.rideId === currentRideId) {
                setStatus('completed');
                console.log("Triggering Rating for Driver due to Ride End");
                if (currentBooking?.ride?.driver) {
                    setDriverToRate([currentBooking.ride.driver]);
                    setShowRatingModal(true);
                }
            }
        });

        setSocket(newSocket);

        return () => newSocket.disconnect();
    }, [user]);

    // Join Ride Room whenever booking is loaded or updated
    useEffect(() => {
        if (socket && booking && booking.ride) {
            const rideId = booking.ride._id || booking.ride;
            console.log(`Joining ride room: ${rideId}`);
            socket.emit('join_ride', rideId);
        }
    }, [socket, booking]);

    const handleConfirmCompletion = async () => {
        try {
            await api.post(`/bookings/${bookingId}/confirm-completion`);
            // The final 'booking_completed' socket event will handle the state update and rating modal
        } catch (error) {
            console.error("Confirm completion error", error);
            alert(error.response?.data?.message || "Failed to confirm ride completion.");
        }
    };

    const handlePayMode = async (mode) => {
        if (mode === 'online') {
            navigate(`/payment/${bookingId}`); // Existing flow for online
            return;
        }

        if (mode === 'cash') {
            if (!window.confirm("Confirm Cash Payment? You will pay the driver directly.")) return;
            try {
                // Using existing pay endpoint but with mode
                const { data } = await api.put(`/bookings/${bookingId}/pay`, { paymentMode: 'cash' });
                setBooking(data);
                setStatus(data.status); // Should stay confirmed
                // alert("Payment mode set to Cash.");
            } catch (error) {
                alert("Failed to update payment mode");
            }
        }
    };

    if (loading) return <div className="min-h-screen bg-background pt-20 flex justify-center"><LoadingSpinner size="lg" /></div>;

    if (!booking) return <div className="text-center mt-20 text-text-muted">Booking not found.</div>;

    return (
        <div className="min-h-screen bg-background flex flex-col items-center pt-24 px-4 pb-12">
            <Card className="w-full max-w-lg text-center shadow-xl border-border/60">

                {showRatingModal && booking && booking.ride && (
                    <RatePassengers
                        rideId={booking.ride._id}
                        usersToRate={driverToRate}
                        userRole="passenger"
                        onClose={() => {
                            setShowRatingModal(false);
                            navigate('/my-bookings');
                        }}
                    />
                )}

                <h2 className="text-2xl font-bold mb-8 text-text">Booking Status</h2>

                {/* Status Timeline / Indicator */}
                <div className="flex flex-col items-center gap-6 mb-8 relative">
                    <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-border -z-10"></div>

                    {/* Step 1: Request Sent */}
                    <div className={`flex items-center gap-4 w-full transition-opacity duration-300 ${status === 'pending_approval' ? 'opacity-100' : 'opacity-80'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm z-10 transition-colors ${status === 'pending_approval' ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-success text-white'
                            }`}>
                            {status === 'pending_approval' ? '1' : '✓'}
                        </div>
                        <div className="flex-1 text-left bg-surface p-3 rounded-xl border border-border/50 shadow-sm">
                            <span className="font-bold text-text">Request Sent</span>
                        </div>
                    </div>

                    {/* Step 2: Driver Response */}
                    <div className={`flex items-center gap-4 w-full transition-opacity duration-300 ${status === 'confirmed' || status === 'paid' ? 'opacity-100' : 'opacity-50'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm z-10 transition-colors ${status === 'confirmed' || status === 'paid' ? 'bg-success text-white ring-4 ring-success/20' : status === 'cancelled' ? 'bg-error text-white' : 'bg-neutral text-text-muted'
                            }`}>
                            {status === 'confirmed' || status === 'paid' ? '✓' : status === 'cancelled' ? '✕' : '2'}
                        </div>
                        <div className="flex-1 text-left bg-surface p-3 rounded-xl border border-border/50 shadow-sm">
                            <span className="font-bold text-text">{status === 'cancelled' ? 'Request Rejected' : 'Driver Accepted'}</span>
                        </div>
                    </div>

                    {/* Step 3: Payment */}
                    <div className={`flex items-center gap-4 w-full transition-opacity duration-300 ${status === 'paid' ? 'opacity-100' : 'opacity-50'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm z-10 transition-colors ${status === 'paid' ? 'bg-success text-white ring-4 ring-success/20' : 'bg-neutral text-text-muted'
                            }`}>
                            {status === 'paid' ? '✓' : '3'}
                        </div>
                        <div className="flex-1 text-left bg-surface p-3 rounded-xl border border-border/50 shadow-sm">
                            <span className="font-bold text-text">Payment & Confirmation</span>
                        </div>
                    </div>
                </div>

                {/* Dynamic Content */}
                <div className="bg-neutral/30 p-6 rounded-2xl mb-6 border border-border/50">
                    {status === 'pending_approval' && (
                        <div className="animate-pulse">
                            <p className="text-xl font-bold text-primary mb-2">Waiting for Driver...</p>
                            <p className="text-text-muted text-sm">Reviewing your request.</p>
                        </div>
                    )}

                    {/* End Ride OTP Display */}
                    {(status === 'confirmed' || status === 'paid' || status === 'active') && booking.endRideOtp && (
                        <div className="bg-surface p-5 rounded-xl border border-dashed border-primary/30 mb-6 shadow-sm">
                            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">End Ride Code</p>
                            <div className="text-4xl font-mono font-bold text-primary tracking-[0.2em] mb-2">{booking.endRideOtp}</div>
                            <Badge variant="neutral" size="sm">Share with driver at destination</Badge>
                        </div>
                    )}

                    {status === 'confirmed' && (
                        <div>
                            <p className="text-xl font-bold text-success mb-4">Ride Accepted!</p>
                            {booking.paymentMode ? (
                                <div className="p-5 bg-success/5 rounded-xl border border-success/10">
                                    <p className="text-sm text-text mb-2 font-medium">Payment Mode Confirmed:</p>
                                    <div className={`text-xl font-bold mb-3 ${booking.paymentMode === 'cash' ? 'text-orange-600' : 'text-success'}`}>
                                        {booking.paymentMode === 'cash' ? '💵 Cash Payment' : '💳 Online Payment'}
                                    </div>
                                    <p className="text-xs text-text-muted mb-4">
                                        {booking.paymentMode === 'cash'
                                            ? "Please pay the driver directly upon meeting."
                                            : "Payment processed successfully."}
                                    </p>
                                    <div className="flex gap-2">
                                        {booking.paymentMode === 'online' && (
                                            <Button onClick={() => navigate('/my-bookings')} variant="primary" fullWidth>
                                                Done
                                            </Button>
                                        )}
                                        {booking.paymentMode === 'cash' && (
                                            <Button onClick={() => navigate('/my-bookings')} variant="outline" fullWidth>
                                                Go to My Bookings
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-text-muted text-sm mb-4">How would you like to pay?</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => handlePayMode('online')}
                                            className="py-4 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-primary-hover hover:-translate-y-1 transition-all active:scale-95 flex flex-col items-center justify-center gap-1.5"
                                        >
                                            <span className="text-lg">💳 Online</span>
                                            <span className="text-[10px] font-normal opacity-90 px-2 py-0.5 bg-white/20 rounded-full">Secure</span>
                                        </button>
                                        <button
                                            onClick={() => handlePayMode('cash')}
                                            className="py-4 bg-surface border-2 border-primary text-primary rounded-xl font-bold shadow-sm hover:bg-primary/5 hover:-translate-y-1 transition-all active:scale-95 flex flex-col items-center justify-center gap-1.5"
                                        >
                                            <span className="text-lg">💵 Cash</span>
                                            <span className="text-[10px] font-normal opacity-80 text-text-muted">Pay Driver</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Completion Pending Status */}
                    {status === 'completion_pending' && (
                        <div className="animate-in fade-in zoom-in duration-300 bg-warning/5 p-6 rounded-xl border border-warning/20">
                            <div className="flex justify-center mb-4 text-5xl animate-bounce">👋</div>
                            <p className="text-xl font-bold text-warning-dark mb-2">Confirm Ride Completion</p>
                            <p className="text-text-muted text-sm mb-6">The driver has reached the destination. Please confirm you have arrived safely.</p>

                            <Button
                                onClick={handleConfirmCompletion}
                                variant="primary"
                                fullWidth
                                className="bg-success hover:bg-success-hover border-success shadow-success/25"
                                rightIcon={<span>✅</span>}
                            >
                                Complete & Confirm
                            </Button>
                        </div>
                    )}

                    {/* Add Active Status Support */}
                    {status === 'active' && (
                        <div className="animate-in fade-in zoom-in duration-300">
                            <div className="flex justify-center mb-6">
                                <span className="relative flex h-20 w-20">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-20 w-20 bg-success/10 items-center justify-center border-2 border-success/20">
                                        <span className="text-4xl">🚗</span>
                                    </span>
                                </span>
                            </div>
                            <p className="text-xl font-bold text-success mb-2">Ride in Progress!</p>
                            <p className="text-text-muted text-sm mb-6">Sit back and enjoy your ride.</p>

                            <Button
                                onClick={() => navigate(`/tracking/${booking.ride._id}`)}
                                variant="primary"
                                fullWidth
                                rightIcon={<span>→</span>}
                                className="shadow-lg shadow-primary/25"
                            >
                                Track Driver Live
                            </Button>
                        </div>
                    )}

                    {status === 'cancelled' && (
                        <div>
                            <p className="text-xl font-bold text-error mb-2">Request Declined</p>
                            <p className="text-text-muted text-sm mb-6">The driver is unable to accept your request at this time.</p>
                            <Button
                                onClick={() => navigate('/search-rides')}
                                variant="outline"
                                fullWidth
                            >
                                Search Other Rides
                            </Button>
                        </div>
                    )}

                    {status === 'paid' && (
                        <div>
                            <p className="text-xl font-bold text-success mb-2">Booking Confirmed!</p>
                            <p className="text-text-muted text-sm mb-6">Your seat is locked.</p>
                            <Button
                                onClick={() => navigate('/my-bookings')}
                                variant="primary"
                                fullWidth
                                className="bg-success hover:bg-success-hover border-success"
                            >
                                Go to My Bookings
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            {booking && booking.ride && (
                <div className="w-full max-w-lg mt-6">
                    <Card className="p-4" noPadding>
                        <div className="p-4 bg-neutral/30 border-b border-border">
                            <h4 className="font-bold text-text">Ride Details</h4>
                        </div>
                        <div className="p-4 space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-text-muted">Destination</span>
                                <span className="font-medium text-text">{booking.ride.destination?.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-text-muted">Date & Time</span>
                                <span className="font-medium text-text">{new Date(booking.ride.dateTime).toLocaleString()}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default BookingMonitor;
