import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import RatePassengers from '../components/RatePassengers';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const ManageRide = () => {
    const { rideId } = useParams();
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const bookingsRef = useRef([]);
    const [ride, setRide] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [usersToRate, setUsersToRate] = useState([]);

    useEffect(() => {
        bookingsRef.current = bookings;
    }, [bookings]);

    const fetchRideDetails = async () => {
        try {
            const config = { withCredentials: true };
            const [rideRes, bookingsRes] = await Promise.all([
                api.get(`/rides/${rideId}`),
                api.get(`/bookings/ride/${rideId}`)
            ]);

            setRide(rideRes.data);
            setBookings(bookingsRes.data);
        } catch (error) {
            console.error("Error fetching ride details", error);
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (rideId) fetchRideDetails();
    }, [rideId, navigate]);

    // Socket Connection
    useEffect(() => {
        if (!rideId) return;

        const SOCKET_URL = process.env.REACT_APP_API_URL
            ? process.env.REACT_APP_API_URL.replace('/api', '')
            : 'http://localhost:5000';

        const newSocket = io(SOCKET_URL, { withCredentials: true });

        newSocket.on('connect', () => {
            console.log('Socket connected for ManageRide');
            newSocket.emit('join_ride', rideId); // Using join_ride as per server index.js
        });

        newSocket.on('booking_confirmed_by_passenger', (data) => {
            console.log('Final completion confirmed by passenger:', data);
            fetchRideDetails();

            // Trigger Rating Modal
            const confirmedBooking = bookingsRef.current.find(b => b._id === data.bookingId);
            if (confirmedBooking) {
                setUsersToRate([confirmedBooking.passenger]);
                setShowRatingModal(true);
            }
        });

        setSocket(newSocket);
        return () => newSocket.disconnect();
    }, [rideId]);

    const handleBookingStatus = async (bookingId, status) => {
        try {

            await api.put(`/bookings/${bookingId}/status`, { status });
            setBookings(bookings.map(b => b._id === bookingId ? { ...b, status } : b));
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const handleCompleteBooking = async (bookingId) => {
        const otp = window.prompt("Enter the 6-digit End Ride Code provided by the passenger:");
        if (!otp) return;

        try {
            const { data } = await api.put(`/bookings/${bookingId}/complete`, { otp });

            // Update local state
            setBookings(bookings.map(b => b._id === bookingId ? { ...b, status: 'completed' } : b));
            alert("Booking marked as completed!");

            // Trigger Rating for this passenger immediately
            const completedBooking = bookings.find(b => b._id === bookingId);
            if (completedBooking && completedBooking.passenger) {
                setUsersToRate([completedBooking.passenger]);
                setShowRatingModal(true);
            }

        } catch (error) {
            console.error("Complete booking error", error);
            alert(error.response?.data?.message || "Failed to complete booking. Check OTP.");
        }
    };

    const handleEndRide = async () => {
        // Check for active passengers
        const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'paid' || b.status === 'completion_pending');
        if (activeBookings.length > 0) {
            alert(`You cannot end the ride yet. ${activeBookings.length} passenger(s) have not fully completed their bookings. Ensure OTP is verified and passengers have confirmed completion.`);
            return;
        }

        if (!window.confirm("Are you sure you want to end this ride?")) return;

        try {
            await api.put(`/rides/${rideId}/status`, { status: 'completed' });

            alert("Ride Ended Successfully.");
            navigate('/dashboard');

            setRide(prev => ({ ...prev, status: 'completed' }));
        } catch (error) {
            console.error("End ride error", error);
            alert("Failed to end ride");
        }
    };

    if (loading) return <div className="min-h-screen bg-background pt-20 flex justify-center"><LoadingSpinner size="lg" /></div>;
    if (!ride) return <div className="text-center pt-20 text-text-muted">Ride not found</div>;

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 pb-24">
            <div className="container mx-auto max-w-4xl">

                {showRatingModal && (
                    <RatePassengers
                        rideId={rideId}
                        usersToRate={usersToRate}
                        userRole="driver"
                        onClose={() => {
                            setShowRatingModal(false);
                            navigate('/dashboard');
                        }}
                    />
                )}

                {/* Header / Back */}
                <Button
                    onClick={() => navigate('/dashboard')}
                    variant="ghost"
                    className="mb-8 text-text-muted hover:text-primary transition-colors pl-0 hover:bg-transparent"
                    leftIcon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>}
                >
                    Back to Dashboard
                </Button>

                {/* Ride Summary Card */}
                <Card className="mb-8 overflow-hidden relative border-none shadow-xl">
                    <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
                        <div className="space-y-2">
                            <Badge variant={ride.status === 'active' ? 'success' : 'neutral'}>
                                {ride.status}
                            </Badge>
                            <h1 className="text-3xl font-bold font-heading text-text flex flex-wrap items-center gap-3">
                                <span className="truncate max-w-[200px] md:max-w-xs" title={ride.source.name}>{ride.source.name.split(',')[0]}</span>
                                <span className="text-text-muted">→</span>
                                <span className="truncate max-w-[200px] md:max-w-xs" title={ride.destination.name}>{ride.destination.name.split(',')[0]}</span>
                            </h1>
                        </div>
                        <div className="flex flex-col items-end gap-3 min-w-[150px]">
                            <div className="text-right">
                                <p className="text-4xl font-bold text-primary tracking-tight">₹{ride.price}</p>
                                <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Per Seat</p>
                            </div>

                            {/* End Ride Button */}
                            {ride.status === 'active' && (
                                <Button
                                    onClick={handleEndRide}
                                    variant="primary"
                                    className="bg-error hover:bg-error/90 border-error shadow-lg shadow-error/25 w-full md:w-auto"
                                >
                                    End Ride
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm bg-neutral/30 p-6 rounded-2xl relative z-10 backdrop-blur-sm border border-border/50">
                        <div>
                            <p className="text-xs text-text-muted uppercase font-bold mb-1.5 tracking-wider">Date</p>
                            <p className="font-bold text-lg text-text">{new Date(ride.dateTime).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted uppercase font-bold mb-1.5 tracking-wider">Time</p>
                            <p className="font-bold text-lg text-text">{new Date(ride.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted uppercase font-bold mb-1.5 tracking-wider">Seats</p>
                            <p className="font-bold text-lg text-text">{ride.availableSeats} Available</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted uppercase font-bold mb-1.5 tracking-wider">Vehicle</p>
                            <p className="font-bold text-text truncate">{ride.vehicle ? `${ride.vehicle.model}` : 'N/A'}</p>
                        </div>
                    </div>
                </Card>

                {/* Passenger List */}
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-2xl font-bold text-text">Passengers & Bookings</h2>
                    <Badge variant="neutral" className="text-base px-2.5 py-0.5">{bookings.length}</Badge>
                </div>

                {bookings.length === 0 ? (
                    <div className="bg-surface p-12 rounded-3xl border-2 border-dashed border-border text-center">
                        <div className="w-16 h-16 bg-neutral rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🪑</div>
                        <p className="text-lg font-bold text-text mb-1">No bookings yet</p>
                        <p className="text-text-muted">Requests will appear here once passengers book your ride.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {bookings.map(booking => (
                            <motion.div
                                key={booking._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="p-6 overflow-visible hover:border-primary/30 transition-colors">
                                    <div className="flex flex-col lg:flex-row gap-8 justify-between">
                                        {/* Passenger Info */}
                                        <div className="flex items-start gap-5 min-w-[300px]">
                                            <div className="relative">
                                                <img src={booking.passenger.profilePicture || `https://ui-avatars.com/api/?name=${booking.passenger.name}&background=random`} alt={booking.passenger.name} className="w-16 h-16 rounded-2xl object-cover shadow-sm ring-2 ring-surface" />
                                                <div className="absolute -bottom-2 -right-2 bg-surface rounded-lg shadow-sm px-1.5 py-0.5 text-xs font-bold border border-border">⭐ {booking.passenger.avgRating ? booking.passenger.avgRating.toFixed(1) : 'New'}</div>
                                            </div>
                                            <div>
                                                <Link to={`/driver/${booking.passenger._id}`} className="font-bold text-xl text-text hover:text-primary transition-colors mb-1 block">
                                                    {booking.passenger.name}
                                                </Link>
                                                <p className="text-sm text-text-muted mb-3">{booking.passenger.gender || 'Passenger'}</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {booking.passenger.travelPreferences?.length > 0 ? (
                                                        booking.passenger.travelPreferences.slice(0, 3).map((pref, i) => (
                                                            <Badge key={i} variant="secondary" size="sm" className="bg-neutral text-text-muted border-transparent">{pref}</Badge>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-text-muted italic">No preferences</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Trip Details */}
                                        <div className="flex-1 bg-neutral/30 p-5 rounded-2xl border border-border/50">
                                            <div className="flex justify-between items-center mb-4">
                                                <Badge variant={
                                                    booking.status === 'confirmed' ? 'success' :
                                                        booking.status === 'completion_pending' ? 'warning' :
                                                            booking.status === 'pending_approval' ? 'warning' :
                                                                booking.status === 'completed' ? 'primary' :
                                                                    'error'
                                                }>
                                                    {booking.status === 'completion_pending' ? 'Waiting for Confirmation' : booking.status.replace('_', ' ')}
                                                </Badge>
                                                <span className="font-bold text-xl text-primary">₹{booking.totalPrice}</span>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-text-muted font-medium">From</span>
                                                    <span className="font-bold text-text text-right max-w-[200px] truncate">
                                                        {momentPickupName(booking)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-text-muted font-medium">To</span>
                                                    <span className="font-bold text-text text-right max-w-[200px] truncate">
                                                        {momentDropoffName(booking)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm pt-3 border-t border-border/50 mt-3">
                                                    <span className="text-text-muted font-medium">Seats Booked</span>
                                                    <span className="font-bold text-text">{booking.seatsBooked} Seat(s)</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col justify-center gap-3 w-full lg:w-[180px]">
                                            {booking.status === 'pending_approval' && (
                                                <>
                                                    <Button onClick={() => handleBookingStatus(booking._id, 'confirmed')} variant="primary" className="bg-success hover:bg-success-hover border-success w-full">Accept</Button>
                                                    <Button onClick={() => handleBookingStatus(booking._id, 'cancelled')} variant="outline" className="text-error hover:bg-error/5 border-error/30 w-full">Reject</Button>
                                                </>
                                            )}
                                            {booking.status === 'confirmed' && (
                                                <>
                                                    <a href={`tel:${booking.passenger.phone}`} className="w-full">
                                                        <Button variant="outline" fullWidth leftIcon={<span>📞</span>}>
                                                            Call
                                                        </Button>
                                                    </a>

                                                    <Button
                                                        onClick={() => navigate(`/tracking/${rideId}`)}
                                                        variant="ghost"
                                                        fullWidth
                                                        className="text-blue-600 hover:bg-blue-50"
                                                    >
                                                        Track Live 📍
                                                    </Button>

                                                    <Button
                                                        onClick={() => handleCompleteBooking(booking._id)}
                                                        variant="primary"
                                                        fullWidth
                                                        className="bg-success hover:bg-success-hover border-success shadow-success/20"
                                                    >
                                                        Complete
                                                    </Button>
                                                </>
                                            )}
                                            {booking.status === 'cancelled' && (
                                                <div className="w-full h-full flex items-center justify-center bg-neutral/50 rounded-xl text-text-muted font-bold text-sm uppercase tracking-wider border border-border">
                                                    Cancelled
                                                </div>
                                            )}
                                            {booking.status === 'completed' && (
                                                <div className="w-full h-full flex items-center justify-center bg-success/10 rounded-xl text-success font-bold text-sm uppercase tracking-wider border border-success/20">
                                                    Completed
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper for Display Names (handling updated legacy logic)
const momentPickupName = (booking) => booking.pickupName || booking.ride?.source?.name?.split(',')[0] || 'Start';
const momentDropoffName = (booking) => booking.dropoffName || booking.ride?.destination?.name?.split(',')[0] || 'End';

export default ManageRide;
