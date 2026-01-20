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

                    <div className="space-y-6 text-text-muted leading-relaxed text-left">
                        <section>
                            <p>
                                For the purpose of these Terms and Conditions, The term "we", "us", "our" used anywhere on this page shall mean <strong>KRUSHNA RAKESH GANGURDE</strong>, whose registered/operational office is <strong>FLAT NO 18 BUILDING NO 2 SAIBHANDHAN, SOCIETY INDIRA NAGAR WADALA PATHARDI ROAD, NASHIK NASHIK MAHARASHTRA 422009</strong>. "you", “your”, "user", “visitor” shall mean any natural or legal person who is visiting our website and/or agreed to purchase from us.
                            </p>
                            <p className="mt-4">
                                Your use of the website and/or purchase from us are governed by following Terms and Conditions:
                            </p>
                        </section>

                        <ul className="list-disc pl-5 space-y-4">
                            <li>
                                The content of the pages of this website is subject to change without notice.
                            </li>
                            <li>
                                Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information and materials found or offered on this website for any particular purpose. You acknowledge that such information and materials may contain inaccuracies or errors and we expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law.
                            </li>
                            <li>
                                Your use of any information or materials on our website and/or product pages is entirely at your own risk, for which we shall not be liable. It shall be your own responsibility to ensure that any products, services or information available through our website and/or product pages meet your specific requirements.
                            </li>
                            <li>
                                Our website contains material which is owned by or licensed to us. This material includes, but are not limited to, the design, layout, look, appearance and graphics. Reproduction is prohibited other than in accordance with the copyright notice, which forms part of these terms and conditions.
                            </li>
                            <li>
                                All trademarks reproduced in our website which are not the property of, or licensed to, the operator are acknowledged on the website.
                            </li>
                            <li>
                                Unauthorized use of information provided by us shall give rise to a claim for damages and/or be a criminal offense.
                            </li>
                            <li>
                                From time to time our website may also include links to other websites. These links are provided for your convenience to provide further information. You may not create a link to our website from another website or document without KRUSHNA RAKESH GANGURDE’s prior written consent.
                            </li>
                            <li>
                                Any dispute arising out of use of our website and/or purchase with us and/or any engagement with us is subject to the laws of India.
                            </li>
                            <li>
                                We, shall be under no liability whatsoever in respect of any loss or damage arising directly or indirectly out of the decline of authorization for any Transaction, on Account of the Cardholder having exceeded the preset limit mutually agreed by us with our acquiring bank from time to time.
                            </li>
                        </ul>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default TermsAndConditions;
