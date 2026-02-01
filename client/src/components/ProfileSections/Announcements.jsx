import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import Badge from '../ui/Badge';

const Announcements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await api.get('/announcements');
            setAnnouncements(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8 max-w-3xl"
        >
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-text">Announcements & News</h3>
            </div>

            <div className="space-y-6">
                {loading ? (
                    <div className="text-center py-8 text-text-muted">Loading...</div>
                ) : announcements.length === 0 ? (
                    <div className="text-center py-12 bg-neutral/30 rounded-3xl border-2 border-dashed border-border">
                        <div className="w-16 h-16 bg-neutral/50 rounded-full flex items-center justify-center mx-auto mb-4 text-text-muted">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                        </div>
                        <h4 className="font-bold text-text">No Announcements</h4>
                        <p className="text-text-muted mt-1">Check back later for updates and news.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {announcements.map((item) => (
                            <div key={item._id} className="group relative bg-surface border border-border p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden">
                                {/* Decor */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-lg font-bold text-text pr-8">{item.title}</h4>
                                        <Badge variant="neutral" className="bg-surface border-border whitespace-nowrap">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </Badge>
                                    </div>
                                    <p className="text-text-muted leading-relaxed whitespace-pre-wrap">{item.message}</p>

                                    {/* Footer / Context */}
                                    <div className="mt-6 flex flex-wrap gap-2">
                                        {item.targetRoles?.includes('driver') && (
                                            <Badge variant="primary" className="text-xs bg-primary/10 text-primary border-primary/20">Driver Update</Badge>
                                        )}
                                        {item.targetRegions?.length > 0 && (
                                            <Badge variant="warning" className="text-xs bg-warning/10 text-warning-dark border-warning/20">
                                                📍 {item.targetRegions.join(', ')}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default Announcements;
