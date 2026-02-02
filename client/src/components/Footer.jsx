import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    ChevronDown,
    ShieldCheck,
    CreditCard,
    Globe,
    Heart,
    Mail,
    Lock,
    FileText
} from 'lucide-react';

const Footer = () => {
    const { user } = useAuth();
    const currentYear = new Date().getFullYear();
    const [expandedSection, setExpandedSection] = useState(null);

    const toggleSection = (section) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    // Animation variants
    const linkHover = {
        rest: { x: 0 },
        hover: { x: 5, color: "#8b5cf6", transition: { duration: 0.2 } }
    };

    const socialHover = {
        rest: { scale: 1 },
        hover: { scale: 1.1, color: "#8b5cf6", transition: { duration: 0.2 } }
    };

    const MobileAccordion = ({ title, section, children }) => (
        <div className="border-b border-white/5 md:border-none">
            <button
                onClick={() => toggleSection(section)}
                className="flex justify-between items-center w-full py-4 md:py-0 md:cursor-default md:pointer-events-none group"
            >
                <h4 className="font-bold text-text text-lg group-hover:text-primary transition-colors md:group-hover:text-text md:mb-6">{title}</h4>
                <ChevronDown
                    className={`w-5 h-5 text-text-muted transition-transform md:hidden ${expandedSection === section ? 'rotate-180' : ''}`}
                />
            </button>
            <AnimatePresence>
                {(expandedSection === section || window.innerWidth >= 768) && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden md:h-auto md:opacity-100 md:block" // Force show on desktop
                    >
                        <div className="pb-4 md:pb-0">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <footer className="bg-gradient-to-b from-surface/50 to-surface backdrop-blur-md border-t border-white/10 pt-16 pb-8 mt-20 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="container-custom relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
                    {/* 1. Brand Section */}
                    <div className="space-y-6 md:col-span-1">
                        <Link to="/" className="inline-block">
                            <h2 className="text-3xl font-bold font-heading bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent">
                                CarConnect
                            </h2>
                        </Link>
                        <p className="text-text-muted text-sm leading-relaxed max-w-xs">
                            India's trusted carpooling community.
                            <span className="block mt-2">Travel together, save costs, and reduce your carbon footprint with every ride.</span>
                        </p>

                        <div className="flex gap-4 pt-2">
                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, idx) => (
                                <motion.a
                                    key={idx}
                                    href="#"
                                    variants={socialHover}
                                    initial="rest"
                                    whileHover="hover"
                                    className="p-2 bg-white/5 rounded-full text-text-muted hover:bg-white/10 transition-colors"
                                >
                                    <Icon size={18} />
                                </motion.a>
                            ))}
                        </div>

                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg max-w-xs">
                            <p className="text-xs text-yellow-500/80 flex items-start gap-2">
                                <Globe size={14} className="mt-0.5 shrink-0" />
                                Developed for educational / project demonstration purposes only.
                            </p>
                        </div>
                    </div>

                    {/* 2. Quick Links */}
                    <MobileAccordion title="Quick Links" section="quick-links">
                        <ul className="space-y-3">
                            <FooterLink to="/search-rides" variants={linkHover}>Find a Ride</FooterLink>
                            <FooterLink to="/offer-ride" variants={linkHover}>Offer a Ride</FooterLink>
                            {user && (
                                <>
                                    <FooterLink to="/my-bookings" variants={linkHover}>My Bookings</FooterLink>
                                    {(user.isDriver || user.role === 'admin') && (
                                        <FooterLink to="/dashboard" variants={linkHover}>Driver Dashboard</FooterLink>
                                    )}
                                </>
                            )}
                        </ul>
                    </MobileAccordion>

                    {/* 3. Support */}
                    <MobileAccordion title="Support" section="support">
                        <ul className="space-y-3">
                            <FooterLink to="/contact-us" variants={linkHover}>
                                <span className="flex items-center gap-2">
                                    <Mail size={14} className="text-primary/70" /> Contact Us
                                </span>
                            </FooterLink>
                            <FooterLink to="/privacy-policy" variants={linkHover}>
                                <span className="flex items-center gap-2">
                                    <Lock size={14} className="text-primary/70" /> Privacy Policy
                                </span>
                            </FooterLink>
                            <FooterLink to="/terms-and-conditions" variants={linkHover}>
                                <span className="flex items-center gap-2">
                                    <FileText size={14} className="text-primary/70" /> Terms & Conditions
                                </span>
                            </FooterLink>
                        </ul>
                    </MobileAccordion>

                    {/* 4. Legal */}
                    <MobileAccordion title="Legal" section="legal">
                        <ul className="space-y-3">
                            <FooterLink to="/refund-policy" variants={linkHover}>Cancellation & Refund</FooterLink>
                            <FooterLink to="/shipping-policy" variants={linkHover}>Shipping Policy</FooterLink>
                            <li className="pt-4">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm group hover:border-primary/30 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CreditCard size={18} className="text-primary" />
                                        <span className="text-xs font-semibold text-text">Secure Payments</span>
                                    </div>
                                    <p className="text-[10px] text-text-muted leading-tight">
                                        Payments processed securely via <span className="font-bold text-blue-400">Razorpay</span>.
                                        We do not store card details.
                                    </p>
                                </div>
                            </li>
                        </ul>
                    </MobileAccordion>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/5 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-muted/60">
                    <p>&copy; {currentYear} CarConnect. All rights reserved.</p>
                    <div className="flex items-center gap-1">
                        <span>Made with</span>
                        <Heart size={12} className="text-red-500 fill-red-500" />
                        <span>for a better planet</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

// Helper component for Links to keep animating consistent
const FooterLink = ({ to, children, variants }) => (
    <motion.li initial="rest" whileHover="hover" animate="rest">
        <Link
            to={to}
            className="text-sm text-text-muted hover:text-white transition-colors block py-1"
        >
            <motion.span variants={variants} className="inline-block">
                {children}
            </motion.span>
        </Link>
    </motion.li>
);

export default Footer;
