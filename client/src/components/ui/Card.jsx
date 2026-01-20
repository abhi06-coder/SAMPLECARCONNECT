import React from 'react';
import { motion } from 'framer-motion';

const Card = ({
    children,
    className = '',
    hoverEffect = false,
    noPadding = false,
    ...props
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`
        bg-surface border border-border rounded-2xl shadow-sm overflow-hidden
        ${hoverEffect ? 'hover:shadow-md hover:border-primary/30 transition-all duration-300' : ''}
        ${noPadding ? '' : 'p-6'}
        ${className}
      `}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default Card;
