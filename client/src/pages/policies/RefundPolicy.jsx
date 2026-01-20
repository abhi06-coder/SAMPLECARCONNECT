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
                            <p>
                                KRUSHNA RAKESH GANGURDE believes in helping its customers as far as possible, and has therefore a liberal cancellation policy.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">1. Cancellation Policy</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    Cancellations will be considered only if the request is made within <strong>1-2 days</strong> of placing the order.
                                </li>
                                <li>
                                    However, the cancellation request may not be entertained if the orders have been communicated to the vendors/merchants and they have initiated the process of shipping them.
                                </li>
                                <li>
                                    KRUSHNA RAKESH GANGURDE does not accept cancellation requests for perishable items like flowers, eatables etc. However, refund/replacement can be made if the customer establishes that the quality of product delivered is not good.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">2. Damaged or Defective Items</h2>
                            <p>
                                In case of receipt of damaged or defective items please report the same to our Customer Service team. The request will, however, be entertained once the merchant has checked and determined the same at his own end.
                            </p>
                            <p className="mt-2">
                                This should be reported within <strong>1-2 days</strong> of receipt of the products.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">3. Product Not As Expected</h2>
                            <p>
                                In case you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within <strong>1-2 days</strong> of receiving the product. The Customer Service Team after looking into your complaint will take an appropriate decision.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">4. Warranty</h2>
                            <p>
                                In case of complaints regarding products that come with a warranty from manufacturers, please refer the issue to them.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-text mb-3">5. Refund Processing</h2>
                            <p>
                                In case of any Refunds approved by the KRUSHNA RAKESH GANGURDE, it’ll take <strong>1-2 days</strong> for the refund to be processed to the end customer.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default RefundPolicy;
