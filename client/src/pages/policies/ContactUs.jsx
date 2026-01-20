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
                            You may contact us using the information below:
                        </p>

                        <div className="bg-surface/30 p-6 rounded-2xl border border-white/5 space-y-4">
                            <h3 className="text-xl font-bold text-text">Merchant Information</h3>

                            <div>
                                <p className="font-semibold text-text">Legal Entity Name:</p>
                                <p>KRUSHNA RAKESH GANGURDE</p>
                            </div>

                            <div>
                                <p className="font-semibold text-text">Registered Address:</p>
                                <p>FLAT NO 18 BUILDING NO 2 SAIBHANDHAN, SOCIETY INDIRA NAGAR WADALA PATHARDI ROAD, NASHIK, MAHARASHTRA 422009</p>
                            </div>

                            <div>
                                <p className="font-semibold text-text">Operational Address:</p>
                                <p>FLAT NO 18 BUILDING NO 2 SAIBHANDHAN, SOCIETY INDIRA NAGAR WADALA PATHARDI ROAD, NASHIK, MAHARASHTRA 422009</p>
                            </div>

                            <div>
                                <p className="font-semibold text-text">Telephone No:</p>
                                <p>8999283790</p>
                            </div>

                            <div>
                                <p className="font-semibold text-text">E-Mail ID:</p>
                                <p><a href="mailto:tycog12025@gmail.com" className="text-primary hover:underline">tycog12025@gmail.com</a></p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ContactUs;
