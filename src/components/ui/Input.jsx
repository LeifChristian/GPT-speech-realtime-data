import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const Input = React.forwardRef(({ className, type = "text", variant = "default", ...props }, ref) => {
    const variants = {
        default: "border-gray-300 bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500",
        glass: "glass-dark border-white/20 bg-transparent text-white placeholder:text-gray-400 focus:border-white/40 focus:ring-white/20"
    };

    return (
        <motion.input
            type={type}
            className={clsx(
                "flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                variants[variant],
                className
            )}
            ref={ref}
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.1 }}
            {...props}
        />
    );
});
Input.displayName = "Input";

const TextArea = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
    const variants = {
        default: "border-gray-300 bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500",
        glass: "glass-dark border-white/20 bg-transparent text-white placeholder:text-gray-400 focus:border-white/40 focus:ring-white/20"
    };

    return (
        <motion.textarea
            className={clsx(
                "flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
                variants[variant],
                className
            )}
            ref={ref}
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.1 }}
            {...props}
        />
    );
});
TextArea.displayName = "TextArea";

export { Input, TextArea };
