import type { ReactNode } from 'react';
import { GradientText } from './GradientText';

interface SectionTitleProps {
    children: ReactNode;
    subtitle?: string;
    accentText?: string;
    accentColor?: 'blue' | 'gray' | 'default';
    centered?: boolean;
    className?: string;
}

export function SectionTitle({
    children,
    subtitle,
    accentText,
    accentColor = 'default',
    centered = true,
    className = '',
}: SectionTitleProps) {
    const alignmentStyles = centered ? 'text-center' : '';

    const renderAccent = () => {
        if (!accentText) return null;

        if (accentColor === 'default') {
            return <GradientText>{accentText}</GradientText>;
        }

        const colorClass = accentColor === 'blue' ? 'text-blue-600' : 'text-gray-500';
        return <span className={colorClass}>{accentText}</span>;
    };

    return (
        <div className={`mb-12 md:mb-16 ${alignmentStyles} ${className}`}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                {children} {renderAccent()}
            </h2>
            {subtitle && (
                <p className="text-gray-500 max-w-2xl mx-auto">{subtitle}</p>
            )}
        </div>
    );
}
