import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { GoogleMap, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { PlaceAutocomplete } from '../components/PlaceAutocomplete';
import DriverOnboarding from '../components/DriverOnboarding';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';

const libraries = ['places', 'geometry', 'marker'];

const OfferRide = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Form and Step State
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        sourceName: '',
        destinationName: '',
        date: '',
        time: '',
        price: '',
        totalSeats: 3,
        vehicleModel: '',
        vehiclePlate: '',
        vehicleCapacity: '',
        visibility: 'public',
    });

    // Map State
    const [sourceLocation, setSourceLocation] = useState(null);
    const [destLocation, setDestLocation] = useState(null);
    const [directions, setDirections] = useState(null);
    const [routeIndex, setRouteIndex] = useState(0);
    const [routeData, setRouteData] = useState({ polyline: '', bounds: null, path: [] });
    // Distance/Duration state for calculations
    const [routeMeta, setRouteMeta] = useState({ distanceValue: 0, durationText: '', distanceText: '' });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Pre-fill vehicle details
    useEffect(() => {
        if (user && user.vehicle) {
            setFormData(prev => ({
                ...prev,
                vehicleModel: user.vehicle.model || '',
                vehiclePlate: user.vehicle.plateNumber || '',
                vehicleCapacity: user.vehicle.capacity || '',
            }));
        }
        if (user && !user.isDriver) {
            setShowOnboarding(true);
        }
    }, [user]);

    // Calculate Route
    useEffect(() => {
        if (sourceLocation && destLocation) {
            const calculateRoute = async () => {
                const directionsService = new google.maps.DirectionsService();
                try {
                    const result = await directionsService.route({
                        origin: sourceLocation,
                        destination: destLocation,
                        travelMode: google.maps.TravelMode.DRIVING,
                        provideRouteAlternatives: true,
                    });

                    setDirections(result);
                    setRouteIndex(0);
                    setError('');
                } catch (error) {
                    console.error("Error calculating route:", error);
                    setError("Could not calculate route. Please check locations.");
                }
            };
            calculateRoute();
        }
    }, [sourceLocation, destLocation]);

    // Update Route Data when directions/index change
    useEffect(() => {
        if (directions && directions.routes[routeIndex]) {
            const route = directions.routes[routeIndex];
            const leg = route.legs[0];

            setRouteData({
                polyline: route.overview_polyline,
                path: route.overview_path.map(latLng => [latLng.lng(), latLng.lat()]),
                bounds: {
                    northeast: { lat: route.bounds.getNorthEast().lat(), lng: route.bounds.getNorthEast().lng() },
                    southwest: { lat: route.bounds.getSouthWest().lat(), lng: route.bounds.getSouthWest().lng() }
                }
            });

            setRouteMeta({
                distanceValue: leg.distance.value,
                distanceText: leg.distance.text,
                durationText: leg.duration.text
            });
        }
    }, [directions, routeIndex]);

    const handleSourceSelect = useCallback((place) => {
        const location = { lat: place.lat, lng: place.lng };
        setSourceLocation(location);
        setFormData(prev => ({ ...prev, sourceName: place.address || place.name }));
    }, []);

    const handleDestSelect = useCallback((place) => {
        const location = { lat: place.lat, lng: place.lng };
        setDestLocation(location);
        setFormData(prev => ({ ...prev, destinationName: place.address || place.name }));
    }, []);

    const handleNext = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setError('');

        if (step === 1) {
            if (!sourceLocation || !destLocation) {
                setError('Please select valid Start and End locations.');
                return;
            }
            if (!directions) {
                setError('Wait for route calculation or try different locations.');
                return;
            }
        }

        if (step === 2) {
            if (!formData.date || !formData.time) {
                setError('Please select date and time.');
                return;
            }
        }

        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const rideData = {
                source: {
                    name: formData.sourceName,
                    lat: sourceLocation.lat,
                    lng: sourceLocation.lng,
                },
                destination: {
                    name: formData.destinationName,
                    lat: destLocation.lat,
                    lng: destLocation.lng,
                },
                dateTime: new Date(`${formData.date}T${formData.time}`),
                price: Number(formData.price),
                totalSeats: Number(formData.totalSeats),
                vehicle: {
                    model: formData.vehicleModel,
                    plateNumber: formData.vehiclePlate,
                    capacity: Number(formData.vehicleCapacity)
                },
                visibility: formData.visibility,
                routePolyline: routeData.polyline,
                routePath: routeData.path,
                bounds: routeData.bounds
            };

            const config = { headers: { 'Content-Type': 'application/json' }, withCredentials: true };
            const res = await api.post('/rides/create', rideData, config);

            if (res.data.success) {
                setLoading(false);
                setShowSuccess(true);
                setTimeout(() => navigate('/dashboard'), 2000);
            } else {
                setLoading(false);
                setError(res.data.message || 'Failed to create ride');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create ride');
            setLoading(false);
        }
    };

    // Calculate Recommended Price
    const getRecommendedPrice = () => {
        if (!routeMeta.distanceValue) return 0;
        const distKm = routeMeta.distanceValue / 1000;
        const capacity = Number(formData.vehicleCapacity) || 4;
        // Basic algorithm: (Fuel Cost est. 8km/l * price 100) / seats
        // Simplified: 5 INR per km divided by capacity? 
        // Let's stick to existing logic: (DistKm * 4) / Capacity
        return Math.round((distKm * 4) / (capacity)); // Rough estimate
    };

    if (!isLoaded) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

    if (!user) {
        return (
            <div className="min-h-screen bg-background p-4 flex items-center justify-center">
                <div className="max-w-md w-full bg-surface rounded-3xl shadow-xl border border-border p-8 text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-text mb-3">Login Required</h2>
                    <p className="text-text-muted mb-8">Sign in to offer rides and connect with passengers.</p>
                    <div className="space-y-3">
                        <Button fullWidth onClick={() => navigate('/login', { state: { from: '/offer-ride' } })}>Login to Continue</Button>
                        <Button fullWidth variant="outline" onClick={() => navigate('/signup')}>Create Account</Button>
                    </div>
                </div>
            </div>
        );
    }

    // Check for Blocked Status
    const isBlocked = user && (
        user.status === 'HARD_BLOCKED' ||
        (user.status === 'SOFT_BLOCKED' && user.blockedUntil && new Date() < new Date(user.blockedUntil))
    );

    if (isBlocked) {
        return (
            <div className="min-h-screen bg-background p-4 flex items-center justify-center">
                <div className="max-w-md w-full bg-surface rounded-3xl shadow-xl border border-error p-8 text-center">
                    <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-text mb-3">Account Restricted</h2>
                    <p className="text-text-muted mb-8">
                        {user.status === 'HARD_BLOCKED'
                            ? "Your account has been permanently blocked due to policy violations."
                            : <span>Your account is blocked from offering rides until <strong>{new Date(user.blockedUntil).toLocaleDateString()}</strong>.</span>
                        }
                        <br /><span className="text-xs text-text-muted mt-2 block">Reason: {user.blockReason || 'Policy Violation'}</span>
                    </p>
                    <Button fullWidth onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
                </div>
            </div>
        );
    }

    if (showOnboarding) {
        return (
            <div className="min-h-screen bg-background p-4 flex items-center justify-center">
                <div className="w-full max-w-md">
                    <DriverOnboarding onSuccess={() => setShowOnboarding(false)} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pt-8 pb-20 px-4 md:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header & Steps */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold font-heading text-text">Offer a Ride</h1>
                    <div className="mt-6 flex items-center">
                        <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-text-muted'}`}>
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${step >= 1 ? 'border-primary bg-primary/10' : 'border-border'}`}>1</span>
                            <span className="ml-2 font-medium hidden md:inline">Route</span>
                        </div>
                        <div className={`flex-1 h-0.5 mx-4 ${step >= 2 ? 'bg-primary' : 'bg-border'}`}></div>
                        <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-text-muted'}`}>
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${step >= 2 ? 'border-primary bg-primary/10' : 'border-border'}`}>2</span>
                            <span className="ml-2 font-medium hidden md:inline">Schedule</span>
                        </div>
                        <div className={`flex-1 h-0.5 mx-4 ${step >= 3 ? 'bg-primary' : 'bg-border'}`}></div>
                        <div className={`flex items-center ${step >= 3 ? 'text-primary' : 'text-text-muted'}`}>
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${step >= 3 ? 'border-primary bg-primary/10' : 'border-border'}`}>3</span>
                            <span className="ml-2 font-medium hidden md:inline">Details</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm mb-6 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        {error}
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Form Area */}
                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-surface rounded-2xl shadow-lg border border-border p-6 md:p-8 space-y-6"
                                >
                                    <h2 className="text-xl font-bold text-text mb-4">Where are you going?</h2>
                                    <div>
                                        <label className="block text-text font-medium text-sm mb-1.5 ml-1">From</label>
                                        <div className="relative z-20"> {/* z-index to help autocomplete show above other elements */}
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/20"></div>
                                            </div>
                                            <PlaceAutocomplete
                                                placeholder="Enter pickup city or landmark..."
                                                onPlaceSelect={handleSourceSelect}
                                                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-text font-medium text-sm mb-1.5 ml-1">To</label>
                                        <div className="relative z-10">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <div className="w-2.5 h-2.5 rounded-full bg-secondary ring-4 ring-secondary/20"></div>
                                            </div>
                                            <PlaceAutocomplete
                                                placeholder="Enter destination city..."
                                                onPlaceSelect={handleDestSelect}
                                                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
                                            />
                                        </div>
                                    </div>

                                    {routeMeta.distanceText && (
                                        <div className="flex items-center gap-4 text-sm text-text-muted bg-neutral/50 p-3 rounded-xl border border-border/50">
                                            <div className="flex items-center gap-1.5">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                                {routeMeta.distanceText}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                {routeMeta.durationText}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-surface rounded-2xl shadow-lg border border-border p-6 md:p-8 space-y-6"
                                >
                                    <h2 className="text-xl font-bold text-text mb-4">When are you traveling?</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input
                                            label="Date"
                                            type="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleChange}
                                            required
                                            min={new Date().toISOString().split('T')[0]} // Disable past dates
                                        />
                                        <Input
                                            label="Time"
                                            type="time"
                                            name="time"
                                            value={formData.time}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="bg-info/5 border border-info/10 p-4 rounded-xl text-sm text-text-muted flex gap-3">
                                        <svg className="w-5 h-5 text-info flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <p>Tips: Passengers are more likely to book rides that start on time. Consider traffic conditions.</p>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-surface rounded-2xl shadow-lg border border-border p-6 md:p-8 space-y-8"
                                >
                                    <div>
                                        <h2 className="text-xl font-bold text-text mb-4">Ride details</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-text font-medium text-sm mb-1.5 ml-1">Price per Seat (₹)</label>
                                                <input
                                                    type="number"
                                                    name="price"
                                                    value={formData.price}
                                                    onChange={handleChange}
                                                    placeholder="e.g. 500"
                                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text font-bold text-lg"
                                                    required
                                                />
                                                {getRecommendedPrice() > 0 && (
                                                    <p className="text-xs text-primary mt-1.5 font-medium cursor-pointer hover:underline" onClick={() => setFormData({ ...formData, price: getRecommendedPrice() })}>
                                                        Recommended: ₹{getRecommendedPrice()}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-text font-medium text-sm mb-1.5 ml-1">Available Seats</label>
                                                <div className="flex gap-3">
                                                    {[1, 2, 3, 4].map(num => (
                                                        <button
                                                            key={num}
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, totalSeats: num })}
                                                            className={`w-12 h-12 rounded-xl font-bold transition-all border ${Number(formData.totalSeats) === num
                                                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30'
                                                                : 'bg-background border-border text-text hover:border-primary/50'}`}
                                                        >
                                                            {num}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-border pt-6">
                                        <h2 className="text-xl font-bold text-text mb-4">Vehicle Information</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Input
                                                label="Vehicle Model"
                                                name="vehicleModel"
                                                value={formData.vehicleModel}
                                                onChange={handleChange}
                                                placeholder="e.g. Maruti Swift"
                                                required
                                            />
                                            <Input
                                                label="Plate Number"
                                                name="vehiclePlate"
                                                value={formData.vehiclePlate}
                                                onChange={handleChange}
                                                placeholder="MH02AB1234"
                                                className="uppercase"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-text font-medium text-sm mb-1.5 ml-1">Visibility</label>
                                        <select
                                            name="visibility"
                                            value={formData.visibility}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
                                        >
                                            <option value="public">Public (Everyone can see)</option>
                                            <option value="community">Community (Verified only)</option>
                                        </select>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Navigation Buttons for Form */}
                        <div className="mt-8 flex gap-4">
                            {step > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={handleBack}
                                    className="px-8"
                                >
                                    Back
                                </Button>
                            )}
                            {step < 3 ? (
                                <Button
                                    variant="primary"
                                    onClick={handleNext}
                                    className="px-8 ml-auto"
                                    rightIcon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>}
                                >
                                    Next
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    onClick={handleSubmit}
                                    className="px-8 ml-auto bg-success hover:bg-green-600 shadow-success/20"
                                    isLoading={loading}
                                    rightIcon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                                >
                                    Publish Ride
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Map - Always Visible on Desktop */}
                    <div className="lg:w-[400px] h-[300px] lg:h-auto lg:min-h-[600px] rounded-2xl overflow-hidden shadow-xl border border-border relative order-first lg:order-last">
                        {isLoaded && (
                            <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '100%', minHeight: '300px' }}
                                center={sourceLocation || { lat: 20.5937, lng: 78.9629 }}
                                zoom={5}
                                options={{
                                    streetViewControl: false,
                                    mapTypeControl: false,
                                    fullscreenControl: false,
                                    zoomControl: true,
                                }}
                            >
                                {directions && (
                                    <DirectionsRenderer
                                        directions={directions}
                                        routeIndex={routeIndex}
                                        options={{
                                            polylineOptions: { strokeColor: '#6366f1', strokeWeight: 5 }
                                        }}
                                    />
                                )}
                            </GoogleMap>
                        )}
                        {/* Route alternatives if available */}
                        {directions && directions.routes.length > 1 && (
                            <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide z-10">
                                {directions.routes.map((route, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => setRouteIndex(index)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all shadow-sm border ${routeIndex === index
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white text-text border-border'
                                            }`}
                                    >
                                        Route {index + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Success Animation */}
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
                            <h2 className="text-2xl font-bold text-text">Ride Published!</h2>
                            <p className="text-text-muted mt-2">Redirecting to dashboard...</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OfferRide;
