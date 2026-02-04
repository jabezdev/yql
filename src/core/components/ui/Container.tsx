import type { ReactNode, ElementType, ComponentPropsWithoutRef } from 'react';

type ContainerProps<T extends ElementType = 'div'> = {
    children: ReactNode;
    className?: string;
    as?: T;
} & ComponentPropsWithoutRef<T>;

export function Container<T extends ElementType = 'div'>({
    children,
    className = '',
    as,
    ...props
}: ContainerProps<T>) {
    const Component = as || 'div';
    return (
        <Component className={`container mx-auto px-6 ${className}`} {...props}>
            {children}
        </Component>
    );
}
