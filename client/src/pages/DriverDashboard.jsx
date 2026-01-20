import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const DriverDashboard = () => {
    const [rides, setRides] = useState([]);
    const [requests, setRequests] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commuteAlert, setCommuteAlert] = useState(null);
    const [editingRide, setEditingRide] = useState(null);
    const [editFormData, setEditFormData] = useState({ date: '', time: '' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const config = { withCredentials: true };

                const [ridesRes, requestsRes, templatesRes, pendingRes] = await Promise.all([
                    api.get('/rides/driver'),
                    api.get('/bookings/driver-requests'),
                    api.get('/commute/list'),
                    api.get('/commute/check-pending')
                ]);

                setRides(ridesRes.data);
                setRequests(requestsRes.data);
                setTemplates(templatesRes.data);
                if (pendingRes.data.pending) setCommuteAlert(pendingRes.data.template);

            } catch (error) {
                console.error("Error fetching dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePublishCommute = async () => {
        if (!commuteAlert) return;
        try {
            await api.post(`/commute/publish/${commuteAlert._id}`);
            alert("Ride published successfully!");
            setCommuteAlert(null);
            const res = await api.get('/rides/driver');
            setRides(res.data);
        } catch (error) {
            alert("Failed to publish ride");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Cancel this ride? Passengers will be notified.")) return;
        try {

            await api.delete(`/rides/${id}`);
            setRides(rides.filter(r => r._id !== id));
        } catch (error) {
            alert("Failed to cancel ride");
        }
    }

    const handleBookingStatus = async (bookingId, status) => {
        try {

            await api.put(`/bookings/${bookingId}/status`, { status });
            setRequests(requests.map(req => req._id === bookingId ? { ...req, status } : req));
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const handleEditClick = (ride) => {
        const dateObj = new Date(ride.dateTime);
        const dateStr = dateObj.toISOString().split('T')[0];
        const timeStr = dateObj.toTimeString().slice(0, 5);

        setEditFormData({ date: dateStr, time: timeStr });
        setEditingRide(ride);
    };

    const handleSaveEdit = async () => {
        if (!editingRide || !editFormData.date || !editFormData.time) return;

        try {
            const newDateTime = new Date(`${editFormData.date}T${editFormData.time}`);

            await api.put(`/rides/${editingRide._id}`, {
                dateTime: newDateTime
            });

            setRides(rides.map(r => r._id === editingRide._id ? { ...r, dateTime: newDateTime } : r));
            setEditingRide(null);
            alert("Ride updated successfully");
        } catch (error) {
            console.error("Failed to update ride", error);
            alert("Failed to update ride. Please try again.");
        }
    };

    if (loading) return <div className="min-h-screen bg-background pt-20 flex justify-center"><LoadingSpinner size="lg" /></div>;

    return (
        <div className="min-h-screen bg-background p-3 md:p-8 pb-24">
            <div className="container-custom">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold font-heading text-text">Driver Dashboard</h2>
                        <p className="text-text-muted mt-1">Manage your rides, requests, and earnings.</p>
                    </div>
                    <Link to="/offer-ride">
                        <Button
                            variant="primary"
                            size="lg"
                            className="shadow-lg shadow-primary/25"
                            leftIcon={<span>+</span>}
                        >
                            Offer New Ride
                        </Button>
                    </Link>
                </div>

                {commuteAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 bg-info/10 border border-info/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6"
                    >
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="w-12 h-12 bg-info/20 text-info rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-text">Scheduled Commute Detected</h3>
                                <p className="text-text-muted">It's <strong>{commuteAlert.time}</strong>. Ready to drive <strong>{commuteAlert.name}</strong>?</p>
                            </div>
                        </div>
                        <Button onClick={handlePublishCommute} variant="primary" className="w-full md:w-auto bg-info border-info hover:bg-info/90">
                            Publish Now
                        </Button>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Commute Templates - Full Width of Grid */}
                    <div className="lg:col-span-3">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-text flex items-center gap-2">
                                <span className="bg-primary/10 text-primary p-2 rounded-lg"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" /></svg></span>
                                My Commute Templates
                            </h3>
                            <Link to="/commute/create">
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary-hover hover:bg-primary/5">
                                    + New Template
                                </Button>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {templates.length === 0 ? (
                                <div className="col-span-full bg-surface border border-dashed border-border p-8 rounded-2xl text-center">
                                    <p className="text-text-muted mb-4">Save time by creating templates for frequent trips.</p>
                                    <Link to="/commute/create">
                                        <Button variant="outline">Create First Template</Button>
                                    </Link>
                                </div>
                            ) : (
                                templates.map(t => (
                                    <Card key={t._id} className="hover:border-primary/50 cursor-pointer transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-text group-hover:text-primary transition-colors">{t.name}</h4>
                                            <Badge variant="neutral" size="sm" className="font-mono">{t.time}</Badge>
                                        </div>
                                        <div className="text-sm text-text-muted flex items-center gap-2 mb-4">
                                            <span className="truncate max-w-[100px]">{t.source.name.split(',')[0]}</span>
                                            <span className="text-primary font-bold">→</span>
                                            <span className="truncate max-w-[100px]">{t.destination.name.split(',')[0]}</span>
                                        </div>
                                        <div className="flex gap-1.5">
                                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`w-6 h-6 flex items-center justify-center text-[10px] rounded-full font-bold ${t.daysOfWeek.includes(idx)
                                                        ? 'bg-primary/10 text-primary'
                                                        : 'bg-neutral text-text-muted/50'
                                                        }`}
                                                >
                                                    {day}
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Booking Requests */}
                <div className="mb-12">
                    <h3 className="text-xl font-bold text-text mb-6 flex items-center gap-2">
                        <span className="bg-primary/10 text-primary p-2 rounded-lg"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg></span>
                        Booking Requests
                        {requests.filter(r => r.status === 'pending_approval').length > 0 && (
                            <Badge variant="error" size="sm" className="animate-pulse ml-2">
                                {requests.filter(r => r.status === 'pending_approval').length} New
                            </Badge>
                        )}
                    </h3>

                    {requests.filter(r => r.status === 'pending_approval').length === 0 ? (
                        <div className="bg-surface p-8 rounded-2xl border border-border text-center">
                            <p className="text-text-muted">You're all caught up! No pending requests.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {requests.filter(r => r.status === 'pending_approval').map(req => (
                                    <motion.div
                                        key={req._id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                    >
                                        <Card className="h-full flex flex-col">
                                            <div className="flex items-center gap-4 mb-4">
                                                <img src={req.passenger.profilePicture || `https://ui-avatars.com/api/?name=${req.passenger.name}&background=random`} alt={req.passenger.name} className="w-12 h-12 rounded-full border-2 border-surface shadow-sm object-cover" />
                                                <div>
                                                    <Link to={`/driver/${req.passenger._id}`} className="font-bold text-text hover:text-primary transition-colors text-lg">
                                                        {req.passenger.name}
                                                    </Link>
                                                    <div className="flex items-center text-xs text-text-muted gap-2">
                                                        <span className="flex items-center text-warning">⭐ {req.passenger.avgRating ? req.passenger.avgRating.toFixed(1) : 'New'}</span>
                                                        <span>•</span>
                                                        <span>{req.passenger.gender || 'Passenger'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-neutral/50 p-4 rounded-xl mb-4 text-sm space-y-3 flex-1">
                                                <div className="flex flex-wrap gap-1.5 mb-2">
                                                    {req.passenger.travelPreferences && req.passenger.travelPreferences.length > 0 ? (
                                                        req.passenger.travelPreferences.slice(0, 3).map((pref, idx) => (
                                                            <Badge key={idx} variant="primary" size="sm" className="bg-primary/10 text-primary border-primary/20">{pref}</Badge>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-text-muted italic">No preferences set</span>
                                                    )}
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <span className="text-text-muted">Route</span>
                                                    <div className="text-right">
                                                        <span className="font-bold text-text block text-xs uppercase tracking-wide">{req.pickupName}</span>
                                                        <span className="text-[10px] text-text-muted">to</span>
                                                        <span className="font-bold text-text block text-xs uppercase tracking-wide">{req.dropoffName}</span>
                                                    </div>
                                                </div>

                                                <div className="h-px bg-border/50"></div>

                                                <div className="flex justify-between">
                                                    <span className="text-text-muted">Seats</span>
                                                    <span className="font-bold text-text">{req.seatsBooked} Seat(s)</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-text-muted">Earnings</span>
                                                    <span className="font-bold text-lg text-success">₹{req.totalPrice}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mt-auto">
                                                <Button
                                                    onClick={() => handleBookingStatus(req._id, 'confirmed')}
                                                    variant="primary"
                                                    className="w-full bg-success hover:bg-green-600 border-success"
                                                >
                                                    Accept
                                                </Button>
                                                <Button
                                                    onClick={() => handleBookingStatus(req._id, 'cancelled')}
                                                    variant="outline"
                                                    className="w-full text-error hover:bg-error/5 hover:border-error border-error/30"
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* My Offered Rides */}
                <div>
                    <h3 className="text-xl font-bold text-text mb-6 flex items-center gap-2">
                        <span className="bg-primary/10 text-primary p-2 rounded-lg"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg></span>
                        My Offered Rides
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rides.map(ride => (
                            <Card key={ride._id} className="relative overflow-hidden group">
                                {ride.status === 'cancelled' && <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex items-center justify-center font-bold text-error rotate-12 border-4 border-error/20 rounded-xl m-4 pointer-events-none">CANCELLED</div>}

                                <div className="flex justify-between items-start mb-5">
                                    <Badge variant={ride.status === 'active' ? 'success' : 'neutral'}>
                                        {ride.status}
                                    </Badge>
                                    <div className="text-right">
                                        <p className="font-bold text-xl text-primary">₹{ride.price}</p>
                                        <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Per Seat</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <div className="flex flex-col items-center gap-1 mt-1">
                                            <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/20"></div>
                                            <div className="w-0.5 h-10 bg-gradient-to-b from-primary/50 to-secondary/50"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-secondary ring-4 ring-secondary/20"></div>
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-4">
                                            <div>
                                                <p className="text-xs text-text-muted uppercase tracking-wider mb-0.5">From</p>
                                                <p className="font-bold text-text truncate">{ride.source.name.split(',')[0]}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-text-muted uppercase tracking-wider mb-0.5">To</p>
                                                <p className="font-bold text-text truncate">{ride.destination.name.split(',')[0]}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-text-muted bg-neutral/50 p-3 rounded-xl border border-border/50">
                                        <div className="flex items-center gap-2 font-medium">
                                            <span className="text-lg">📅</span> {new Date(ride.dateTime).toLocaleDateString()}
                                        </div>
                                        <div className="w-px h-4 bg-border"></div>
                                        <div className="flex items-center gap-2 font-medium">
                                            <span className="text-lg">⏰</span> {new Date(ride.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-border pt-4">
                                    <div className="text-sm">
                                        <span className="font-bold text-text">{ride.availableSeats}</span>
                                        <span className="text-text-muted ml-1">seats left</span>
                                    </div>
                                    {ride.status !== 'cancelled' && (
                                        <div className="flex gap-2">
                                            <Button onClick={() => handleEditClick(ride)} variant="ghost" size="sm" className="h-8 px-2 text-primary hover:bg-primary/10">
                                                Edit
                                            </Button>
                                            <Button onClick={() => handleDelete(ride._id)} variant="ghost" size="sm" className="h-8 px-2 text-error hover:bg-error/10">
                                                Cancel
                                            </Button>
                                            <Link to={`/manage-ride/${ride._id}`}>
                                                <Button variant="outline" size="sm" className="h-8">
                                                    Manage
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingRide && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-surface rounded-2xl p-6 w-full max-w-md border border-border shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-text mb-4">Edit Ride Schedule</h3>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={editFormData.date}
                                        onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                                        className="w-full px-4 py-3 bg-neutral/50 border border-transparent rounded-xl focus:border-primary focus:bg-background outline-none transition-all font-medium text-text"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1">Time</label>
                                    <input
                                        type="time"
                                        value={editFormData.time}
                                        onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                                        className="w-full px-4 py-3 bg-neutral/50 border border-transparent rounded-xl focus:border-primary focus:bg-background outline-none transition-all font-medium text-text"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button
                                    onClick={() => setEditingRide(null)}
                                    variant="ghost"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveEdit}
                                    variant="primary"
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DriverDashboard;
