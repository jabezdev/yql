import type { ReactNode } from 'react';

type CardVariant = 'minimal' | 'subtle' | 'bordered';

interface CardProps {
    children: ReactNode;
    className?: string;
    variant?: CardVariant;
    interactive?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
    minimal: 'bg-white border border-gray-200 shadow-sm',
    subtle: 'bg-gray-100',
    bordered: 'bg-white border border-gray-300 shadow-sm',
};

export function Card({
    children,
    className = '',
    variant = 'minimal',
    interactive = false,
}: CardProps) {
    const baseStyles = 'rounded-xl overflow-hidden';
    const interactiveStyles = interactive
        ? 'hover:border-gray-400 hover:shadow-md transition-all duration-300'
        : '';

    return (
        <div
            className={`${baseStyles} ${variantStyles[variant]} ${interactiveStyles} ${className}`}
        >
            {children}
        </div>
    );
}
