import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen pt-24 px-4 pb-12">
            <div className="container-custom max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface/50 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-white/10 shadow-xl"
                >
                    <h1 className="text-3xl md:text-4xl font-bold font-heading mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Privacy Policy
                    </h1>

                    <div className="space-y-6 text-text-muted leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">1. Overview</h2>
                            <p>
                                This Privacy Policy describes how CarConnect collects, uses, and protects your information.
                                As this is an <strong>educational project</strong>, we prioritize data privacy and transparency.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">2. Information We Collect</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Account Information:</strong> Name, email address, and phone number provided during signup.</li>
                                <li><strong>Ride Data:</strong> Origin, destination, and travel dates when you post or book a ride.</li>
                                <li><strong>Payment Information:</strong> We do <strong>NOT</strong> store sensitive payment data (like credit card numbers).
                                    All payments are securely processed by <strong>Razorpay</strong>. We only receive transaction status updates.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">3. How We Use Your Information</h2>
                            <p>
                                We use your data securely to:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>Facilitate ride sharing matches between drivers and passengers.</li>
                                <li>Send ride notifications and booking confirmations.</li>
                                <li>Maintain platform safety and prevent fraud.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">4. Data Security</h2>
                            <p>
                                We implement industry-standard security measures to protect your personal information.
                                However, please note that this is a demonstration platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">5. Contact Us</h2>
                            <p>
                                If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@carconnect.demo" className="text-primary hover:underline">privacy@carconnect.demo</a>.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
