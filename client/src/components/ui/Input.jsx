import React, { forwardRef } from 'react';

const Input = forwardRef(({
    label,
    error,
    leftIcon,
    rightIcon,
    className = '',
    containerClassName = '',
    type = 'text',
    ...props
}, ref) => {
    return (
        <div className={`w-full ${containerClassName}`}>
            {label && (
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                {leftIcon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary transition-colors">
                        {leftIcon}
                    </div>
                )}

                <input
                    ref={ref}
                    type={type}
                    className={`
            w-full bg-surface border border-input rounded-xl 
            ${leftIcon ? 'pl-10' : 'pl-4'} 
            ${rightIcon ? 'pr-10' : 'pr-4'} 
            py-3 text-sm font-medium text-text placeholder:text-text-muted/60
            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
            disabled:opacity-50 disabled:bg-neutral disabled:cursor-not-allowed
            transition-all duration-200
            ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}
            ${className}
          `}
                    {...props}
                />

                {rightIcon && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {rightIcon}
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1 text-xs text-error font-medium ml-1 animate-slide-up">
                    {error}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
