import type { ReactNode } from 'react';

interface SectionProps {
    id?: string;
    children: ReactNode;
    className?: string;
    variant?: 'white' | 'gray';
}

export function Section({
    id,
    children,
    className = '',
    variant = 'white',
}: SectionProps) {
    const bgStyles = variant === 'gray' ? 'bg-gray-100' : 'bg-white';

    return (
        <section
            id={id}
            className={`py-20 md:py-24 relative ${bgStyles} ${className}`}
        >
            {children}
        </section>
    );
}
