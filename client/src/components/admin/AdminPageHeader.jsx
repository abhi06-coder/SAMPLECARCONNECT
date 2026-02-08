import React from 'react';
import { motion } from 'framer-motion';

const AdminPageHeader = ({ title, subtitle, children }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
            <div>
                <h1 className="text-3xl font-bold font-heading text-text tracking-tight">{title}</h1>
                {subtitle && <p className="text-text-muted mt-1">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3">
                {children}
            </div>
        </motion.div>
    );
};

export default AdminPageHeader;
