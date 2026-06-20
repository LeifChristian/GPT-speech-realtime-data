import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const Button = React.forwardRef(({
    className,
    variant = 'default',
    size = 'default',
    asChild = false,
    children,
    disabled,
    onClick,
    onTouchEnd,
    type = 'button',
    ...props
}, ref) => {
    const variants = {
        default: "bg-primary-600 hover:bg-primary-700 text-white border-transparent",
        destructive: "bg-red-500 hover:bg-red-600 text-white border-transparent",
        outline: "border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700 hover:text-gray-900",
        secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900 border-transparent",
        ghost: "bg-transparent hover:bg-gray-100 text-gray-700 border-transparent",
        link: "bg-transparent underline-offset-4 hover:underline text-primary-600 border-transparent p-0",
        glass: "glass text-white hover:bg-white/20 border-white/20"
    };

    const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-sm",
        lg: "h-11 px-8 text-base",
        icon: "h-10 w-10"
    };

    const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border";

    const classes = clsx(
        baseClasses,
        variants[variant],
        sizes[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
    );

    const Comp = asChild ? motion.div : motion.button;

    return (
        <Comp
            className={classes}
            ref={ref}
            disabled={disabled}
            type={type}
            onClick={onClick}
            onTouchEnd={onTouchEnd || ((e) => { if (onClick) { e.preventDefault(); onClick(e); } })}
            style={{ touchAction: 'manipulation' }}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            transition={{ duration: 0.1 }}
            {...props}
        >
            {children}
        </Comp>
    );
});

Button.displayName = "Button";

export { Button };
