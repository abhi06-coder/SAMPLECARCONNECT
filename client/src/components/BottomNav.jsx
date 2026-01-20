import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const BottomNav = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [showMoreMenu, setShowMoreMenu] = useState(false);

    // Only show for authenticated users
    if (!user) return null;

    const navItems = [
        {
            label: 'Dashboard',
            path: '/dashboard',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            )
        },
        {
            label: 'Find',
            path: '/search-rides',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            )
        },
        {
            label: 'Home',
            path: '/',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        {
            label: 'List', // List Ride
            path: '/offer-ride',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            )
        },
        {
            label: 'More',
            isMenu: true,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
            )
        }
    ];

    const NavItem = ({ item }) => {
        const isActive = location.pathname === item.path;

        if (item.isMenu) {
            return (
                <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${showMoreMenu ? 'text-primary' : 'text-text-muted hover:text-primary transition-colors'}`}
                >
                    {item.icon}
                    <span className="text-xs font-medium">{item.label}</span>
                </button>
            );
        }

        return (
            <Link
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-text-muted hover:text-primary transition-colors'}`}
            >
                {item.icon}
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                    <motion.div
                        layoutId="nav-indicator"
                        className="absolute bottom-2 w-1 h-1 bg-primary rounded-full"
                    />
                )}
            </Link>
        );
    };

    return (
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-[200]">
            {/* More Menu Overlay */}
            <AnimatePresence>
                {showMoreMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMoreMenu(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[190]"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="absolute bottom-20 right-0 w-48 bg-surface rounded-2xl shadow-xl border border-border overflow-hidden z-[200] origin-bottom-right"
                        >
                            <div className="p-2 space-y-1">
                                <Link
                                    to="/profile"
                                    onClick={() => setShowMoreMenu(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text hover:bg-neutral transition-colors"
                                >
                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    Profile
                                </Link>
                                <Link
                                    to="/my-bookings"
                                    onClick={() => setShowMoreMenu(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text hover:bg-neutral transition-colors"
                                >
                                    <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                    My Bookings
                                </Link>
                                <div className="h-px bg-border my-1"></div>
                                <button
                                    onClick={() => { logout(); setShowMoreMenu(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-error hover:bg-error/10 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                    Logout
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Navigation Bar */}
            <div className="glass rounded-2xl h-16 px-6 flex items-center justify-between relative mx-auto max-w-sm">
                {navItems.map((item, index) => (
                    <NavItem key={index} item={item} />
                ))}
            </div>
        </div>
    );
};

export default BottomNav;
