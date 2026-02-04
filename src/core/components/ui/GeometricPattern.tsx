import React from 'react';
import {
    BlueStar,
    YellowBox,
    YellowQuarter,
    WineFrame,
    LightBlueDiagonal,
    GreyQuarter,
    BlueCutout,
    BlueQuarter,
    WineBox,
    GreyPill
} from './GeometricShapes';

interface GeometricPatternProps {
    variant: 'corner-tl' | 'corner-tr' | 'corner-bl' | 'corner-br' | 'sidebar-left' | 'sidebar-right' | 'divider' | 'hero-top-left' | 'hero-top-right' | 'hero-bottom-left' | 'hero-bottom-right' | 'footer-strip';
    className?: string;
    size?: number;
}

const ShapeWrapper: React.FC<{ component: React.ElementType; direction?: string; size?: number, className?: string }> = ({
    component: Component,
    direction,
    size = 60,
    className = ''
}) => (
    <div
        className={`flex-shrink-0 ${className}`}
        style={{
            width: `var(--pattern-size, ${size}px)`,
            height: `var(--pattern-size, ${size}px)`
        }}
    >
        <Component size="100%" direction={direction} className="w-full h-full" />
    </div>
);

export default function GeometricPattern({ variant, className = '', size = 60 }: GeometricPatternProps) {

    // Expanded Hero Variants

    if (variant === 'hero-top-left') {
        return (
            <div className={`flex flex-col ${className}`}>
                <div className="flex">
                    <ShapeWrapper component={BlueCutout} direction="tl" size={size} />
                    <ShapeWrapper component={YellowQuarter} direction="tr" size={size} />
                    <ShapeWrapper component={BlueStar} size={size} />
                    <ShapeWrapper component={WineFrame} size={size} />
                    <ShapeWrapper component={GreyQuarter} direction="bl" size={size} />
                </div>
                <div className="flex">
                    <ShapeWrapper component={WineFrame} size={size} />
                    <ShapeWrapper component={YellowBox} size={size} />
                    <ShapeWrapper component={LightBlueDiagonal} direction="br" size={size} />
                    <ShapeWrapper component={BlueQuarter} direction="tl" size={size} />
                </div>
            </div>
        );
    }

    if (variant === 'hero-top-right') {
        return (
            <div className={`flex flex-col items-end ${className}`}>
                <div className="flex">
                    <ShapeWrapper component={GreyQuarter} direction="bl" size={size} />
                    <ShapeWrapper component={BlueStar} size={size} />
                    <ShapeWrapper component={YellowQuarter} direction="tl" size={size} />
                    <ShapeWrapper component={BlueCutout} direction="tr" size={size} />
                    <ShapeWrapper component={WineFrame} size={size} />
                </div>
                <div className="flex">
                    <ShapeWrapper component={YellowQuarter} direction="br" size={size} />
                    <ShapeWrapper component={LightBlueDiagonal} direction="bl" size={size} />
                    <ShapeWrapper component={BlueQuarter} direction="tr" size={size} />
                    <ShapeWrapper component={YellowBox} size={size} />
                </div>
            </div>
        );
    }

    if (variant === 'hero-bottom-left') {
        return (
            <div className={`flex flex-col ${className}`}>
                <div className="flex">
                    <ShapeWrapper component={BlueQuarter} direction="br" size={size} />
                    <ShapeWrapper component={GreyPill} size={size} />
                    <ShapeWrapper component={YellowQuarter} direction="tl" size={size} />
                </div>
                <div className="flex items-end">
                    <ShapeWrapper component={YellowQuarter} direction="bl" size={size} />
                    <ShapeWrapper component={WineFrame} size={size} />
                    <ShapeWrapper component={BlueQuarter} direction="tr" size={size} />
                    <ShapeWrapper component={LightBlueDiagonal} direction="tr" size={size} />
                    <ShapeWrapper component={GreyQuarter} direction="bl" size={size} />
                </div>
            </div>
        );
    }

    if (variant === 'hero-bottom-right') {
        return (
            <div className={`flex flex-col items-end ${className}`}>
                <div className="flex">
                    <ShapeWrapper component={YellowBox} size={size} />
                    <ShapeWrapper component={LightBlueDiagonal} direction="tl" size={size} />
                    <ShapeWrapper component={WineFrame} size={size} />
                </div>
                <div className="flex items-end">
                    <ShapeWrapper component={GreyQuarter} direction="br" size={size} />
                    <ShapeWrapper component={BlueStar} size={size} />
                    <ShapeWrapper component={BlueQuarter} direction="tl" size={size} />
                    <ShapeWrapper component={WineFrame} size={size} />
                    <ShapeWrapper component={YellowQuarter} direction="br" size={size} />
                </div>
            </div>
        );
    }

    // Other Variants

    if (variant === 'corner-tl') {
        return (
            <div className={`flex flex-col ${className}`}>
                <div className="flex">
                    <ShapeWrapper component={YellowQuarter} direction="br" size={size} />
                    <ShapeWrapper component={BlueCutout} direction="bl" size={size} />
                </div>
                <div className="flex">
                    <ShapeWrapper component={WineFrame} size={size} />
                    <ShapeWrapper component={GreyQuarter} direction="tr" size={size} />
                </div>
            </div>
        );
    }

    if (variant === 'corner-tr') {
        return (
            <div className={`flex flex-col items-end ${className}`}>
                <div className="flex">
                    <ShapeWrapper component={LightBlueDiagonal} direction="br" size={size} />
                    <ShapeWrapper component={YellowBox} size={size} />
                </div>
                <div className="flex">
                    <ShapeWrapper component={BlueQuarter} direction="tl" size={size} />
                    <ShapeWrapper component={WineFrame} size={size} />
                </div>
            </div>
        );
    }

    if (variant === 'corner-bl') {
        return (
            <div className={`flex flex-col ${className}`}>
                <div className="flex">
                    <ShapeWrapper component={BlueQuarter} direction="br" size={size} />
                    <ShapeWrapper component={WineBox} size={size} />
                </div>
                <div className="flex">
                    <ShapeWrapper component={YellowQuarter} direction="tr" size={size} />
                    <ShapeWrapper component={GreyQuarter} direction="bl" size={size} />
                </div>
            </div>
        );
    }

    if (variant === 'corner-br') {
        return (
            <div className={`flex flex-col items-end ${className}`}>
                <div className="flex">
                    <ShapeWrapper component={WineFrame} size={size} />
                    <ShapeWrapper component={BlueStar} size={size} />
                </div>
                <div className="flex">
                    <ShapeWrapper component={YellowQuarter} direction="tl" size={size} />
                    <ShapeWrapper component={LightBlueDiagonal} direction="br" size={size} />
                </div>
            </div>
        );
    }

    if (variant === 'sidebar-left') {
        return (
            <div className={`flex flex-col ${className}`}>
                <ShapeWrapper component={WineFrame} size={size} />
                <ShapeWrapper component={BlueQuarter} direction="tr" size={size} />
                <ShapeWrapper component={YellowBox} size={size} />
                <ShapeWrapper component={GreyQuarter} direction="br" size={size} />
            </div>
        );
    }

    if (variant === 'sidebar-right') {
        return (
            <div className={`flex flex-col items-end ${className}`}>
                <ShapeWrapper component={WineFrame} size={size} />
                <ShapeWrapper component={BlueQuarter} direction="tl" size={size} />
                <ShapeWrapper component={YellowBox} size={size} />
                <ShapeWrapper component={GreyQuarter} direction="bl" size={size} />
            </div>
        );
    }

    if (variant === 'divider') {
        return (
            <div className={`flex justify-center ${className}`}>
                <ShapeWrapper component={GreyQuarter} direction="br" size={size} />
                <ShapeWrapper component={BlueQuarter} direction="bl" size={size} />
                <ShapeWrapper component={YellowQuarter} direction="tr" size={size} />
                <ShapeWrapper component={WineFrame} size={size} />
            </div>
        )
    }

    if (variant === 'footer-strip') {
        const shapes = [
            { C: BlueQuarter, d: 'tr' }, { C: YellowBox }, { C: GreyPill },
            { C: WineFrame }, { C: BlueStar }, { C: LightBlueDiagonal, d: 'tl' },
            { C: GreyQuarter, d: 'bl' }, { C: BlueCutout, d: 'br' }, { C: YellowQuarter, d: 'tl' },
            { C: WineBox }, { C: BlueQuarter, d: 'br' }, { C: YellowQuarter, d: 'bl' },
            { C: LightBlueDiagonal, d: 'tr' }, { C: GreyPill }, { C: BlueStar },
            { C: WineFrame }, { C: YellowBox }, { C: BlueCutout, d: 'tl' }
        ];

        return (
            <div className={`flex w-full overflow-hidden ${className}`}>
                {shapes.map((s, i) => (
                    <ShapeWrapper
                        key={i}
                        component={s.C}
                        direction={s.d}
                        size={size}
                        className="flex-shrink-0"
                    />
                ))}
                {/* Repeat to ensure full coverage on large screens */}
                {shapes.map((s, i) => (
                    <ShapeWrapper
                        key={`repeat-${i}`}
                        component={s.C}
                        direction={s.d}
                        size={size}
                        className="flex-shrink-0 lg:block hidden"
                    />
                ))}
            </div>
        );
    }

    return null;
}
