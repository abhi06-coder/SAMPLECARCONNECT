import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';

const Feedback = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [category, setCategory] = useState('General');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        try {
            const res = await api.get('/feedback/my');
            setFeedbacks(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        setSubmitting(true);
        setError('');
        setSuccessMsg('');

        try {
            const res = await api.post('/feedback', { message, category });
            setFeedbacks([res.data, ...feedbacks]);
            setMessage('');
            setSuccessMsg('Feedback submitted successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit feedback');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8 max-w-2xl"
        >
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-text">Feedback & Suggestions</h3>
            </div>

            {/* Submission Form */}
            <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm">
                <h4 className="font-bold text-text mb-4">Submit Feedback</h4>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-text font-medium text-sm mb-1.5 px-1">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-text outline-none transition-all"
                        >
                            <option value="General">General</option>
                            <option value="Bug">Bug Report</option>
                            <option value="Feature">Feature Request</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-text font-medium text-sm mb-1.5 px-1">Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                            placeholder="Tell us what you think or what went wrong..."
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-text resize-none transition-all placeholder:text-text-muted/50 outline-none"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        {successMsg && <span className="text-success text-sm font-medium">{successMsg}</span>}
                        {error && <span className="text-error text-sm font-medium">{error}</span>}
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={submitting}
                            className="ml-auto"
                        >
                            Submit
                        </Button>
                    </div>
                </form>
            </div>

            {/* History List */}
            <div className="space-y-4">
                <h4 className="font-bold text-text px-1">Your History</h4>
                {loading ? (
                    <div className="text-center py-8 text-text-muted">Loading...</div>
                ) : feedbacks.length === 0 ? (
                    <div className="text-center py-8 bg-neutral/30 rounded-2xl border-2 border-dashed border-border mb-4">
                        <p className="text-text-muted">No feedback submitted yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {feedbacks.map((item) => (
                            <div key={item._id} className="bg-surface border border-border p-5 rounded-xl transition-all hover:shadow-md">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={item.category === 'Bug' ? 'error' : item.category === 'Feature' ? 'primary' : 'neutral'}>
                                            {item.category}
                                        </Badge>
                                        <span className="text-xs text-text-muted">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <Badge variant={item.status === 'Open' ? 'warning' : 'success'}>
                                        {item.status}
                                    </Badge>
                                </div>
                                <p className="text-text mb-3">{item.message}</p>
                                {item.adminReply && (
                                    <div className="bg-neutral/50 p-3 rounded-lg border-l-4 border-primary text-sm">
                                        <span className="font-bold text-primary block mb-1">Admin Reply:</span>
                                        <p className="text-text-muted">{item.adminReply}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default Feedback;
