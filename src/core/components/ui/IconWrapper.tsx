import type { LucideIcon } from 'lucide-react';

interface IconWrapperProps {
    icon: LucideIcon;
    size?: 'sm' | 'md' | 'lg';
    color?: string;
    className?: string;
}

const sizeStyles = {
    sm: {
        wrapper: 'p-2.5 rounded-lg',
        icon: 'w-5 h-5',
    },
    md: {
        wrapper: 'p-3 rounded-xl',
        icon: 'w-6 h-6',
    },
    lg: {
        wrapper: 'p-4 rounded-xl',
        icon: 'w-8 h-8',
    },
};

export function IconWrapper({
    icon: Icon,
    size = 'md',
    color = 'text-gray-600',
    className = '',
}: IconWrapperProps) {
    const styles = sizeStyles[size];

    return (
        <div
            className={`bg-gray-200 w-fit ${styles.wrapper} ${className}`}
        >
            <Icon className={`${styles.icon} ${color}`} />
        </div>
    );
}
