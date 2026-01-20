import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-surface/50 backdrop-blur-md border-t border-white/10 pt-16 pb-8 mt-20">
            <div className="container-custom">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link to="/" className="text-2xl font-bold font-heading bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            CarConnect
                        </Link>
                        <p className="text-text-muted text-sm leading-relaxed">
                            India's most trusted carpooling community. Travel together, save together, and help the planet.
                        </p>
                        <p className="text-xs text-text-muted/60 mt-4">
                            Developed for educational / project demonstration purposes.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold mb-6 text-text">Quick Links</h4>
                        <ul className="space-y-3 text-sm text-text-muted">
                            <li><Link to="/search-rides" className="hover:text-primary transition-colors">Find a Ride</Link></li>
                            <li><Link to="/offer-ride" className="hover:text-primary transition-colors">Offer a Ride</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="font-bold mb-6 text-text">Support</h4>
                        <ul className="space-y-3 text-sm text-text-muted">
                            <li><Link to="/contact-us" className="hover:text-primary transition-colors">Contact Us</Link></li>
                            <li><Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms-and-conditions" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-bold mb-6 text-text">Legal</h4>
                        <ul className="space-y-3 text-sm text-text-muted">
                            <li><Link to="/refund-policy" className="hover:text-primary transition-colors">Cancellation & Refund</Link></li>
                            <li><Link to="/shipping-policy" className="hover:text-primary transition-colors">Shipping Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-muted">
                    <p>&copy; {currentYear} CarConnect. All rights reserved.</p>
                    <p>Payments processed securely via Razorpay.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
