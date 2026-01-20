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
                        Shipping and Delivery Policy
                    </h1>

                    <div className="space-y-6 text-text-muted leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">1. International Buyers</h2>
                            <p>
                                For International buyers, orders are shipped and delivered through registered international courier companies and/or International speed post only.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">2. Domestic Buyers</h2>
                            <p>
                                For domestic buyers, orders are shipped through registered domestic courier companies and/or speed post only.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">3. Delivery Timelines</h2>
                            <p>
                                Orders are shipped within Not Applicable days or as per the delivery date agreed at the time of order confirmation and delivering of the shipment subject to Courier Company / post office norms.
                            </p>
                            <p className="mt-2">
                                KRUSHNA RAKESH GANGURDE is not liable for any delay in delivery by the courier company / postal authorities and only guarantees to hand over the consignment to the courier company or postal authorities within Not Applicable days from the date of the order and payment or as per the delivery date agreed at the time of order confirmation.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">4. Delivery Address and Confirmation</h2>
                            <p>
                                Delivery of all orders will be to the address provided by the buyer. Delivery of our services will be confirmed on your mail ID as specified during registration.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">5. Contact Information</h2>
                            <p>
                                For any issues in utilizing our services you may contact our helpdesk on <strong>8999283790</strong> or <a href="mailto:tycog12025@gmail.com" className="text-primary hover:underline">tycog12025@gmail.com</a>.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ShippingPolicy;
