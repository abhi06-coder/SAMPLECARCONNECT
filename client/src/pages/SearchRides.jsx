import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleMap, Polyline, Marker, useJsApiLoader } from '@react-google-maps/api';
import { PlaceAutocomplete } from '../components/PlaceAutocomplete';
import ProfilePreviewModal from '../components/ProfilePreviewModal';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';

const libraries = ['places', 'geometry', 'marker'];

const SearchRides = () => {
    const [searchParams, setSearchParams] = useState({
        source: '',
        destination: '',
        date: new Date().toISOString().split('T')[0],
        sourceLat: null,
        sourceLng: null,
        destLat: null,
        destLng: null,
        passengers: 1,
    });
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [selectedRide, setSelectedRide] = useState(null);
    const [decodedPath, setDecodedPath] = useState([]);
    const [previewUserId, setPreviewUserId] = useState(null);
    const [sortBy, setSortBy] = useState('earliest');
    const [showStickyHeader, setShowStickyHeader] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const [hasAlert, setHasAlert] = useState(false); // Alert State

    // Booking Modal State
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [bookingData, setBookingData] = useState({
        ride: null,
        seats: 1,
        paymentMode: 'online', // Default
        meetingPoint: null,
        distanceToMeetingPoint: null
    });

    const resultsRef = useRef(null);
    const searchFormRef = useRef(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries
    });

    // Handle Scroll for Sticky Header
    useEffect(() => {
        const handleScroll = () => {
            if (searchFormRef.current) {
                const rect = searchFormRef.current.getBoundingClientRect();
                setShowStickyHeader(rect.bottom < 60); // Show when form scrolls out of view
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Hide Toast after delay
    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => setShowToast(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setSearchParams({ ...searchParams, [e.target.name]: value });
    };

    const handleSourceSelect = useCallback((place) => {
        setSearchParams(prev => ({
            ...prev,
            source: place.address || place.name,
            sourceLat: place.lat,
            sourceLng: place.lng
        }));
    }, []);

    const handleDestSelect = useCallback((place) => {
        setSearchParams(prev => ({
            ...prev,
            destination: place.address || place.name,
            destLat: place.lat,
            destLng: place.lng
        }));
    }, []);



    // Check for Blocked Status
    const isBlocked = user && (
        user.status === 'HARD_BLOCKED' ||
        (user.status === 'SOFT_BLOCKED' && user.blockedUntil && new Date() < new Date(user.blockedUntil))
    );

    if (isBlocked) {
        return (
            <div className="min-h-screen bg-background pt-20 pb-20 px-4 flex items-center justify-center">
                <div className="max-w-md w-full bg-surface rounded-3xl shadow-xl border border-error p-8 text-center">
                    <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-text mb-3">Access Restricted</h2>
                    <p className="text-text-muted mb-8">
                        {user.status === 'HARD_BLOCKED'
                            ? "Your account has been permanently blocked due to policy violations."
                            : <span>Your account is blocked from searching rides until <strong>{new Date(user.blockedUntil).toLocaleDateString()}</strong>.</span>
                        }
                    </p>
                    <Button fullWidth onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
                </div>
            </div>
        );
    }

    const handleSearch = async (e) => {
        e?.preventDefault();

        // Input Validation
        if (!searchParams.source || !searchParams.destination || !searchParams.date) {
            alert("Please fill in all fields: Source, Destination, and Date.");
            return;
        }

        setLoading(true);
        setSearched(true);
        setRides([]); // Clear previous results while loading

        try {
            const { data } = await api.get('/rides/search', {
                params: searchParams
            });
            setRides(data);
            setShowToast(true);

            // Auto-scroll to results
            setTimeout(() => {
                resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);

        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
        setLoading(false);
    }

    // Check for existing alert when search params change (and are valid)
    useEffect(() => {
        const checkAlert = async () => {
            if (searchParams.source && searchParams.destination && user) {
                try {
                    const { data } = await api.get('/alerts/check', {
                        params: {
                            source: searchParams.source.split(',')[0],
                            destination: searchParams.destination.split(',')[0]
                        }
                    });
                    setHasAlert(data.hasAlert);
                } catch (error) {
                    console.error("Failed to check alert status", error);
                }
            } else {
                setHasAlert(false);
            }
        };
        if (searched && rides.length === 0) { // Only check if searched and no rides? Or always? Better check when showing empty state.
            checkAlert();
        }
    }, [searchParams.source, searchParams.destination, user, searched, rides.length]);

    const handleNotify = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        const source = searchParams.source?.split(',')[0];
        const destination = searchParams.destination?.split(',')[0];

        if (!source || !destination) return;

        try {
            if (hasAlert) {
                // Cancel Alert
                await api.delete('/alerts', {
                    params: { source, destination }
                });
                setHasAlert(false);
                alert("Alert cancelled. You will no longer receive notifications for this route.");
            } else {
                // Create Alert
                await api.post('/alerts/create', {
                    source,
                    destination,
                    date: searchParams.date
                });
                setHasAlert(true);
                alert(`Alert set! We'll SMS you when a ride from ${source} to ${destination} opens up.`);
            }
        } catch (error) {
            alert(error.response?.data?.message || "Failed to update alert");
        }
    };

    const handleBook = (ride, meetingPoint, distanceToMeetingPoint) => {
        if (!user) {
            navigate('/login');
            return;
        }
        setBookingData({
            ride,
            seats: 1,
            paymentMode: 'online',
            meetingPoint,
            distanceToMeetingPoint
        });
        setIsBookingModalOpen(true);
    };

    const confirmBooking = async () => {
        if (!bookingData.ride) return;

        try {
            setLoading(true);
            const { data } = await api.post('/bookings/book', {
                rideId: bookingData.ride._id,
                seatsBooked: Number(bookingData.seats),
                meetingPoint: bookingData.meetingPoint,
                distanceToMeetingPoint: bookingData.distanceToMeetingPoint,
                paymentMode: bookingData.paymentMode,
                pickupIndex: bookingData.ride.pickupIndex,
                dropoffIndex: bookingData.ride.dropoffIndex,
                pickupGridIndex: bookingData.ride.pickupGridIndex,
                dropoffGridIndex: bookingData.ride.dropoffGridIndex,
                pickupName: searchParams.source.split(',')[0],
                dropoffName: searchParams.destination.split(',')[0],
                unitPrice: bookingData.ride.estimatedPrice
            });

            setIsBookingModalOpen(false);
            navigate(`/booking-monitor/${data._id}`);
        } catch (error) {
            alert(error.response?.data?.message || "Booking failed");
            setLoading(false);
        }
    };

    const handleJoinWaitlist = async (rideId) => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            await api.post(`/rides/${rideId}/waitlist`);
            alert("Joined Waitlist! You will be notified via SMS if a seat opens up.");
        } catch (error) {
            alert(error.response?.data?.message || "Failed to join waitlist");
        }
    };

    const handleViewRoute = (ride) => {
        if (selectedRide === ride._id) {
            setSelectedRide(null);
            setDecodedPath([]);
            return;
        }

        if (ride.routePolyline && window.google) {
            const path = google.maps.geometry.encoding.decodePath(ride.routePolyline);
            setDecodedPath(path);
            setSelectedRide(ride._id);
        } else {
            alert("Route details not available for this ride.");
        }
    };

    const handleViewProfile = (userId) => {
        if (!user) {
            alert("Please login to view driver profile");
            navigate('/login');
            return;
        }
        setPreviewUserId(userId);
    };

    // Sort Rides
    const sortedRides = [...rides].sort((a, b) => {
        if (sortBy === 'price_low') return a.price - b.price;
        if (sortBy === 'seats_available') return b.availableSeats - a.availableSeats;
        return new Date(a.dateTime) - new Date(b.dateTime); // Default: Earliest
    });

    // Skeleton Component
    const RideSkeleton = () => (
        <Card className="p-5 animate-pulse">
            <div className="flex gap-4">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-neutral rounded-full"></div>
                    <div className="w-16 h-3 bg-neutral rounded"></div>
                </div>
                <div className="flex-1 space-y-3">
                    <div className="flex justify-between">
                        <div className="w-1/3 h-5 bg-neutral rounded"></div>
                        <div className="w-1/3 h-5 bg-neutral rounded"></div>
                    </div>
                    <div className="w-full h-8 bg-neutral rounded-lg"></div>
                    <div className="flex gap-2">
                        <div className="w-16 h-4 bg-neutral rounded"></div>
                        <div className="w-16 h-4 bg-neutral rounded"></div>
                    </div>
                </div>
            </div>
        </Card>
    );

    if (!isLoaded) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="min-h-screen bg-background pt-8 pb-20 px-4 md:px-8 relative">
            {/* Sticky Context Header */}
            <AnimatePresence>
                {showStickyHeader && searchParams.source && (
                    <motion.div
                        initial={{ y: -100, opacity: 0, scale: 0.98 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -100, opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.4, ease: "circOut" }}
                        className="fixed top-16 left-0 right-0 z-40 bg-surface/80 backdrop-blur-lg border-b border-border shadow-md px-4 py-3 flex items-center justify-between lg:justify-center lg:gap-8"
                    >
                        <div className="flex flex-col items-start lg:items-center">
                            <div className="text-xs font-bold text-primary uppercase tracking-wide mb-0.5">Searching rides</div>
                            <div className="flex items-center gap-2 text-sm font-medium text-text truncate max-w-[70vw] lg:max-w-none">
                                <span className="truncate">{searchParams.source.split(',')[0]}</span>
                                <span className="text-text-muted">→</span>
                                <span className="truncate">{searchParams.destination.split(',')[0]}</span>
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="text-xs uppercase tracking-wider rounded-full"
                        >
                            Modify
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results Updated Toast */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-text text-background px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium whitespace-nowrap"
                    >
                        <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Results updated
                    </motion.div>
                )}
            </AnimatePresence>

            <ProfilePreviewModal
                userId={previewUserId}
                isOpen={!!previewUserId}
                onClose={() => setPreviewUserId(null)}
                onBook={previewUserId ? () => {
                    alert("Please click 'Book Now' on the ride card to proceed.");
                } : undefined}
            />

            {/* Booking Modal */}
            <AnimatePresence>
                {isBookingModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-surface rounded-2xl w-full max-w-md p-6 border border-border shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold text-text mb-4">Request to Book</h3>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1">Seats Required</label>
                                    <select
                                        value={bookingData.seats}
                                        onChange={(e) => setBookingData({ ...bookingData, seats: e.target.value })}
                                        className="w-full px-4 py-3 bg-neutral/50 border border-transparent rounded-xl focus:border-primary focus:bg-background outline-none transition-all"
                                    >
                                        {[...Array(bookingData.ride?.availableSeats || 1)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>{i + 1} Seat{i > 0 && 's'}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-2">Payment Preference</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {bookingData.ride?.driver?.paymentDetails && (bookingData.ride.driver.paymentDetails.upiId || bookingData.ride.driver.paymentDetails.qrCodeUrl) ? (
                                            <button
                                                onClick={() => setBookingData({ ...bookingData, paymentMode: 'online' })}
                                                className={`py-3 rounded-xl font-bold border-2 transition-all flex flex-col items-center gap-1 ${bookingData.paymentMode === 'online' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-text-muted hover:bg-neutral'}`}
                                            >
                                                <span className="text-lg">💳</span>
                                                <span className="text-sm">Online</span>
                                            </button>
                                        ) : (
                                            <button
                                                disabled
                                                className="py-3 rounded-xl font-bold border-2 border-border bg-neutral/50 text-text-muted/50 flex flex-col items-center gap-1 opacity-60 cursor-not-allowed"
                                                title="Driver has not set up online payment"
                                            >
                                                <span className="text-lg">💳</span>
                                                <span className="text-sm">Online (Unavailable)</span>
                                            </button>
                                        )}

                                        <button
                                            onClick={() => setBookingData({ ...bookingData, paymentMode: 'cash' })}
                                            className={`py-3 rounded-xl font-bold border-2 transition-all flex flex-col items-center gap-1 ${bookingData.paymentMode === 'cash' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-border bg-background text-text-muted hover:bg-neutral'}`}
                                        >
                                            <span className="text-lg">💵</span>
                                            <span className="text-sm">Cash</span>
                                        </button>
                                    </div>
                                    <p className="text-xs text-text-muted mt-2">
                                        {bookingData.paymentMode === 'online' ? 'Pay securely via the app after acceptance.' : 'Pay the driver directly upon meeting.'}
                                    </p>

                                    {bookingData.paymentMode === 'online' && bookingData.ride?.driver?.paymentDetails && (
                                        <div className="mt-4 p-4 bg-surface border border-border rounded-xl">
                                            <h4 className="text-sm font-bold text-text mb-2">Driver's Payment Info</h4>
                                            <div className="flex flex-col gap-3">
                                                {bookingData.ride.driver.paymentDetails.upiId && (
                                                    <div className="flex justify-between items-center bg-neutral/50 p-2 rounded-lg">
                                                        <span className="text-xs text-text-muted">UPI ID</span>
                                                        <span className="text-sm font-mono font-bold text-text select-all">{bookingData.ride.driver.paymentDetails.upiId}</span>
                                                    </div>
                                                )}
                                                {bookingData.ride.driver.paymentDetails.qrCodeUrl && (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs text-text-muted">QR Code</span>
                                                        <div className="w-32 h-32 bg-white p-2 rounded-lg border border-border mx-auto">
                                                            <img src={bookingData.ride.driver.paymentDetails.qrCodeUrl} alt="Payment QR" className="w-full h-full object-contain" />
                                                        </div>
                                                        <p className="text-[10px] text-center text-text-muted">Scan to pay</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsBookingModalOpen(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={confirmBooking}
                                    disabled={loading}
                                    isLoading={loading}
                                    className="flex-1"
                                >
                                    Send Request
                                </Button>
                            </div>

                            <div className="mt-4 text-center">
                                <p className="text-xs text-text-muted flex items-center justify-center gap-1">
                                    <svg className="w-3 h-3 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    No payment detected until driver accepts
                                </p>
                                <p className="text-[10px] text-text-muted mt-0.5">Cancel anytime before confirmation.</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search Form */}
            <div ref={searchFormRef} className="max-w-5xl mx-auto relative z-30 transition-all duration-300">
                <div className="mb-8 text-center" >
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl font-bold font-heading text-text tracking-tight mb-2">
                            Find your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">perfect ride</span>
                        </h1>
                        <p className="text-text-muted text-lg max-w-2xl mx-auto">
                            Connect with community, save money, and travel together.
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="bg-surface rounded-2xl shadow-xl border border-border/50 p-6 md:p-8 backdrop-blur-sm"
                >
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                        <div className="md:col-span-6 group">
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1 group-focus-within:text-primary transition-colors">From</label>
                            <div className="relative z-20">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/20"></div>
                                </div>
                                <PlaceAutocomplete
                                    placeholder="Enter pickup city..."
                                    onPlaceSelect={handleSourceSelect}
                                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text font-medium placeholder:text-text-muted/60"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-6 group">
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1 group-focus-within:text-primary transition-colors">To</label>
                            <div className="relative z-10">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <div className="w-2.5 h-2.5 rounded-full bg-secondary ring-4 ring-secondary/20"></div>
                                </div>
                                <PlaceAutocomplete
                                    placeholder="Enter destination city..."
                                    onPlaceSelect={handleDestSelect}
                                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text font-medium placeholder:text-text-muted/60"
                                />
                            </div>
                        </div>
                        <AnimatePresence>
                            {(searchParams.source && searchParams.destination) && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, y: 20 }}
                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                    exit={{ opacity: 0, height: 0, y: 20 }}
                                    className="md:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-6 items-end"
                                >
                                    <div className="md:col-span-5 group">
                                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1 group-focus-within:text-primary transition-colors">Date</label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={searchParams.date}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text font-medium dark:[color-scheme:dark]"
                                        />
                                    </div>
                                    <div className="md:col-span-4 group">
                                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1">Passengers</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="passengers"
                                                min="1"
                                                max="6"
                                                value={searchParams.passengers}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text font-medium text-center"
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-muted text-sm font-medium">
                                                👤
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-3">
                                        <Button
                                            type="submit"
                                            isLoading={loading}
                                            size="lg"
                                            className="w-full shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] transition-shadow duration-300"
                                            rightIcon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                                        >
                                            Search Rides
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </motion.div>
            </div>

            {/* Results Section */}
            <div ref={resultsRef} className="max-w-5xl mx-auto mt-12 scroll-mt-28">
                {searched && (
                    <div className="animate-fade-in">
                        {/* Context Header */}
                        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
                            <div>
                                {loading ? (
                                    <div className="h-8 w-48 bg-neutral animate-pulse rounded"></div>
                                ) : (
                                    <h3 className="text-xl font-bold text-text flex items-center gap-2">
                                        {searchParams.source && searchParams.destination && (
                                            <span className="text-lg text-text-muted font-normal mr-1 max-w-[200px] truncate block md:inline">
                                                Matching rides for <span className="text-text font-bold">{searchParams.source.split(',')[0]}</span> → <span className="text-text font-bold">{searchParams.destination.split(',')[0]}</span>
                                            </span>
                                        )}
                                    </h3>
                                )}

                                {!loading && (
                                    <p className="text-text-muted text-sm mt-1 flex items-center gap-2">
                                        <Badge variant="neutral" size="sm">{rides.length} results</Badge>
                                    </p>
                                )}
                            </div>

                            {!loading && rides.length > 0 && (
                                <div className="flex items-center gap-3">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="px-4 py-2 rounded-lg bg-surface border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="earliest">Earliest Departure</option>
                                        <option value="price_low">Lowest Price</option>
                                        <option value="seats_available">Most Seats Available</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Ride Cards List */}
                        <div className="space-y-4">
                            {loading ? (
                                <>
                                    <RideSkeleton />
                                    <RideSkeleton />
                                    <RideSkeleton />
                                </>
                            ) : rides.length > 0 ? (
                                sortedRides.map(ride => (
                                    <Card
                                        key={ride._id}
                                        className="overflow-hidden hover:shadow-xl hover:scale-[1.005] transition-all duration-300 group cursor-pointer relative border border-border/50"
                                        noPadding
                                    >
                                        <div className="p-5">
                                            {/* Header: Time & Price Anchor */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-baseline gap-2">
                                                        <h3 className="text-2xl font-bold text-text">
                                                            {new Date(ride.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </h3>
                                                        <span className="text-text-muted font-medium text-sm">
                                                            • {ride.distanceToMeetingPoint ? `${ride.distanceToMeetingPoint.toFixed(1)} km away` : 'Nearby'}
                                                        </span>
                                                    </div>
                                                    {/* Trust Signal: Driver */}
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <img
                                                            src={ride.driver?.profilePicture || "https://via.placeholder.com/32"}
                                                            alt={ride.driver?.name}
                                                            className="w-6 h-6 rounded-full object-cover"
                                                        />
                                                        <span className="text-sm font-semibold text-text">{ride.driver?.name}</span>
                                                        <span className="text-xs text-text-muted flex items-center">
                                                            <span className="text-warning mr-1">★ {ride.driver?.avgRating?.toFixed(1) || 'New'}</span>
                                                            <span>• 12 successful trips</span>
                                                        </span>
                                                        {ride.driver?.avgRating >= 4.5 && (
                                                            <Badge variant="success" size="sm" className="hidden sm:inline-flex ml-2 py-0 px-2 h-5 text-[10px]">
                                                                TRUSTED DRIVER
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-primary">₹{ride.estimatedPrice || ride.price}</div>
                                                    <div className="text-xs text-text-muted font-medium">per seat</div>
                                                </div>
                                            </div>

                                            {/* Route Visualization */}
                                            <div className="flex gap-4 items-center mb-5 relative pl-2">
                                                {/* Line */}
                                                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border"></div>

                                                <div className="flex-1 space-y-4">
                                                    <div className="flex items-center gap-3 relative z-10">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-background border-[3px] border-text-muted"></div>
                                                        <div className="flex-1">
                                                            <div className="text-base font-bold text-text">{ride.source?.name?.split(',')[0]}</div>
                                                            <div className="text-xs text-text-muted truncate max-w-[200px]">{ride.source?.name}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 relative z-10">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-background border-[3px] border-primary"></div>
                                                        <div className="flex-1">
                                                            <div className="text-base font-bold text-text">{ride.destination?.name?.split(',')[0]}</div>
                                                            <div className="text-xs text-text-muted truncate max-w-[200px]">{ride.destination?.name}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons (Right Aligned on Desktop) */}
                                                <div className="flex flex-col items-end gap-2 min-w-[140px]">
                                                    {ride.availableSeats === 0 || ride.isFull ? (
                                                        <Button
                                                            onClick={(e) => { e.stopPropagation(); handleJoinWaitlist(ride._id); }}
                                                            disabled={ride.driver._id === user?._id}
                                                            className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
                                                            size="sm"
                                                        >
                                                            Join Waitlist
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            onClick={(e) => { e.stopPropagation(); handleBook(ride, ride.pickupMeetingPoint, ride.distanceToMeetingPoint); }}
                                                            disabled={ride.driver._id === user?._id}
                                                            variant="primary"
                                                            className="w-full font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                                                        >
                                                            {ride.driver._id === user?._id ? 'Your Ride' : 'Book Now'}
                                                        </Button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleViewRoute(ride); }}
                                                        className="text-primary text-xs font-semibold hover:underline"
                                                    >
                                                        {selectedRide === ride._id ? 'Hide Map' : 'View on Map'}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Secondary Info (Collapsed by default, visible on hover/group-hover) */}
                                            <div className="border-t border-border/50 pt-3 mt-2 opacity-100 md:opacity-0 md:h-0 md:group-hover:opacity-100 md:group-hover:h-auto transition-all duration-300 overflow-hidden flex flex-wrap gap-2">
                                                <Badge variant="neutral" size="sm" className="font-normal text-text-muted">
                                                    🚗 {ride.vehicle?.model || "Standard"}
                                                </Badge>
                                                <Badge variant={ride.availableSeats <= 1 ? "error" : "success"} size="sm">
                                                    {ride.availableSeats} seats left
                                                </Badge>
                                                {ride.driver?.travelPreferences?.map((pref, i) => (
                                                    <Badge key={i} variant="neutral" size="sm" className="font-normal text-text-muted bg-surface border border-border">
                                                        {pref}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Expandable Map Section */}
                                        <AnimatePresence>
                                            {selectedRide === ride._id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 320, opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="w-full bg-neutral border-t border-border relative overflow-hidden"
                                                >
                                                    <GoogleMap
                                                        mapContainerStyle={{ width: '100%', height: '100%' }}
                                                        center={ride.bounds ? {
                                                            lat: (ride.bounds.northeast.lat + ride.bounds.southwest.lat) / 2,
                                                            lng: (ride.bounds.northeast.lng + ride.bounds.southwest.lng) / 2
                                                        } : { lat: ride.source.lat, lng: ride.source.lng }}
                                                        zoom={ride.bounds ? undefined : 10}
                                                        onLoad={map => {
                                                            if (ride.bounds) {
                                                                const bounds = new google.maps.LatLngBounds(
                                                                    ride.bounds.southwest,
                                                                    ride.bounds.northeast
                                                                );
                                                                map.fitBounds(bounds);
                                                            }
                                                        }}
                                                        options={{
                                                            streetViewControl: false,
                                                            mapTypeControl: false,
                                                        }}
                                                    >
                                                        <Polyline
                                                            path={decodedPath}
                                                            options={{
                                                                strokeColor: "#3B82F6",
                                                                strokeOpacity: 0.8,
                                                                strokeWeight: 6,
                                                            }}
                                                        />
                                                        {ride.pickupMeetingPoint && ride.pickupMeetingPoint.coordinates && (
                                                            <Marker
                                                                position={{
                                                                    lat: ride.pickupMeetingPoint.coordinates[1],
                                                                    lng: ride.pickupMeetingPoint.coordinates[0]
                                                                }}
                                                                title="Suggested Meeting Point"
                                                                label="📍"
                                                            />
                                                        )}
                                                    </GoogleMap>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </Card>
                                ))
                            ) : (
                                /* Empty State */
                                <div className="text-center py-24 bg-surface/50 rounded-2xl border border-dashed border-border/50">
                                    <div className="w-20 h-20 bg-neutral/50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <span className="text-4xl">🌵</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-text mb-2">This route is quiet right now</h3>
                                    <p className="text-text-muted max-w-md mx-auto mb-8 text-sm">
                                        But it won't be for long. Drivers post rides every hour.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <Button
                                            variant="outline"
                                            className={`border-primary/20 hover:bg-primary/5 text-primary ${hasAlert ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : ''}`}
                                            onClick={handleNotify}
                                        >
                                            {hasAlert ? '🔕 Cancel Alert' : '🔔 Notify me when a ride opens'}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => navigate('/offer-ride')}
                                        >
                                            Offer this ride yourself →
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Sticky Actions Bar */}
            <AnimatePresence>
                {searched && rides.length > 0 && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border p-3 lg:hidden flex gap-3 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] pb-safe"
                    >
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl border-border bg-background"
                            size="md"
                            leftIcon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>}
                        >
                            Filter
                        </Button>
                        <div className="w-px bg-border my-2"></div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="flex-1 bg-background border border-border rounded-xl px-4 font-medium text-sm focus:outline-none focus:border-primary appearance-none text-center"
                        >
                            <option value="earliest">🕒 Earliest</option>
                            <option value="price_low">💰 Cheapest</option>
                            <option value="seats_available">💺 Most Seats</option>
                        </select>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default SearchRides;
