import type { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'white' | 'geometric-primary' | 'geometric-secondary' | 'outline' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
    fullWidth?: boolean;
}

type ButtonAsButton = BaseButtonProps &
    ButtonHTMLAttributes<HTMLButtonElement> & {
        as?: 'button';
        href?: never;
    };

type ButtonAsLink = BaseButtonProps &
    AnchorHTMLAttributes<HTMLAnchorElement> & {
        as: 'a';
        href: string;
    };

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantStyles: Record<ButtonVariant, string> = {
    primary:
        'bg-gray-900 text-white font-medium hover:bg-gray-800 rounded-lg',
    secondary:
        'bg-white text-gray-900 font-medium border border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-lg',
    ghost:
        'bg-transparent text-gray-600 font-medium hover:text-gray-900 hover:bg-gray-50 rounded-lg',
    white:
        'bg-white text-gray-900 font-medium hover:bg-gray-100 rounded-lg',
    'geometric-primary':
        'bg-brand-blueDark text-white font-bold hover:bg-brand-darkBlue shadow-lg hover:shadow-xl hover:-translate-y-1 rounded-tl-2xl rounded-br-2xl border-2 border-transparent',
    'geometric-secondary':
        'bg-white text-brand-blueDark font-bold border-2 border-brand-blueDark hover:bg-brand-blueDark hover:text-white shadow-sm hover:shadow-md rounded-tl-2xl rounded-br-2xl',
    outline:
        'bg-white text-gray-900 font-medium border border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-lg',
    destructive:
        'bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-4 text-lg',
};

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    fullWidth = false,
    as = 'button',
    ...props
}: ButtonProps) {
    const baseStyles =
        'inline-flex items-center justify-center gap-2 transition-all duration-200';
    const widthStyles = fullWidth ? 'w-full' : '';

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`;

    if (as === 'a') {
        const { href, ...anchorProps } = props as ButtonAsLink;
        return (
            <a href={href} className={combinedClassName} {...anchorProps}>
                {children}
            </a>
        );
    }

    return (
        <button className={combinedClassName} {...(props as ButtonAsButton)}>
            {children}
        </button>
    );
}
