import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import RatePassengers from '../components/RatePassengers';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/LoadingSpinner';

const defaultCenter = {
    lat: 28.6139,
    lng: 77.2090
};

const libraries = ['places', 'geometry', 'marker'];

const Tracking = () => {
    const { rideId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [passengerLocation, setPassengerLocation] = useState(null);
    const [status, setStatus] = useState('Connecting...');
    const [map, setMap] = useState(null);
    const [isDriver, setIsDriver] = useState(false);
    const [ride, setRide] = useState(null);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [usersToRate, setUsersToRate] = useState([]);
    const [locationError, setLocationError] = useState(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries,
    });

    useEffect(() => {
        const fetchRideDetails = async () => {
            try {
                const { data } = await api.get(`/rides/${rideId}`);
                setRide(data);

                if (user && data.driver) {
                    const driverId = typeof data.driver === 'object' ? data.driver._id : data.driver;

                    if (user._id === driverId) {
                        setIsDriver(true);
                        setStatus("You are the Driver - Broadcasting Location");
                    } else {
                        setIsDriver(false);
                        setStatus("Passenger - Waiting for Driver...");
                    }
                }

                if (data.source && data.source.lat && data.source.lng) {
                    setDriverLocation({ lat: data.source.lat, lng: data.source.lng });
                }
            } catch (error) {
                console.error("Error fetching ride details:", error);
                setStatus("Error loading ride details");
            }
        };

        if (user && rideId) {
            fetchRideDetails();
        }
    }, [rideId, user]);

    // DRIVER LOGIC
    useEffect(() => {
        if (isDriver && navigator.geolocation && isLoaded) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setUserLocation(pos);
                    setDriverLocation(pos);

                    if (socket) {
                        socket.emit('car-moved', { rideId, location: pos });
                        setStatus("Broadcasting Live Location 📡");
                    }
                },
                (error) => {
                    console.error("Driver GPS Error:", error);
                    setLocationError("GPS Signal Weak");
                },
                { enableHighAccuracy: true }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, [isDriver, socket, rideId, isLoaded]);

    // PASSENGER LOGIC
    useEffect(() => {
        if (!isDriver && navigator.geolocation && isLoaded && !userLocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setUserLocation(pos);

                    if (socket) {
                        socket.emit('passenger-moved', { rideId, location: pos });
                    }

                    setStatus("Pickup Point Set 📍");
                },
                (error) => {
                    console.error("Passenger Location Error:", error);
                    setLocationError("GPS Permission Denied");
                }
            );
        }
    }, [isDriver, socket, rideId, isLoaded, userLocation]);

    const onPassengerDragEnd = (e) => {
        if (isDriver) return;
        const newPos = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
        };
        setUserLocation(newPos);
        if (socket) {
            socket.emit('passenger-moved', { rideId, location: newPos });
            setStatus("Pickup Location Updated 📍");
        }
    };

    useEffect(() => {
        if (isLoaded && map && driverLocation) {
            map.panTo(driverLocation);
        }
    }, [isLoaded, map, driverLocation]);

    useEffect(() => {
        const SOCKET_URL = process.env.REACT_APP_API_URL
            ? process.env.REACT_APP_API_URL.replace('/api', '')
            : 'http://localhost:5000';

        const newSocket = io(SOCKET_URL, {
            withCredentials: true
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log("Socket connected");
            newSocket.emit('join_ride', rideId);
            if (!isDriver) setStatus('Connected - Waiting for updates');
        });

        newSocket.on('car-moved', (newLocation) => {
            if (!isDriver) {
                setDriverLocation(newLocation);
                setStatus("Tracking Driver (Live) 📡");
            }
        });

        newSocket.on('passenger-moved', (newLocation) => {
            if (isDriver) {
                setPassengerLocation(newLocation);
            }
        });

        newSocket.on('ride_ended', () => {
            if (!isDriver && ride && ride.driver) {
                setUsersToRate([ride.driver]);
                setShowRatingModal(true);
            } else {
                alert("Ride has ended.");
                navigate('/my-bookings');
            }
        });

        return () => newSocket.close();
    }, [rideId, isDriver, ride, navigate]);

    if (!isLoaded) return <div className="min-h-screen pt-20 flex justify-center"><LoadingSpinner size="lg" /></div>;

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 relative overflow-hidden flex flex-col">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none -z-10" />

            <div className="container mx-auto max-w-5xl flex-1 flex flex-col">
                {showRatingModal && (
                    <RatePassengers
                        rideId={rideId}
                        usersToRate={usersToRate}
                        userRole="passenger"
                        onClose={() => {
                            setShowRatingModal(false);
                            navigate('/my-bookings');
                        }}
                    />
                )}

                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 z-10">
                    <div>
                        <Button
                            variant="ghost"
                            className="pl-0 text-text-muted hover:text-primary hover:bg-transparent mb-2"
                            onClick={() => navigate(isDriver ? '/dashboard' : '/my-bookings')}
                            leftIcon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>}
                        >
                            Back
                        </Button>
                        <h2 className="text-3xl font-bold font-heading text-text">Live Ride Tracking</h2>
                    </div>

                    <Card className="px-5 py-3 flex items-center gap-3 bg-surface/80 backdrop-blur-md shadow-lg border-primary/20">
                        {locationError ? (
                            <>
                                <span className="text-xl">⚠️</span>
                                <span className="text-error font-bold animate-pulse">{locationError}</span>
                            </>
                        ) : (
                            <>
                                <span className="relative flex h-3 w-3">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.includes('Broadcasting') || status.includes('Tracking') ? 'bg-success' : 'bg-warning'}`}></span>
                                    <span className={`relative inline-flex rounded-full h-3 w-3 ${status.includes('Broadcasting') || status.includes('Tracking') ? 'bg-success' : 'bg-warning'}`}></span>
                                </span>
                                <span className={`font-bold text-sm ${status.includes('Broadcasting') || status.includes('Tracking') ? 'text-success' : 'text-warning-dark'}`}>{status}</span>
                            </>
                        )}
                    </Card>
                </div>

                <Card className="p-1 md:p-2 shadow-2xl border-none ring-4 ring-surface flex-1 overflow-hidden flex flex-col min-h-[500px]">
                    <div className="rounded-xl overflow-hidden h-full flex-grow relative">
                        <GoogleMap
                            mapContainerStyle={{ width: '100%', height: '100%', minHeight: '500px' }}
                            center={driverLocation || defaultCenter}
                            zoom={15}
                            onLoad={setMap}
                            options={{
                                disableDefaultUI: false,
                                zoomControl: true,
                                mapTypeControl: false,
                                streetViewControl: false,
                                fullscreenControl: false,
                            }}
                        >
                            {/* Driver Marker */}
                            {driverLocation && (
                                <Marker
                                    position={driverLocation}
                                    icon={{
                                        url: "https://maps.google.com/mapfiles/kml/shapes/cabs.png",
                                        scaledSize: new window.google.maps.Size(40, 40)
                                    }}
                                    title="Driver"
                                />
                            )}

                            {/* User Marker (Passenger Self) */}
                            {userLocation && !isDriver && (
                                <Marker
                                    position={userLocation}
                                    draggable={true}
                                    onDragEnd={onPassengerDragEnd}
                                    icon={{
                                        path: window.google.maps.SymbolPath.CIRCLE,
                                        scale: 10,
                                        fillColor: "#4285F4",
                                        fillOpacity: 1,
                                        strokeWeight: 3,
                                        strokeColor: "#ffffff",
                                    }}
                                />
                            )}

                            {/* Passenger Marker (Viewed by Driver) */}
                            {passengerLocation && isDriver && (
                                <Marker
                                    position={passengerLocation}
                                    icon={{
                                        path: window.google.maps.SymbolPath.CIRCLE,
                                        scale: 10,
                                        fillColor: "#F44242",
                                        fillOpacity: 1,
                                        strokeWeight: 3,
                                        strokeColor: "#ffffff",
                                    }}
                                />
                            )}
                        </GoogleMap>

                        {/* Map Controls Overlay */}
                        <div className="absolute bottom-6 left-6 right-6 flex justify-center pointer-events-none">
                            <div className="bg-surface/90 backdrop-blur-md px-6 py-3 rounded-full shadow-xl border border-border flex items-center gap-8 pointer-events-auto">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-white shadow-sm"></span>
                                    <span className="text-sm font-bold text-text">You ({isDriver ? 'Driver' : 'Passenger'})</span>
                                </div>
                                <div className="h-4 w-px bg-border"></div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-white shadow-sm"></span>
                                    <span className="text-sm font-bold text-text">{isDriver ? 'Passenger' : 'Driver'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Tracking;
