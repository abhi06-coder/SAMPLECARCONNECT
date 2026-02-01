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
        date: '',
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

    const handleSearch = async (e) => {
        e?.preventDefault();

        // Input Validation
        if (!searchParams.source || !searchParams.destination || !searchParams.date) {
            // Using a simple alert for now, or could use a toast state if available
            // Since showToast is for "Results updated", let's use a browser alert or add a specific error state
            // Given the context, alert is quick, but let's check if we can make it nicer.
            // There is no dedicated error toast component visible in the snippet, so I'll use alert for immediate feedback
            // or better, set a temporary error state if I can add it, but modifying state structure might be invasive.
            // User asked for "error handling", so a clear alert is a good start.
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
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="fixed top-16 left-0 right-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border shadow-md px-4 py-3 flex items-center justify-between lg:justify-center lg:gap-8"
                    >
                        <div className="flex items-center gap-2 text-sm font-medium text-text truncate max-w-[70%]">
                            <span className="truncate">{searchParams.source.split(',')[0]}</span>
                            <span className="text-text-muted">→</span>
                            <span className="truncate">{searchParams.destination.split(',')[0]}</span>
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
                        <div className="md:col-span-4 group">
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
                        <div className="md:col-span-4 group">
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
                        <div className="md:col-span-2 group">
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1 group-focus-within:text-primary transition-colors">Date</label>
                            <input
                                type="date"
                                name="date"
                                value={searchParams.date}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text font-medium dark:[color-scheme:dark]"
                            />
                        </div>
                        <div className="md:col-span-2 group">
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

                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-12 mt-2 flex justify-end">
                            <Button
                                type="submit"
                                isLoading={loading}
                                size="lg"
                                className="w-full md:w-auto px-8"
                                rightIcon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                            >
                                Search Rides
                            </Button>
                        </div>
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
                                        className="overflow-hidden hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group border-l-4 border-l-primary cursor-pointer relative"
                                        noPadding
                                    >
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-6 p-5">

                                            {/* Mobile: Top Row */}
                                            <div className="lg:hidden flex justify-between items-start mb-4 border-b border-border/50 pb-3">
                                                <div>
                                                    <div className="text-lg font-bold text-text">
                                                        {new Date(ride.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <div className="mt-1">
                                                        <Badge variant={ride.availableSeats <= 1 ? "error" : "success"} size="sm">
                                                            {ride.availableSeats} seats left
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xl font-bold text-primary">₹{ride.price}</div>
                                                    <div className="text-[10px] text-text-muted font-medium uppercase">per seat</div>
                                                </div>
                                            </div>

                                            {/* Left: Driver Info */}
                                            <div className="lg:col-span-3 flex lg:flex-col items-center lg:items-center justify-start lg:justify-center gap-4 text-left border-b lg:border-b-0 lg:border-r border-border pb-4 lg:pb-0 mb-4 lg:mb-0 lg:pr-4">
                                                <div className="relative flex-shrink-0">
                                                    <img
                                                        src={ride.driver?.profilePicture || "https://via.placeholder.com/60"}
                                                        alt={ride.driver?.name || "Driver"}
                                                        className="w-12 h-12 lg:w-16 lg:h-16 rounded-full object-cover border-2 border-surface shadow-sm"
                                                    />
                                                    {ride.driver?.avgRating >= 4.5 && (
                                                        <div className="absolute -bottom-1 -right-1 bg-surface rounded-full p-0.5 shadow-sm">
                                                            <svg className="w-4 h-4 text-warning fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 lg:text-center lg:w-full min-w-0">
                                                    <h4 className="font-bold text-text truncate max-w-[150px] lg:mx-auto">{ride.driver?.name || "Unknown Driver"}</h4>
                                                    <div className="flex items-center lg:justify-center text-xs text-text-muted mt-0.5 mb-2">
                                                        <span className="flex items-center text-warning font-medium mr-2">
                                                            {ride.driver?.avgRating ? ride.driver.avgRating.toFixed(1) : 'New'} ★
                                                        </span>
                                                        <span>(12 rides)</span>
                                                    </div>
                                                    <button
                                                        onClick={() => ride.driver && handleViewProfile(ride.driver._id)}
                                                        className="text-primary text-xs font-semibold hover:underline flex items-center lg:justify-center"
                                                        disabled={!ride.driver}
                                                    >
                                                        View Profile
                                                    </button>

                                                    <div className="flex gap-1 justify-center mt-2 flex-wrap">
                                                        {ride.driver?.travelPreferences && ride.driver.travelPreferences.slice(0, 3).map((pref, i) => (
                                                            <span key={i} className="text-[10px] bg-neutral px-1.5 py-0.5 rounded text-text-muted border border-border" title={pref}>
                                                                {pref === 'No Smoking' ? '🚭' : pref === 'Music Friendly' ? '🎵' : pref === 'Pet Friendly' ? '🐾' : '✨'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Middle: Journey Details */}
                                            <div className="lg:col-span-6 flex flex-col justify-center gap-4 lg:px-2 mb-4 lg:mb-0">
                                                <div className="flex items-start lg:items-center justify-between gap-4">
                                                    <div className="text-left flex-1 min-w-0">
                                                        <div className="hidden lg:block text-xl font-bold text-text mb-1">{new Date(ride.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                        <div className="text-base font-bold text-text lg:text-text-muted/80 truncate">{ride.source?.name?.split(',')[0]}</div>
                                                        <div className="text-xs text-text-muted truncate hidden lg:block">{ride.source?.name}</div>
                                                    </div>

                                                    {/* Route Visualizer */}
                                                    <div className="flex-shrink-0 flex flex-col items-center px-1 self-stretch lg:self-auto justify-center">
                                                        <div className="lg:hidden h-full min-h-[40px] w-0.5 bg-border relative my-1">
                                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border-2 border-primary bg-surface"></div>
                                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border-2 border-primary bg-primary"></div>
                                                        </div>
                                                        <div className="hidden lg:flex w-full items-center">
                                                            <div className="w-2 h-2 rounded-full border-2 border-primary bg-background"></div>
                                                            <div className="flex-1 h-0.5 bg-border w-16 mx-2 relative group">
                                                                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-text-muted font-mono whitespace-nowrap bg-surface px-1">4h 30m</span>
                                                            </div>
                                                            <div className="w-2 h-2 rounded-full border-2 border-primary bg-primary"></div>
                                                        </div>
                                                    </div>

                                                    <div className="text-right flex-1 min-w-0">
                                                        <div className="hidden lg:block text-xl font-bold text-text-muted/60 mb-1">--:--</div>
                                                        <div className="text-xl lg:text-base font-bold text-text lg:text-text-muted/80 truncate">{ride.destination?.name?.split(',')[0]}</div>
                                                        <div className="text-xs text-text-muted truncate hidden lg:block">{ride.destination.name}</div>

                                                        {/* Mobile Price */}
                                                        <div className="lg:hidden mt-2">
                                                            <span className="text-lg font-bold text-primary">₹{ride.estimatedPrice || ride.price}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Mini Badges Line */}
                                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                    <Badge variant="neutral" size="sm" className="font-normal text-text-muted">
                                                        <span className="mr-1">🚗</span> {ride.vehicle?.model || "Standard"}
                                                    </Badge>
                                                    <Badge variant="success" size="sm" className="font-normal">
                                                        <span className="mr-1">🛡️</span> Verified
                                                    </Badge>
                                                    {ride.distanceToMeetingPoint && (
                                                        <Badge variant="info" size="sm" className="font-normal">
                                                            <span className="mr-1">📍</span> {ride.distanceToMeetingPoint.toFixed(1)} km to meeting point
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: Price & Action */}
                                            <div className="lg:col-span-3 flex flex-row lg:flex-col justify-between items-center lg:items-end lg:justify-center gap-3 lg:pl-4 lg:border-l border-border pt-2 lg:pt-0">
                                                <div className="hidden lg:block text-right mb-2">
                                                    <div className="text-2xl font-bold text-primary">₹{ride.estimatedPrice || ride.price}</div>
                                                    <div className="text-xs text-text-muted font-medium">per seat</div>
                                                </div>

                                                <div className="hidden lg:block text-sm font-bold items-center gap-1 mb-2">
                                                    <Badge variant={ride.availableSeats <= 1 ? "error" : "success"} size="sm">
                                                        {ride.availableSeats} seats left
                                                    </Badge>
                                                </div>

                                                <div className="flex flex-col gap-2 w-full lg:w-auto min-w-[140px]">
                                                    {ride.availableSeats === 0 || ride.isFull ? (
                                                        <div className="flex flex-col gap-1.5 w-full">
                                                            <Button
                                                                onClick={() => handleJoinWaitlist(ride._id)}
                                                                disabled={ride.driver._id === user?._id}
                                                                className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
                                                                size="sm"
                                                            >
                                                                <span>⌛ Join Waitlist</span>
                                                            </Button>
                                                            <div className="text-[10px] text-error font-bold text-center uppercase tracking-tighter bg-error/5 py-1 rounded-md border border-error/10">
                                                                {ride.availableSeats === 0 ? "Ride is Fully Booked" : "Insufficient Seats"}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            onClick={() => handleBook(ride, ride.pickupMeetingPoint, ride.distanceToMeetingPoint)}
                                                            disabled={ride.driver._id === user?._id}
                                                            variant="primary"
                                                            className="w-full bg-success hover:bg-green-600 border-success shadow-success/20"
                                                            size="sm"
                                                        >
                                                            <span>{ride.driver._id === user?._id ? 'Your Ride' : 'Book Now'}</span>
                                                        </Button>
                                                    )}

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewRoute(ride)}
                                                        className="w-full text-xs"
                                                    >
                                                        {selectedRide === ride._id ? 'Hide Map' : 'View on Map'}
                                                    </Button>
                                                </div>
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
                                <div className="text-center py-20 bg-surface rounded-2xl border border-dashed border-border">
                                    <div className="w-24 h-24 bg-neutral rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-12 h-12 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-text mb-2">No rides available on this route yet</h3>
                                    <p className="text-text-muted max-w-md mx-auto mb-8">
                                        Try changing the date or widening your search area to find more drivers.
                                    </p>
                                    <Button variant="outline">
                                        🔔 Notify me when a ride opens
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default SearchRides;
