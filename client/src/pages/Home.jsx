import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import GradientText from '../components/GradientText';

const Home = () => {
    const features = [
        {
            icon: (
                <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            title: "Safe & Verified",
            desc: "Every member is verified with government ID and phone checks."
        },
        {
            icon: (
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            title: "Low-Cost Rides",
            desc: "Save up to 75% on travel costs by sharing your journey."
        },
        {
            icon: (
                <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            title: "Eco-Friendly",
            desc: "Reduce your carbon footprint. Help the planet one ride at a time."
        },
        {
            icon: (
                <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            title: "Real-Time Tracking",
            desc: "Track your ride live on the map. Share your location with loved ones for extra safety."
        },
        {
            icon: (
                <svg className="w-8 h-8 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ),
            title: "Instant Chat",
            desc: "Coordinate pick-ups easily. Chat securely with your co-travelers within the app."
        },
        {
            icon: (
                <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
            title: "Secure Payments",
            desc: "Cashless and hassle-free. Pay securely via UPI, Credit Card, or Wallet."
        }
    ];

    return (
        <div className="min-h-screen bg-transparent text-text">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-20 pb-12 lg:pt-28 lg:pb-20 min-h-[calc(100vh-4rem)] flex items-center justify-center">
                {/* Background blobs removed for Plasma visibility */}

                <div className="container-custom">
                    <div className="flex flex-col items-center text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="max-w-4xl space-y-6 lg:space-y-8"
                        >

                            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold font-heading tracking-tight text-text leading-tight mt-4 lg:mt-0">
                                <GradientText
                                    colors={["#0f172a", "#334155", "#0f172a"]} // Dark colors for "Travel Together" part to look like normal text but with subtle gradient
                                    animationSpeed={8}
                                    showBorder={false}
                                    className="block"
                                >
                                    Travel Together,
                                </GradientText>
                                <GradientText
                                    colors={["#5227FF", "#941490", "#B19EEF"]} // User provided colors
                                    animationSpeed={8}
                                    showBorder={false}
                                    className="block"
                                >
                                    Save Together.
                                </GradientText>
                            </h1>
                            <p className="text-lg md:text-xl text-text-muted leading-relaxed max-w-2xl mx-auto">
                                Join India's most trusted carpooling community. Share rides, split costs, and make travel eco-friendly and fun.
                            </p>

                            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                                <Link to="/search-rides">
                                    <Button
                                        size="lg"
                                        className="w-full sm:w-auto text-lg h-auto py-4 shadow-lg shadow-primary/30 hover:shadow-primary/50 group"
                                        leftIcon={<svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                                    >
                                        Find a Ride
                                    </Button>
                                </Link>
                                <Link to="/offer-ride">
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="w-full sm:w-auto text-lg h-auto py-4 border-2 border-text text-text hover:bg-text hover:text-background"
                                        leftIcon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>}
                                    >
                                        Offer a Ride
                                    </Button>
                                </Link>
                            </div>

                            <div className="pt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-text-muted">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" /> 500+ Active Rides
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-warning" /> Verified Profiles
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Feature Cards */}
            <section id="features" className="py-20 bg-surface/10 backdrop-blur-md relative z-10 -mt-10 lg:-mt-32 mx-4 rounded-3xl border border-white/10">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-surface/40 p-6 lg:p-8 rounded-2xl shadow-xl border border-white/10 hover:bg-surface/60 hover:shadow-2xl hover:border-primary/30 transition-all duration-300 group backdrop-blur-sm"
                            >
                                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-neutral to-surface-elevated flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold font-heading mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                                <p className="text-text-muted leading-relaxed text-sm lg:text-base">
                                    {feature.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-20 lg:py-24 bg-transparent scroll-mt-20">
                <div className="container-custom text-center">
                    <h2 className="text-3xl md:text-4xl font-bold font-heading mb-12 lg:mb-16 bg-surface/30 inline-block px-8 py-2 rounded-full backdrop-blur-sm">
                        How <span className="text-primary">CarConnect</span> Works
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative max-w-5xl mx-auto">
                        {/* Connecting Line for Desktop */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-neutral-foreground/20 -z-10"></div>

                        {/* Step 1 */}
                        <div className="relative group">
                            <div className="w-24 h-24 mx-auto bg-surface/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-3xl font-bold text-primary mb-6 border-4 border-white/10 relative z-10 group-hover:scale-110 transition-transform duration-300">
                                1
                            </div>
                            <h3 className="text-xl font-bold mb-3 drop-shadow-md">Search</h3>
                            <p className="text-text-muted px-4 font-medium">Enter your destination and date to find verified drivers going your way.</p>
                        </div>

                        {/* Step 2 */}
                        <div className="relative group">
                            <div className="w-24 h-24 mx-auto bg-surface/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-3xl font-bold text-secondary mb-6 border-4 border-white/10 relative z-10 group-hover:scale-110 transition-transform duration-300">
                                2
                            </div>
                            <h3 className="text-xl font-bold mb-3 drop-shadow-md">Request</h3>
                            <p className="text-text-muted px-4 font-medium">Check profile reviews and request a seat strictly through the app.</p>
                        </div>

                        {/* Step 3 */}
                        <div className="relative group">
                            <div className="w-24 h-24 mx-auto bg-surface/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-3xl font-bold text-success mb-6 border-4 border-white/10 relative z-10 group-hover:scale-110 transition-transform duration-300">
                                3
                            </div>
                            <h3 className="text-xl font-bold mb-3 drop-shadow-md">Travel</h3>
                            <p className="text-text-muted px-4 font-medium">Meet at the pickup point, enjoy the ride, and save money together!</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
