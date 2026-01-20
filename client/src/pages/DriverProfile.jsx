import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/LoadingSpinner';

const DriverProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const config = { withCredentials: true };
                const [profileRes, reviewsRes] = await Promise.all([
                    api.get(`/users/${userId}/public`),
                    api.get(`/reviews/user/${userId}`)
                ]);
                setProfile(profileRes.data);
                setReviews(reviewsRes.data);
            } catch (error) {
                console.error("Error fetching data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    if (loading) return <div className="min-h-screen pt-20 flex justify-center"><LoadingSpinner size="lg" /></div>;
    if (!profile) return <div className="p-8 text-center text-error">Profile not found</div>;

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 transition-colors duration-300">
            <div className="container mx-auto max-w-3xl animate-fade-in">

                <Button
                    variant="ghost"
                    className="mb-4 pl-0 text-text-muted hover:text-primary hover:bg-transparent"
                    onClick={() => navigate(-1)}
                    leftIcon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>}
                >
                    Back
                </Button>

                <Card className="mb-8 relative overflow-hidden border-none shadow-2xl">
                    {/* Cover Background */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary to-secondary/80"></div>
                    <div className="absolute top-0 left-0 w-full h-32 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>

                    <div className="relative z-10 pt-16 px-6 pb-8 text-center">
                        <div className="relative inline-block mb-4">
                            <img
                                src={profile.profilePicture || `https://ui-avatars.com/api/?name=${profile.name}&background=random`}
                                alt={profile.name}
                                className="w-32 h-32 rounded-full border-4 border-surface shadow-2xl object-cover bg-surface"
                            />
                            {profile.isVerified && (
                                <div className="absolute bottom-1 right-1 bg-surface rounded-full p-1 shadow-sm" title="Verified ID">
                                    <svg className="w-6 h-6 text-success fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                </div>
                            )}
                        </div>

                        <h2 className="text-3xl font-bold font-heading mb-2 text-text">
                            {profile.name}
                        </h2>

                        <div className="flex justify-center items-center gap-3 mb-8">
                            <Badge variant={profile.isDriver ? 'primary' : 'secondary'} className="rounded-full px-4">
                                {profile.isDriver ? 'Driver' : 'Passenger'}
                            </Badge>
                            <div className="flex items-center bg-warning/10 text-warning-dark px-3 py-1 rounded-full font-bold border border-warning/20">
                                <span className="text-lg mr-1.5 drop-shadow-sm">⭐</span>
                                {profile.avgRating ? profile.avgRating.toFixed(1) : 'New'}
                                <span className="text-text-muted text-sm font-normal ml-1.5 opacity-80">({profile.totalRides} rides)</span>
                            </div>
                        </div>

                        {/* Vehicle Info */}
                        {profile.isDriver && profile.vehicle && (
                            <div className="bg-neutral/30 p-4 rounded-xl border border-border/50 mb-8 max-w-sm mx-auto backdrop-blur-sm">
                                <div className="flex items-center justify-center gap-2 mb-3 opacity-60">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                    <span className="text-xs font-bold uppercase tracking-widest">Vehicle Details</span>
                                </div>
                                <div className="flex justify-center gap-8 text-sm">
                                    <div className="text-center">
                                        <div className="font-bold text-lg text-text">{profile.vehicle.model}</div>
                                        <div className="text-xs text-text-muted uppercase font-bold tracking-wider opacity-70">Model</div>
                                    </div>
                                    <div className="w-px bg-border/50"></div>
                                    <div className="text-center">
                                        <div className="font-bold text-lg text-text">{profile.vehicle.color}</div>
                                        <div className="text-xs text-text-muted uppercase font-bold tracking-wider opacity-70">Color</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Preferences */}
                        {profile.travelPreferences && profile.travelPreferences.length > 0 ? (
                            <div className="flex flex-wrap justify-center gap-2">
                                {profile.travelPreferences.map((pref, i) => (
                                    <Badge key={i} variant="secondary" className="bg-surface-elevated text-text-muted border-border font-medium px-3 py-1.5">
                                        {pref}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-text-muted italic">No travel preferences specificied</p>
                        )}
                    </div>
                </Card>

                <div className="flex items-center gap-3 mb-6 pl-2">
                    <h3 className="text-2xl font-bold font-heading text-text">Reviews</h3>
                    <Badge variant="neutral" className="text-sm">{reviews.length}</Badge>
                </div>

                <div className="space-y-4">
                    {reviews.length === 0 ? (
                        <div className="bg-surface p-12 rounded-3xl border border-dashed border-border text-center text-text-muted flex flex-col items-center">
                            <div className="w-16 h-16 bg-neutral rounded-full flex items-center justify-center mb-4 text-2xl opacity-50">💬</div>
                            <p>No reviews yet.</p>
                        </div>
                    ) : (
                        reviews.map(review => (
                            <Card key={review._id} className="p-6 hover:shadow-lg transition-all border-l-4 border-l-primary/20 hover:border-l-primary">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-neutral flex items-center justify-center text-primary font-bold text-lg overflow-hidden ring-2 ring-surface shadow-sm">
                                            {review.reviewer.profilePicture ? (
                                                <img src={review.reviewer.profilePicture} alt={review.reviewer.name} className="w-full h-full object-cover" />
                                            ) : (
                                                review.reviewer.name.charAt(0)
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-text text-lg leading-tight mb-1">{review.reviewer.name}</div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex text-warning text-sm">
                                                    {'★'.repeat(review.rating)}
                                                    <span className="text-neutral-dark/20">{'★'.repeat(5 - review.rating)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-text-muted bg-neutral px-2.5 py-1 rounded-lg border border-border/50 uppercase tracking-wide">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-text leading-relaxed pl-[4rem] text-sm md:text-base opacity-90">{review.comment}</p>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default DriverProfile;
