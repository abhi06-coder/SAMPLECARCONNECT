import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const TopLoadingBar = () => {
    const [progress, setProgress] = useState(0);
    const location = useLocation();

    useEffect(() => {
        // Reset and start animation on route change
        setProgress(0);
        let interval;

        // Start progress
        interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90; // Hold at 90% until we mimic "done" (which is just time based here)
                }
                const diff = Math.random() * 10;
                return Math.min(prev + diff, 90);
            });
        }, 100);

        // Finish quickly to simulate load (since we don't have real page load events in SPA)
        const timeout = setTimeout(() => {
            setProgress(100);
            clearInterval(interval);
            setTimeout(() => setProgress(0), 500); // Hide after completing
        }, 800); // Arbitrary 800ms load time simulation

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [location]);

    if (progress === 0) return null;

    return (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-surface-elevated overflow-hidden z-50">
            <div
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    );
};

export default TopLoadingBar;
