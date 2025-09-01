import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const Card = React.forwardRef(({ className, children, ...props }, ref) => {
    return (
        <motion.div
            ref={ref}
            className={clsx(
                "rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm",
                className
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            {...props}
        >
            {children}
        </motion.div>
    );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={clsx("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, children, ...props }, ref) => (
    <h3
        ref={ref}
        className={clsx("text-2xl font-semibold leading-none tracking-tight", className)}
        {...props}
    >
        {children}
    </h3>
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={clsx("text-sm text-gray-500", className)}
        {...props}
    />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={clsx("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={clsx("flex items-center p-6 pt-0", className)}
        {...props}
    />
));
CardFooter.displayName = "CardFooter";

// Glass variant for dark theme
const GlassCard = React.forwardRef(({ className, children, ...props }, ref) => {
    return (
        <motion.div
            ref={ref}
            className={clsx("glass-dark text-white shadow-xl", className)}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
            {...props}
        >
            {children}
        </motion.div>
    );
});
GlassCard.displayName = "GlassCard";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, GlassCard };
