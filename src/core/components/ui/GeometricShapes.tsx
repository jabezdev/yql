import React from 'react';
import { BrandColors, type ShapeProps, type QuarterCircleProps } from './shape-utils';

const COLORS = BrandColors;

/**
 * Blue Star: Light blue square with a 4-point star on darker blue
 */
/**
 * Blue Star: Dark blue 4-point star created by 4 light blue quarter circles
 */
export const BlueStar: React.FC<ShapeProps> = ({ size = 100, className = '', fillColor }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={className}
    >
        <rect width="100" height="100" fill={fillColor || COLORS.darkBlue} />
        {/* TL */}
        <path d="M 0 50 A 50 50 0 0 0 50 0 L 0 0 Z" fill={COLORS.lightBlue} />
        {/* TR */}
        <path d="M 50 0 A 50 50 0 0 0 100 50 L 100 0 Z" fill={COLORS.lightBlue} />
        {/* BR */}
        <path d="M 100 50 A 50 50 0 0 0 50 100 L 100 100 Z" fill={COLORS.lightBlue} />
        {/* BL */}
        <path d="M 50 100 A 50 50 0 0 0 0 50 L 0 100 Z" fill={COLORS.lightBlue} />
    </svg>
);

/**
 * Yellow Box: A solid yellow square
 */
export const YellowBox: React.FC<ShapeProps> = ({ size = 100, className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={className}
    >
        <rect width="100" height="100" fill={COLORS.yellow} />
    </svg>
);

/**
 * Yellow Quarter Circle: Yellow quarter circle that may face different directions
 */
export const YellowQuarter: React.FC<QuarterCircleProps> = ({
    size = 100,
    direction = 'br',
    className = '',
}) => {
    const paths: Record<string, string> = {
        tl: 'M 100 0 A 100 100 0 0 1 0 100 L 0 0 Z',
        tr: 'M 0 0 A 100 100 0 0 1 100 100 L 100 0 Z',
        bl: 'M 0 0 A 100 100 0 0 0 100 100 L 0 100 Z',
        br: 'M 100 0 A 100 100 0 0 0 0 100 L 100 100 Z',
    };

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            className={className}
        >
            <path d={paths[direction]} fill={COLORS.yellow} />
        </svg>
    );
};

/**
 * Wine Box: Wine-colored square with transparent center (thick inner border effect)
 */
export const WineBox: React.FC<ShapeProps> = ({ size = 100, className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={className}
    >
        <rect width="100" height="100" fill={COLORS.wine} />
        <rect x="20" y="20" width="60" height="60" fill="transparent" />
    </svg>
);

/**
 * Wine Frame: Wine-colored square with fully transparent center for overlays
 */
export const WineFrame: React.FC<ShapeProps> = ({ size = 100, className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={className}
    >
        <path
            d="M 0 0 L 100 0 L 100 100 L 0 100 Z M 20 20 L 20 80 L 80 80 L 80 20 Z"
            fill={COLORS.wine}
            fillRule="evenodd"
        />
    </svg>
);

/**
 * Light Blue Diagonal: Square split diagonally with one side light blue
 */
export const LightBlueDiagonal: React.FC<QuarterCircleProps> = ({
    size = 100,
    direction = 'br',
    className = '',
    fillColor,
}) => {
    // Direction determines which corner the blue triangle points to
    const paths: Record<string, string> = {
        tl: 'M 0 0 L 100 0 L 0 100 Z',
        tr: 'M 0 0 L 100 0 L 100 100 Z',
        bl: 'M 0 0 L 0 100 L 100 100 Z',
        br: 'M 100 0 L 100 100 L 0 100 Z',
    };

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            className={className}
        >
            <path d={paths[direction]} fill={fillColor || COLORS.blue} />
        </svg>
    );
};

/**
 * Grey Pill (Leaf): Diagonal leaf shape formed by intersection of two quarter circles
 */
export const GreyPill: React.FC<ShapeProps> = ({
    size = 100,
    className = '',
}) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            className={className}
        >
            <path
                d="M 0 100 A 100 100 0 0 1 100 0 A 100 100 0 0 1 0 100 Z"
                fill={COLORS.gray}
            />
        </svg>
    );
};

/**
 * Grey Quarter: Gray quarter circle (same as yellow quarter but gray)
 */
export const GreyQuarter: React.FC<QuarterCircleProps> = ({
    size = 100,
    direction = 'br',
    className = '',
}) => {
    const paths: Record<string, string> = {
        tl: 'M 100 0 A 100 100 0 0 1 0 100 L 0 0 Z',
        tr: 'M 0 0 A 100 100 0 0 1 100 100 L 100 0 Z',
        bl: 'M 0 0 A 100 100 0 0 0 100 100 L 0 100 Z',
        br: 'M 100 0 A 100 100 0 0 0 0 100 L 100 100 Z',
    };

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            className={className}
        >
            <path d={paths[direction]} fill={COLORS.gray} />
        </svg>
    );
};

/**
 * Blue Cutout: Dark blue square with transparent quarter-circle cutout and diagonal
 */
export const BlueCutout: React.FC<QuarterCircleProps> = ({
    size = 100,
    direction = 'br',
    className = '',
    fillColor,
}) => {
    // The shape has: dark blue background, quarter circle cutout, diagonal line in cutout
    const cutoutPaths: Record<string, { cutout: string; diagonal: string }> = {
        tl: {
            cutout: 'M 0 0 L 100 0 L 100 100 L 0 100 Z M 0 0 A 100 100 0 0 0 100 100',
            diagonal: 'M 0 0 L 100 100',
        },
        tr: {
            cutout: 'M 0 0 L 100 0 L 100 100 L 0 100 Z M 100 0 A 100 100 0 0 1 0 100',
            diagonal: 'M 100 0 L 0 100',
        },
        bl: {
            cutout: 'M 0 0 L 100 0 L 100 100 L 0 100 Z M 0 100 A 100 100 0 0 1 100 0',
            diagonal: 'M 0 100 L 100 0',
        },
        br: {
            cutout: 'M 0 0 L 100 0 L 100 100 L 0 100 Z M 100 100 A 100 100 0 0 0 0 0',
            diagonal: 'M 100 100 L 0 0',
        },
    };

    const { cutout, diagonal } = cutoutPaths[direction];

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            className={className}
        >
            <path d={cutout} fill={fillColor || COLORS.blueDark} fillRule="evenodd" />
            <line
                x1={diagonal.split(' ')[0].replace('M', '').split(',')[0] || (diagonal.includes('M 0 0') ? 0 : diagonal.includes('M 100 0') ? 100 : diagonal.includes('M 0 100') ? 0 : 100)}
                y1={diagonal.includes('M 0 0') || diagonal.includes('M 100 0') ? 0 : 100}
                x2={diagonal.includes('L 100 100') || diagonal.includes('L 100 0') ? 100 : 0}
                y2={diagonal.includes('L 100 100') || diagonal.includes('L 0 100') ? 100 : 0}
                stroke={fillColor || COLORS.blueDark}
                strokeWidth="3"
            />
        </svg>
    );
};

/**
 * Blue Quarter: Dark blue quarter circle
 */
export const BlueQuarter: React.FC<QuarterCircleProps> = ({
    size = 100,
    direction = 'br',
    className = '',
    fillColor
}) => {
    const paths: Record<string, string> = {
        tl: 'M 100 0 A 100 100 0 0 1 0 100 L 0 0 Z',
        tr: 'M 0 0 A 100 100 0 0 1 100 100 L 100 0 Z',
        bl: 'M 0 0 A 100 100 0 0 0 100 100 L 0 100 Z',
        br: 'M 100 0 A 100 100 0 0 0 0 100 L 100 100 Z',
    };

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            className={className}
        >
            <path d={paths[direction]} fill={fillColor || COLORS.blueDark} />
        </svg>
    );
};


