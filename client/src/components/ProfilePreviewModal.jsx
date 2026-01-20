import { useEffect, useState } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const ProfilePreviewModal = ({ userId, isOpen, onClose, onBook }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && userId) {
            fetchProfile();
        } else {
            setProfile(null);
        }
    }, [isOpen, userId]);

    const fetchProfile = async () => {
        setLoading(true);
        try {

            const { data } = await api.get(`/users/${userId}/public`);
            setProfile(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]"
                >
                    {loading || !profile ? (
                        <div className="p-12 text-center">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-text-muted">Loading Profile...</p>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-error">{error}</div>
                    ) : (
                        <>
                            {/* Scrollable Content */}
                            <div className="overflow-y-auto flex-1">
                                {/* Header / Cover */}
                                <div className="h-32 bg-gradient-to-r from-primary to-secondary relative">
                                    <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition backdrop-blur-md">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                {/* Profile Info */}
                                <div className="px-6 pb-6 -mt-12 relative">
                                    <div className="flex justify-between items-end">
                                        <div className="relative">
                                            <img
                                                src={profile.profilePicture || "https://via.placeholder.com/150"}
                                                alt={profile.name}
                                                className="w-24 h-24 rounded-full border-4 border-surface shadow-md object-cover bg-white"
                                            />
                                            {profile.isVerified && (
                                                <div className="absolute bottom-1 right-1 bg-surface rounded-full p-1 shadow-sm" title="Verified ID">
                                                    <svg className="w-5 h-5 text-success fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <h3 className="text-2xl font-bold font-heading text-text flex items-center gap-2">
                                            {profile.name}
                                        </h3>

                                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-text-muted">
                                            <span className="flex items-center text-text font-medium">
                                                <span className="text-warning mr-1">★</span>
                                                {profile.avgRating} ({profile.totalRides} reviews)
                                            </span>
                                            <span className="flex items-center">
                                                <svg className="w-4 h-4 mr-1 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                Member since {new Date(profile.createdAt).getFullYear()}
                                            </span>
                                        </div>

                                        <p className="mt-4 text-text-muted leading-relaxed text-sm">
                                            {profile.bio || "No bio added yet. Reliable co-traveler."}
                                        </p>

                                        {/* Status Badges */}
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profile.isPhoneVerified ? 'bg-success/10 text-success' : 'bg-neutral text-text-muted'}`}>
                                                {profile.isPhoneVerified ? '✓ Phone Verified' : 'Phone Unverified'}
                                            </span>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profile.isDriver ? 'bg-primary/10 text-primary' : 'bg-neutral text-text-muted'}`}>
                                                {profile.isDriver ? 'Driver' : 'Passenger'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border-t border-border my-6"></div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Vehicle Info */}
                                        {profile.isDriver && profile.vehicle?.model && (
                                            <div>
                                                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Vehicle Details</h4>
                                                <div className="bg-neutral/50 p-4 rounded-xl border border-border/50 space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-xl shadow-sm">🚗</div>
                                                        <div>
                                                            <div className="font-semibold text-text">{profile.vehicle.model}</div>
                                                            <div className="text-xs text-text-muted capitalize">{profile.vehicle.color || 'Unknown Color'}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm pt-2 border-t border-border/50">
                                                        <span className="text-text-muted">Plate Number</span>
                                                        <span className="font-mono bg-surface px-2 py-0.5 rounded text-xs border border-border blur-[2px] select-none">MH 12 XX 1234</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Preferences */}
                                        <div>
                                            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Travel Preferences</h4>
                                            {profile.travelPreferences && profile.travelPreferences.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {profile.travelPreferences.map((pref, i) => (
                                                        <span key={i} className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium text-text-muted flex items-center gap-1 shadow-sm">
                                                            <span>•</span> {pref}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-text-muted italic">No preferences set.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer / CTA */}
                            {profile.isDriver && onBook && (
                                <div className="p-4 border-t border-border bg-surface-elevated/50 backdrop-blur-sm">
                                    <button
                                        onClick={() => {
                                            if (onBook) onBook();
                                            onClose();
                                        }}
                                        className="w-full py-3.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>Request Seat</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ProfilePreviewModal;
