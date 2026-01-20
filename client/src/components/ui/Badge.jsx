import React from 'react';

const Badge = ({
    children,
    variant = 'neutral', // neutral, primary, success, warning, error, info
    className = '',
    size = 'md', // sm, md
}) => {
    const variants = {
        neutral: 'bg-neutral text-text-muted border-neutral-foreground/10',
        primary: 'bg-primary/10 text-primary border-primary/20',
        success: 'bg-success/10 text-success border-success/20',
        warning: 'bg-warning/10 text-warning border-warning/20',
        error: 'bg-error/10 text-error border-error/20',
        info: 'bg-info/10 text-info border-info/20',
    };

    const sizes = {
        sm: 'text-[10px] px-1.5 py-0.5',
        md: 'text-xs px-2.5 py-1',
    };

    return (
        <span className={`
      inline-flex items-center justify-center font-bold rounded-full border
      ${variants[variant]}
      ${sizes[size]}
      ${className}
    `}>
            {children}
        </span>
    );
};

export default Badge;
