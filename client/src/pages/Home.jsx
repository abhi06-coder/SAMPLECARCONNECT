import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import GradientText from '../components/GradientText';
import { MapPin, Calendar, Search, ArrowRight, Shield, Zap, Leaf, MessageCircle, CreditCard, Users, Clock } from 'lucide-react';
import { useState } from 'react';

const Home = () => {
    // Helper to get tomorrow's date in YYYY-MM-DD format
    const getTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    const popularRoutes = [
        { from: "Mumbai", to: "Pune" },
        { from: "Bangalore", to: "Mysore" },
        { from: "Delhi", to: "Agra" },
        { from: "Chennai", to: "Pondicherry" },
        { from: "Hyderabad", to: "Vijayawada" },
        { from: "Jaipur", to: "Delhi" },
        { from: "Pune", to: "Lonavala" },
        { from: "Chandigarh", to: "Manali" }
    ];

    const features = [
        {
            icon: <Shield className="w-8 h-8 text-success" />,
            title: "Verified Drivers",
            desc: "Every driver is ID-verified for maximum safety and trust."
        },
        {
            icon: <Search className="w-8 h-8 text-primary" />,
            title: "Smart Ride Matching",
            desc: "Find rides that match your exact route, time, and preferences."
        },
        {
            icon: <Users className="w-8 h-8 text-secondary" />,
            title: "Seat Availability",
            desc: "See real-time seat availability and book instantly."
        },
        {
            icon: <CreditCard className="w-8 h-8 text-warning" />,
            title: "Flexible Payments",
            desc: "Pay securely via UPI, Wallet, or Cash as per your choice."
        },
        {
            icon: <MapPin className="w-8 h-8 text-info" />,
            title: "Route Preview",
            desc: "View the exact route on the map before you book your seat."
        },
        {
            icon: <Clock className="w-8 h-8 text-success" />,
            title: "Waitlist System",
            desc: "Join the waitlist for full rides and get notified if a seat opens up."
        }
    ];

    return (
        <div className="min-h-screen bg-transparent text-text">
            <section className="relative overflow-hidden pt-14 pb-12 lg:pt-20 lg:pb-20 min-h-[calc(100vh-4rem)] flex items-center justify-center">
                {/* Floating Illustration - Abstract Car/Map Concept */}
                <motion.div
                    className="absolute top-1/4 right-[10%] hidden lg:block opacity-20 pointer-events-none"
                    animate={{ y: [0, -20, 0] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                >
                    <svg width="300" height="300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="40" stroke="url(#paint0_linear)" strokeWidth="0.5" />
                        <path d="M30 50L45 65L70 35" stroke="url(#paint0_linear)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <defs>
                            <linearGradient id="paint0_linear" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#5227FF" />
                                <stop offset="1" stopColor="#B19EEF" />
                            </linearGradient>
                        </defs>
                    </svg>
                </motion.div>

                <div className="container-custom relative z-10">
                    <div className="flex flex-col items-center text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="max-w-4xl space-y-6 lg:space-y-8"
                        >

                            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold font-heading tracking-tight text-text leading-snug mt-4 lg:mt-0 py-2">
                                <span className="block text-text pb-2">Travel Together,</span>
                                <GradientText
                                    colors={["#5227FF", "#941490", "#B19EEF", "#5227FF"]} // Added restart color for smoother loop
                                    animationSpeed={6} // Slightly faster for "alive" feel
                                    showBorder={false}
                                    className="block"
                                >
                                    Save Together.
                                </GradientText>
                            </h1>
                            <p className="text-lg md:text-xl text-text-muted leading-relaxed max-w-2xl mx-auto">
                                Join India's most trusted carpooling community. Share rides, split costs, and make travel eco-friendly and fun.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col items-center gap-2">
                                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 w-full sm:w-auto">
                                    <Link to="/search-rides">
                                        <Button
                                            size="lg"
                                            className="w-full sm:w-auto text-lg h-14 px-8 shadow-[0_0_20px_rgba(82,39,255,0.3)] hover:shadow-[0_0_30px_rgba(82,39,255,0.5)] transition-all duration-300 transform hover:scale-105"
                                        >
                                            Find a Ride
                                        </Button>
                                    </Link>
                                    <Link to="/offer-ride">
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="w-full sm:w-auto text-lg h-14 px-8 border-2 border-text/20 text-text hover:bg-surface-elevated hover:border-text/50 hover:text-primary transition-all duration-300"
                                            leftIcon={<Zap className="w-5 h-5" />}
                                        >
                                            Offer a Ride
                                        </Button>
                                    </Link>
                                </div>
                                <p className="text-xs text-text-muted mt-2 animate-pulse">It takes 10 seconds to find a ride.</p>
                            </div>

                            {/* Popular Routes Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.6 }}
                                className="mt-12 max-w-5xl mx-auto w-full px-4"
                            >
                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-semibold text-text mb-2">Popular Routes</h3>
                                    <p className="text-sm text-text-muted">Tap a route to search instantly. You can refine pickup points on the next screen.</p>
                                </div>

                                <div className="flex flex-wrap justify-center gap-3">
                                    {popularRoutes.map((route, idx) => (
                                        <Link
                                            key={idx}
                                            to={`/search-rides?source=${route.from}&destination=${route.to}&date=${getTomorrowDate()}`}
                                        >
                                            <motion.div
                                                whileHover={{ scale: 1.05, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="group relative overflow-hidden bg-surface/40 backdrop-blur-sm border border-white/10 hover:border-primary/40 rounded-full px-6 py-3 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-primary/10 cursor-pointer"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                                <div className="flex items-center gap-2 text-sm font-medium text-text group-hover:text-primary transition-colors relative z-10">
                                                    <span>{route.from}</span>
                                                    <ArrowRight className="w-3 h-3 text-text-muted group-hover:text-primary transition-colors" />
                                                    <span>{route.to}</span>
                                                </div>
                                            </motion.div>
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>


                            <div className="pt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-text-muted">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="flex items-center gap-2"
                                >
                                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" /> 500+ Active Rides
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                    className="flex items-center gap-2"
                                >
                                    <Shield className="w-4 h-4 text-primary" /> Verified Profiles
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Feature Cards */}
            <section id="features" className="py-20 bg-surface/10 backdrop-blur-md relative z-10 mt-8 mx-4 rounded-3xl border border-white/10">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: -40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -10 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{
                                    duration: 0.6,
                                    ease: [0.22, 1, 0.36, 1],
                                    delay: idx * 0.1
                                }}
                                className="bg-surface/40 p-6 lg:p-8 rounded-2xl shadow-xl border border-white/10 hover:bg-surface/60 hover:shadow-2xl hover:border-primary/30 transition-all duration-300 group backdrop-blur-sm relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full filter blur-[50px] group-hover:bg-primary/10 transition-colors" />

                                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-neutral to-surface-elevated flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300 relative z-10">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold font-heading mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                                <p className="text-text-muted leading-relaxed text-sm lg:text-base mb-4">
                                    {feature.desc}
                                </p>
                                <div className="flex items-center text-primary font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                                    Learn more <ArrowRight className="w-4 h-4 ml-1" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-20 lg:py-24 bg-transparent scroll-mt-20">
                <div className="container-custom text-center">
                    <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4 bg-surface/30 inline-block px-8 py-2 rounded-full backdrop-blur-sm">
                        How <span className="text-primary">CarConnect</span> Works
                    </h2>
                    <p className="text-lg text-text-muted mb-12 lg:mb-16">3 simple steps. No hassle.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative max-w-5xl mx-auto">
                        {/* Connecting Line for Desktop */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-neutral-foreground/20 -z-10 overflow-hidden">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: "0%" }}
                                whileInView={{ width: "100%" }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                            />
                        </div>

                        {/* Step 1 */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="relative group"
                        >
                            <div className="w-24 h-24 mx-auto bg-surface/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-3xl font-bold text-primary mb-6 border-4 border-white/10 relative z-10 group-hover:scale-110 transition-transform duration-300">
                                <Search className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 drop-shadow-md">Search</h3>
                            <p className="text-text-muted px-4 font-medium">Enter your destination and date to find verified drivers going your way.</p>
                        </motion.div>

                        {/* Step 2 */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="relative group"
                        >
                            <div className="w-24 h-24 mx-auto bg-surface/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-3xl font-bold text-secondary mb-6 border-4 border-white/10 relative z-10 group-hover:scale-110 transition-transform duration-300">
                                <MessageCircle className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 drop-shadow-md">Request</h3>
                            <p className="text-text-muted px-4 font-medium">Check profile reviews and request a seat strictly through the app.</p>
                        </motion.div>

                        {/* Step 3 */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                            className="relative group"
                        >
                            <div className="w-24 h-24 mx-auto bg-surface/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-3xl font-bold text-success mb-6 border-4 border-white/10 relative z-10 group-hover:scale-110 transition-transform duration-300">
                                <MapPin className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 drop-shadow-md">Travel</h3>
                            <p className="text-text-muted px-4 font-medium">Meet at the pickup point, enjoy the ride, and save money together!</p>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
