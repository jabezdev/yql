import type { ReactNode, ElementType, ComponentPropsWithoutRef } from 'react';

type GradientTextProps<T extends ElementType = 'span'> = {
    children: ReactNode;
    className?: string;
    as?: T;
} & ComponentPropsWithoutRef<T>;

export function GradientText<T extends ElementType = 'span'>({
    children,
    className = '',
    as,
    ...props
}: GradientTextProps<T>) {
    const Component = as || 'span';
    return (
        <Component
            className={`text-blue-600 ${className}`}
            {...props}
        >
            {children}
        </Component>
    );
}
