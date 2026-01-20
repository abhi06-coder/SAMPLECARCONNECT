import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import TopLoadingBar from './TopLoadingBar';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './ui/Button';

const Navbar = () => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);

    // Handle Scroll Effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsOpen(false);
    }, [location]);

    // Lock body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const NavLink = ({ to, children }) => {
        const isActive = location.pathname === to;
        return (
            <Link
                to={to}
                className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 
                ${isActive
                        ? 'text-primary'
                        : 'text-text-muted hover:text-text hover:bg-neutral'
                    }`}
            >
                {children}
                {isActive && (
                    <motion.div
                        layoutId="navbar-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                )}
            </Link>
        );
    };

    const MobileLink = ({ to, children, onClick }) => {
        const isActive = location.pathname === to;
        return (
            <Link
                to={to}
                onClick={onClick}
                className={`block px-5 py-4 rounded-xl text-lg font-bold transition-all
                ${isActive
                        ? 'bg-primary/10 text-primary border-l-4 border-primary'
                        : 'text-text-muted hover:text-text hover:bg-neutral'
                    }`}
            >
                {children}
            </Link>
        );
    };

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className={`sticky top-0 z-[100] w-full transition-all duration-300 border-b ${scrolled ? 'glass border-border/50 shadow-sm' : 'bg-transparent border-transparent'}`}
            >
                <div className="container-custom">
                    <div className="flex justify-between items-center h-16 md:h-20">
                        {/* Logo */}
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2 group z-[101] relative">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
                                C
                            </div>
                            <span className="text-xl md:text-2xl font-bold font-heading text-text tracking-tight group-hover:opacity-90 transition-opacity">
                                CarConnect
                            </span>
                        </Link>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-2">
                            <NavLink to="/">Home</NavLink>
                            {user && (
                                <>
                                    <NavLink to="/search-rides">Find Ride</NavLink>
                                    <NavLink to="/offer-ride">Offer Ride</NavLink>
                                    <NavLink to="/my-bookings">Trips</NavLink>
                                    <NavLink to="/dashboard">Dashboard</NavLink>
                                </>
                            )}

                            <div className="h-6 w-px bg-border mx-3"></div>

                            <ThemeToggle />

                            <div className="pl-2">
                                {user ? (
                                    <div className="flex items-center gap-3">
                                        <Link to="/profile" className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-neutral transition-colors border border-transparent hover:border-border">
                                            <img
                                                src={user.profilePicture || "https://ui-avatars.com/api/?name=" + user.name}
                                                alt="Profile"
                                                className="w-8 h-8 rounded-full border border-border object-cover"
                                            />
                                            <span className="text-sm font-medium text-text max-w-[100px] truncate mr-1">{user.name?.split(' ')[0]}</span>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Link to="/login" className="text-sm font-bold text-text-muted hover:text-primary transition-colors">Login</Link>
                                        <Button
                                            size="sm"
                                            onClick={() => window.location.href = '/signup'}
                                        >
                                            Get Started
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <div className="flex items-center md:hidden gap-3 z-[101] relative">
                            <ThemeToggle />
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="p-2 rounded-full hover:bg-neutral text-text transition-colors"
                            >
                                <div className="w-6 h-5 flex flex-col justify-between relative">
                                    <motion.span
                                        animate={isOpen ? { rotate: 45, y: 9 } : { rotate: 0, y: 0 }}
                                        className="w-full h-0.5 bg-current rounded-full origin-center transition-all"
                                    />
                                    <motion.span
                                        animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
                                        className="w-full h-0.5 bg-current rounded-full transition-all"
                                    />
                                    <motion.span
                                        animate={isOpen ? { rotate: -45, y: -9 } : { rotate: 0, y: 0 }}
                                        className="w-full h-0.5 bg-current rounded-full origin-center transition-all"
                                    />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] md:hidden"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-[80%] max-w-sm bg-surface z-[100] md:hidden shadow-2xl border-l border-border flex flex-col"
                        >
                            <div className="p-6 border-b border-border flex items-center justify-between">
                                <span className="text-xl font-bold font-heading text-text">Menu</span>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-neutral rounded-full text-text-muted">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                                <MobileLink to="/" onClick={() => setIsOpen(false)}>Home</MobileLink>

                                {user ? (
                                    <>
                                        <div className="px-5 py-2 text-xs font-bold text-text-muted uppercase tracking-wider mt-4">Ride</div>
                                        <MobileLink to="/search-rides" onClick={() => setIsOpen(false)}>Find a Ride</MobileLink>
                                        <MobileLink to="/offer-ride" onClick={() => setIsOpen(false)}>Offer a Ride</MobileLink>

                                        <div className="px-5 py-2 text-xs font-bold text-text-muted uppercase tracking-wider mt-4">Account</div>
                                        <MobileLink to="/my-bookings" onClick={() => setIsOpen(false)}>My Trips</MobileLink>
                                        <MobileLink to="/dashboard" onClick={() => setIsOpen(false)}>Dashboard</MobileLink>
                                        <MobileLink to="/profile" onClick={() => setIsOpen(false)}>Profile</MobileLink>
                                    </>
                                ) : (
                                    <>
                                        <div className="mt-8 px-4 space-y-4">
                                            <Link to="/login" onClick={() => setIsOpen(false)} className="block w-full text-center py-3 font-bold text-text hover:bg-neutral rounded-xl border border-border">
                                                Log In
                                            </Link>
                                            <Link to="/signup" onClick={() => setIsOpen(false)} className="block w-full text-center py-3 font-bold text-white bg-primary rounded-xl shadow-lg shadow-primary/20">
                                                Sign Up
                                            </Link>
                                        </div>
                                    </>
                                )}
                            </div>

                            {user && (
                                <div className="p-6 border-t border-border bg-neutral/30">
                                    <button
                                        onClick={logout}
                                        className="w-full py-3 flex items-center justify-center gap-2 text-error font-bold hover:bg-error/10 rounded-xl transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            <TopLoadingBar />
        </>
    );
};

export default Navbar;

