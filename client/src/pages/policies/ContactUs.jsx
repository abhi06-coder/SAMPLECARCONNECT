import React from 'react';
import { motion } from 'framer-motion';

const ContactUs = () => {
    return (
        <div className="min-h-screen pt-24 px-4 pb-12">
            <div className="container-custom max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface/50 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-white/10 shadow-xl"
                >
                    <h1 className="text-3xl md:text-4xl font-bold font-heading mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Contact Us
                    </h1>

                    <div className="space-y-6 text-text-muted leading-relaxed">
                        <p>
                            We value your feedback and are here to help with any questions or concerns you may have regarding CarConnect.
                        </p>

                        <div className="bg-surface/30 p-6 rounded-2xl border border-white/5 space-y-4">
                            <h3 className="text-xl font-bold text-text">Get in Touch</h3>

                            <div>
                                <p className="font-semibold text-text">Platform Owner / Administrator:</p>
                                <p>CarConnect Admin Team</p>
                            </div>

                            <div>
                                <p className="font-semibold text-text">Email Support:</p>
                                <p><a href="mailto:support@carconnect.demo" className="text-primary hover:underline">support@carconnect.demo</a></p>
                            </div>

                            <div>
                                <p className="font-semibold text-text">Operational Address:</p>
                                <p>CarConnect Project HQ<br />
                                    123 Education Lane, Tech Campus<br />
                                    Mumbai, Maharashtra, India - 400001</p>
                            </div>
                        </div>

                        <div className="bg-surface/30 p-6 rounded-2xl border border-white/5">
                            <h3 className="text-xl font-bold text-text mb-2">Important Note</h3>
                            <p className="text-sm">
                                This web application is developed strictly for <strong>educational and project demonstration purposes</strong>.
                                No real commercial services are provided. Payments processed are for demonstration only.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ContactUs;
