import React from 'react';
import { motion } from 'framer-motion';

const RefundPolicy = () => {
    return (
        <div className="min-h-screen pt-24 px-4 pb-12">
            <div className="container-custom max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface/50 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-white/10 shadow-xl"
                >
                    <h1 className="text-3xl md:text-4xl font-bold font-heading mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Cancellation and Refund Policy
                    </h1>

                    <div className="space-y-6 text-text-muted leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">1. Cancellation by Passenger</h2>
                            <p>
                                Passengers can cancel their ride request at any time before the ride starts.
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li><strong>Before Appproval:</strong> Full refund.</li>
                                <li><strong>After Approval ( &gt; 24 hours before ride):</strong> Full refund.</li>
                                <li><strong>Last Minute Cancellation ( &lt; 24 hours):</strong> A small cancellation fee may apply.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">2. Cancellation by Driver</h2>
                            <p>
                                If a driver cancels a ride, passengers are eligible for a <strong>full refund</strong> of the booking amount.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">3. Refund Processing</h2>
                            <p>
                                All refunds are processed securely via <strong>Razorpay</strong> to the original payment method.
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>Refunds typically take <strong>5-7 business days</strong> to reflect in your account, depending on your bank's policies.</li>
                                <li>In case of any delays, please contact <a href="mailto:support@carconnect.demo" className="text-primary hover:underline">support@carconnect.demo</a>.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">4. Educational Project Disclaimer</h2>
                            <p>
                                As this is a demonstration project, no real money is transferred. "Refunds" in this context refer to the simulated reversal of simulated transactions.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default RefundPolicy;
