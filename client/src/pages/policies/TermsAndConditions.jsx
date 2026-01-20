import React from 'react';
import { motion } from 'framer-motion';

const TermsAndConditions = () => {
    return (
        <div className="min-h-screen pt-24 px-4 pb-12">
            <div className="container-custom max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface/50 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-white/10 shadow-xl"
                >
                    <h1 className="text-3xl md:text-4xl font-bold font-heading mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Terms and Conditions
                    </h1>

                    <div className="space-y-6 text-text-muted leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">1. Introduction</h2>
                            <p>
                                Welcome to CarConnect. By accessing or using our website, you agree to be bound by these Terms and Conditions.
                                PLEASE NOTE: This platform is for <strong>educational and demonstration purposes only</strong>.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">2. User Accounts</h2>
                            <p>
                                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                                You must provide accurate and complete information during registration.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">3. Services Provided</h2>
                            <p>
                                CarConnect is a platform to connect car owners/drivers with passengers looking to share a ride.
                                We do not own any vehicles nor do we provide transportation services directly.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">4. Payments</h2>
                            <p>
                                All payments for ride bookings are processed securely via <strong>Razorpay</strong>.
                                CarConnect does not store any card details. Any transaction fees or charges are clearly displayed before payment.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">5. Limitation of Liability</h2>
                            <p>
                                Since this is an educational project, CarConnect and its developers shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use of this service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">6. Changes to Terms</h2>
                            <p>
                                We reserve the right to modify these terms at any time. Continued use of the platform following any changes indicates your acceptance of the new terms.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default TermsAndConditions;
