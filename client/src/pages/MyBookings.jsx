import { useState, useEffect } from 'react';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import RatePassengers from '../components/RatePassengers';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [driverToRate, setDriverToRate] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const { data } = await api.get('/bookings/my-bookings');
                setBookings(data);
            } catch (error) {
                console.error("Error fetching bookings", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    const handleCancel = async (bookingId) => {
        if (!window.confirm("Are you sure you want to cancel this booking?")) return;
        try {

            await api.put(`/bookings/${bookingId}/status`, { status: 'cancelled' });
            setBookings(bookings.map(b => b._id === bookingId ? { ...b, status: 'cancelled' } : b));
        } catch (error) {
            alert("Failed to cancel booking");
        }
    };

    const handleConfirmCompletion = async (bookingId) => {
        try {
            const { data } = await api.post(`/bookings/${bookingId}/confirm-completion`);

            // Update local state
            setBookings(bookings.map(b => b._id === bookingId ? { ...b, status: 'completed' } : b));

            // Find the booking to get driver info
            const booking = bookings.find(b => b._id === bookingId);
            if (booking && booking.ride && booking.ride.driver) {
                setDriverToRate([booking.ride.driver]);
                setSelectedBooking(booking);
                setShowRatingModal(true);
            }

            alert("Ride completion confirmed! Thank you.");
        } catch (error) {
            console.error("Confirm completion error", error);
            alert(error.response?.data?.message || "Failed to confirm ride completion.");
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-background pt-20 flex justify-center">
            <LoadingSpinner size="lg" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 pb-24">
            <div className="container mx-auto max-w-5xl">
                <div className="mb-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold font-heading text-text">My Bookings</h2>
                        <p className="text-text-muted mt-1">Manage your upcoming and past rides.</p>
                    </div>
                    <Link to="/search-rides">
                        <Button variant="primary" className="shadow-lg shadow-primary/20">
                            Find New Ride
                        </Button>
                    </Link>
                </div>

                {bookings.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-surface p-12 rounded-3xl shadow-sm border border-border text-center flex flex-col items-center"
                    >
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-text mb-2">No rides booked yet</h3>
                        <p className="text-text-muted mb-8 max-w-md">Start exploring routes and join your first carpool today. Save money and travel comfortably!</p>
                        <Link to="/search-rides">
                            <Button size="lg" className="shadow-xl">Start Searching</Button>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        <AnimatePresence>
                            {bookings.map((booking) => (
                                <motion.div
                                    key={booking._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                >
                                    <Card className="hover:shadow-lg transition-all border-l-4 overflow-hidden" style={{ borderLeftColor: booking.status === 'confirmed' || booking.status === 'completed' ? 'var(--color-success)' : booking.status.includes('pending') ? 'var(--color-warning)' : 'var(--color-error)' }}>
                                        <div className="p-2 md:p-4">
                                            {!booking.ride ? (
                                                <div className="flex items-center gap-4 text-error">
                                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    <div>
                                                        <h3 className="font-bold text-lg">Ride Unavailable</h3>
                                                        <p className="text-sm opacity-80">This ride has been cancelled by the driver.</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col md:flex-row gap-6 justify-between">
                                                    {/* Left: Route & Date */}
                                                    <div className="flex-1">
                                                        <div className="flex justify-between md:hidden mb-3">
                                                            <Badge variant={
                                                                booking.status === 'confirmed' ? 'success' :
                                                                    booking.status === 'completion_pending' ? 'warning' :
                                                                        booking.status === 'pending_approval' ? 'warning' :
                                                                            booking.status === 'completed' ? 'neutral' :
                                                                                'error'
                                                            }>
                                                                {booking.status.replace('_', ' ')}
                                                            </Badge>
                                                        </div>

                                                        <div className="flex items-center gap-3 mb-4">
                                                            <h3 className="text-xl md:text-2xl font-bold text-text font-heading truncate max-w-[150px] md:max-w-xs" title={booking.pickupName || booking.ride.source.name}>
                                                                {(booking.pickupName || booking.ride.source.name).split(',')[0]}
                                                            </h3>
                                                            <div className="flex-shrink-0 text-text-muted">
                                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                                            </div>
                                                            <h3 className="text-xl md:text-2xl font-bold text-text font-heading truncate max-w-[150px] md:max-w-xs" title={booking.dropoffName || booking.ride.destination.name}>
                                                                {(booking.dropoffName || booking.ride.destination.name).split(',')[0]}
                                                            </h3>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted mb-6">
                                                            <span className="flex items-center gap-1.5 bg-neutral px-2 py-1 rounded-lg border border-border"><span className="text-base">📅</span> {new Date(booking.ride.dateTime).toLocaleDateString()}</span>
                                                            <span className="flex items-center gap-1.5 bg-neutral px-2 py-1 rounded-lg border border-border"><span className="text-base">⏰</span> {new Date(booking.ride.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>

                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-3 bg-neutral/50 px-4 py-2.5 rounded-xl border border-border/50">
                                                                <div className="w-10 h-10 bg-surface rounded-full flex items-center justify-center font-bold text-primary border border-border shadow-sm">
                                                                    {booking.ride.driver.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Driver</p>
                                                                    <p className="font-bold text-text text-sm">{booking.ride.driver.name}</p>
                                                                </div>
                                                            </div>
                                                            {booking.ride.vehicle && (
                                                                <div className="hidden md:block pl-2 border-l border-border">
                                                                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Vehicle</p>
                                                                    <p className="text-sm font-medium text-text">{booking.ride.vehicle.model} • {booking.ride.vehicle.color}</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* OTP Display */}
                                                        {(booking.status === 'confirmed' || booking.status === 'paid' || booking.status === 'active' || booking.status === 'completion_pending') && booking.endRideOtp && (
                                                            <div className="mt-6 bg-primary/5 border border-dashed border-primary rounded-xl p-4 inline-block w-full md:w-auto">
                                                                <div className="flex justify-between items-center gap-8">
                                                                    <div>
                                                                        <p className="text-[10px] uppercase font-bold text-primary tracking-widest mb-0.5">End Ride Code</p>
                                                                        <p className="text-xs text-text-muted">Share with driver upon arrival</p>
                                                                    </div>
                                                                    <span className="text-3xl font-mono font-bold text-primary tracking-[0.2em]">{booking.endRideOtp}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Right: Price & Actions */}
                                                    <div className="flex flex-col items-end justify-between gap-6 border-t md:border-t-0 border-border pt-4 md:pt-0 mt-4 md:mt-0">
                                                        <div className="hidden md:flex flex-col items-end">
                                                            <Badge variant={
                                                                booking.status === 'confirmed' ? 'success' :
                                                                    booking.status === 'completion_pending' ? 'warning' :
                                                                        booking.status === 'pending_approval' ? 'warning' :
                                                                            booking.status === 'completed' ? 'neutral' :
                                                                                'error'
                                                            } className="mb-2">
                                                                {booking.status.replace('_', ' ')}
                                                            </Badge>
                                                            <div className="text-right">
                                                                <p className="text-3xl font-bold text-primary">₹{booking.totalPrice}</p>
                                                                <p className="text-xs text-text-muted font-bold">{booking.seatsBooked} Seat(s)</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-row md:flex-col gap-3 w-full md:w-[150px]">
                                                            {(booking.status === 'confirmed' || booking.status === 'completed' || booking.status === 'completion_pending') && (
                                                                <>
                                                                    {booking.status === 'confirmed' && booking.paymentStatus === 'pending' && (
                                                                        <Link to={`/payment/${booking._id}`} className="flex-1 md:flex-none">
                                                                            <Button variant="primary" fullWidth className="bg-success text-white hover:bg-success-hover border-success">Pay Now</Button>
                                                                        </Link>
                                                                    )}
                                                                    {booking.status === 'confirmed' && (
                                                                        <Link to={`/tracking/${booking.ride._id}`} className="flex-1 md:flex-none">
                                                                            <Button variant="outline" fullWidth>Track 📍</Button>
                                                                        </Link>
                                                                    )}
                                                                    {booking.status === 'completion_pending' && (
                                                                        <Button
                                                                            onClick={() => handleConfirmCompletion(booking._id)}
                                                                            variant="primary"
                                                                            fullWidth
                                                                            className="bg-success hover:bg-success-hover border-success shadow-lg shadow-success/20"
                                                                        >
                                                                            Confirm Arrival
                                                                        </Button>
                                                                    )}
                                                                    {booking.status === 'completed' && booking.paymentStatus === 'paid' && (
                                                                        <Link to={`/leave-review/${booking.ride._id}`} state={{ driverId: booking.ride.driver._id }} className="flex-1 md:flex-none">
                                                                            <Button variant="outline" fullWidth className="border-warning text-warning-dark hover:bg-warning/10">Rate Driver</Button>
                                                                        </Link>
                                                                    )}
                                                                </>
                                                            )}

                                                            {(booking.status === 'pending_approval' || booking.status === 'confirmed') && (
                                                                <Button
                                                                    onClick={() => handleCancel(booking._id)}
                                                                    variant="ghost"
                                                                    className="text-error hover:bg-error/5 hover:text-error dark:hover:bg-error/10 w-full"
                                                                    fullWidth
                                                                >
                                                                    Cancel Booking
                                                                </Button>
                                                            )}
                                                        </div>

                                                        {/* Mobile Price Summary to replace hidden desktop price */}
                                                        <div className="md:hidden w-full flex justify-between items-center bg-neutral/30 p-3 rounded-xl mt-2">
                                                            <span className="text-xs font-bold uppercase text-text-muted">Total Paid</span>
                                                            <span className="text-xl font-bold text-primary">₹{booking.totalPrice}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {showRatingModal && selectedBooking && (
                <RatePassengers
                    rideId={selectedBooking.ride._id || selectedBooking.ride}
                    usersToRate={driverToRate}
                    onClose={() => setShowRatingModal(false)}
                    userRole="passenger"
                />
            )}
        </div>
    );
};

export default MyBookings;
