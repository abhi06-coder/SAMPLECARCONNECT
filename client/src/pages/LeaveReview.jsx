import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const LeaveReview = () => {
    const { rideId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Get revieweeId (driverId) from navigation state
    const revieweeId = location.state?.driverId;

    useEffect(() => {
        if (!revieweeId) {
            setError("Invalid access: Missing driver details");
        }
    }, [revieweeId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/reviews', {
                rideId,
                revieweeId,
                rating,
                comment
            }, config);
            alert("Review Submitted!");
            navigate('/my-bookings');
        } catch (err) {
            setError(err.response?.data?.message || "Failed to submit review");
        } finally {
            setLoading(false);
        }
    };

    if (!revieweeId) return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="text-center p-8 bg-error/5 border-error/20">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-bold text-error mb-2">Missing Information</h3>
                <p className="text-text-muted mb-6">We couldn't identify the driver to rate. Please try again from My Bookings.</p>
                <Button onClick={() => navigate('/my-bookings')} variant="primary" fullWidth>Go to My Bookings</Button>
            </Card>
        </div>
    );

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8 transition-colors duration-300">
            <Card className="max-w-md w-full animate-fade-in text-center p-8 shadow-2xl">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary text-2xl">
                    🌟
                </div>
                <h2 className="text-3xl font-bold mb-2 font-heading text-text">Rate Your Ride</h2>
                <p className="text-text-muted mb-8 text-sm">Help others by sharing your experience</p>

                {error && <p className="bg-error/10 text-error p-3 rounded-xl mb-6 text-sm font-medium border border-error/20">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4 flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="focus:outline-none transition-all duration-200 transform hover:scale-110 active:scale-95 p-1"
                            >
                                <svg
                                    className={`w-12 h-12 ${star <= rating ? 'text-warning fill-current drop-shadow-md' : 'text-neutral-dark fill-current'}`}
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                </svg>
                            </button>
                        ))}
                    </div>

                    <div className="text-center font-bold text-primary mb-8 h-6 text-lg animate-pulse">
                        {rating === 5 && "Excellent! 🤩"}
                        {rating === 4 && "Great! 👍"}
                        {rating === 3 && "Good 🙂"}
                        {rating === 2 && "Fair 😐"}
                        {rating === 1 && "Poor 😞"}
                    </div>

                    <div className="mb-8">
                        <label className="block text-text font-medium text-sm mb-2 text-left ml-1">Comments (Optional)</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text placeholder-text-muted h-32 resize-none text-sm md:text-base shadow-inner"
                            placeholder="Tell us about your trip..."
                        ></textarea>
                    </div>

                    <div className="space-y-3">
                        <Button
                            type="submit"
                            isLoading={loading}
                            variant="primary"
                            fullWidth
                            size="lg"
                            className="shadow-xl"
                        >
                            Submit Review
                        </Button>

                        <Button
                            type="button"
                            onClick={() => navigate(-1)}
                            variant="ghost"
                            fullWidth
                        >
                            Maybe later
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default LeaveReview;
