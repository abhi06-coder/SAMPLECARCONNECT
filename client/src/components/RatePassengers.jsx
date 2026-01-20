import { useState } from 'react';
import api from '../utils/api';
import { motion } from 'framer-motion';
import Button from './ui/Button';
import Card from './ui/Card';

const RatePassengers = ({ rideId, usersToRate, onClose, userRole }) => {
    // usersToRate is array of { _id, name, profilePicture, ... }
    const [currentIndex, setCurrentIndex] = useState(0);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentUser = usersToRate[currentIndex];

    const handleSubmit = async () => {
        if (rating === 0) return alert("Please select a rating");

        setIsSubmitting(true);
        try {

            await api.post('/reviews', {
                rideId,
                revieweeId: currentUser._id,
                rating,
                comment
            });

            // Move to next user or finish
            if (currentIndex < usersToRate.length - 1) {
                setRating(0);
                setComment('');
                setCurrentIndex(prev => prev + 1);
            } else {
                onClose(); // Finished all
            }
        } catch (error) {
            console.error("Rating failed", error);
            alert("Failed to submit rating");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md"
            >
                <Card className="shadow-2xl border-none">
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold font-heading text-text mb-2">Rate {currentUser.name}</h3>
                        <p className="text-primary text-xs uppercase font-bold tracking-widest bg-primary/10 py-1 px-3 rounded-full inline-block">
                            {userRole === 'driver' ? 'Passenger' : 'Driver'} {currentIndex + 1} of {usersToRate.length}
                        </p>
                    </div>

                    <div className="flex flex-col items-center mb-6">
                        <div className="relative">
                            <img
                                src={currentUser.profilePicture || `https://ui-avatars.com/api/?name=${currentUser.name}&background=random`}
                                alt={currentUser.name}
                                className="w-24 h-24 rounded-full object-cover border-4 border-surface shadow-lg mb-4"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-surface rounded-full p-1.5 shadow-md">
                                {rating > 0 ? (
                                    <span className="text-xl animate-bounce d-block">⭐</span>
                                ) : (
                                    <span className="text-xl grayscale opacity-50">⭐</span>
                                )}
                            </div>
                        </div>

                        {/* Star Rating */}
                        <div className="flex gap-2 mb-2 p-2 bg-neutral/30 rounded-full">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className={`text-4xl transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none ${star <= rating ? 'text-warning drop-shadow-sm' : 'text-neutral-300'}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        <div className="h-6 text-sm font-bold text-primary">
                            {rating === 5 && "Excellent! 🤩"}
                            {rating === 4 && "Great! 👍"}
                            {rating === 3 && "Good 🙂"}
                            {rating === 2 && "Fair 😐"}
                            {rating === 1 && "Poor 😞"}
                        </div>
                    </div>

                    <textarea
                        className="w-full bg-background border border-border rounded-xl p-4 mb-6 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none h-28 text-sm transition-all shadow-inner"
                        placeholder={`How was your experience with ${currentUser.name}? (Optional)`}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />

                    <Button
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                        variant="primary"
                        fullWidth
                        size="lg"
                        className="shadow-lg shadow-primary/20"
                    >
                        {isSubmitting ? 'Submitting...' : currentIndex < usersToRate.length - 1 ? 'Next Person' : 'Finish Rating'}
                    </Button>
                </Card>
            </motion.div>
        </div>
    );
};

export default RatePassengers;
