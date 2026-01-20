import React from 'react';
import { motion } from 'framer-motion';

const ShippingPolicy = () => {
    return (
        <div className="min-h-screen pt-24 px-4 pb-12">
            <div className="container-custom max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface/50 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-white/10 shadow-xl"
                >
                    <h1 className="text-3xl md:text-4xl font-bold font-heading mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Shipping Policy
                    </h1>

                    <div className="space-y-6 text-text-muted leading-relaxed">
                        <div className="bg-surface/30 p-6 rounded-2xl border border-white/5">
                            <h2 className="text-xl font-bold text-text mb-4">Not Applicable</h2>
                            <p>
                                CarConnect is a digital carpooling platform connecting drivers and passengers.
                            </p>
                            <p className="mt-4">
                                <strong>We do not sell or ship physical goods.</strong>
                            </p>
                            <p className="mt-2">
                                All services are provided digitally through our web application. As such, there are no shipping charges, delivery timelines, or physical returns associated with our service.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ShippingPolicy;
