import React from 'react';
import { motion } from 'framer-motion';

const Button = ({
    children,
    variant = 'primary', // primary, secondary, outline, ghost, danger
    size = 'md', // sm, md, lg
    className = '',
    isLoading = false,
    disabled = false,
    fullWidth = false,
    icon = null,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-bold transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-hover hover:shadow-primary/40 active:scale-[0.98]',
        secondary: 'bg-secondary text-white shadow-lg shadow-secondary/25 hover:bg-pink-600 hover:shadow-secondary/40 active:scale-[0.98]',
        outline: 'bg-transparent border-2 border-border text-text hover:border-primary hover:text-primary active:scale-[0.98]',
        ghost: 'bg-transparent text-text-muted hover:text-text hover:bg-neutral active:scale-[0.98]',
        danger: 'bg-error text-white shadow-lg shadow-error/25 hover:bg-red-600 hover:shadow-error/40 active:scale-[0.98]',
        link: 'bg-transparent text-primary hover:underline p-0 h-auto font-medium',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-6 py-3 text-sm',
        lg: 'px-8 py-4 text-base',
        icon: 'p-2', // For icon-only buttons
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <motion.button
            whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : icon ? (
                <span className="mr-2">{icon}</span>
            ) : null}
            {children}
        </motion.button>
    );
};

export default Button;
